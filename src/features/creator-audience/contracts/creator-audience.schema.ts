import { z } from "zod";

const limitation = z.string().trim().min(1).max(160);
const dimension = z
  .object({
    id: z.enum(["AGE", "GENDER", "COUNTRY", "CITY"]),
    state: z.enum(["AVAILABLE", "UNAVAILABLE", "PROVIDER_FAILURE"]),
    denominatorValid: z.boolean(),
    buckets: z
      .array(
        z
          .object({
            key: z.string().trim().min(1).max(100),
            count: z.number().int().nonnegative(),
            percentage: z.number().min(0).max(100).nullable(),
          })
          .strict(),
      )
      .max(45),
    limitations: z.array(limitation).max(8),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      !value.denominatorValid &&
      value.buckets.some((bucket) => bucket.percentage !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage requires denominator authority",
      });
    }
    if (value.state !== "AVAILABLE" && value.buckets.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unavailable dimensions cannot contain buckets",
      });
    }
  });

const creatorAudienceSourceSchema = z
  .object({
    contractVersion: z.literal("creator_audience_v0.1"),
    generatedAt: z.string().datetime(),
    status: z.enum(["READY", "PARTIAL", "UNAVAILABLE"]),
    context: z
      .object({ role: z.enum(["OWNER", "MANAGER", "ASSISTANT"]) })
      .strict(),
    source: z.literal("INSTAGRAM"),
    sourceStatus: z.enum([
      "CONNECTED",
      "PROCESSING",
      "DISCONNECTED",
      "REAUTH_REQUIRED",
      "CAPABILITY_PARTIAL",
      "CAPABILITY_UNKNOWN",
      "PROVIDER_FAILURE",
    ]),
    snapshotBasis: z
      .object({
        period: z.literal("lifetime"),
        timeframe: z.literal("this_month"),
        capturedAt: z.string().datetime().nullable(),
      })
      .strict(),
    defaultCohort: z.enum(["FOLLOWERS", "ENGAGED"]).nullable(),
    highlights: z
      .array(
        z
          .object({
            id: z.string().min(1).max(120),
            text: z.string().min(1).max(240),
            evidence: z.array(z.string().min(1).max(120)).min(1).max(8),
          })
          .strict(),
      )
      .max(3),
    cohorts: z
      .array(
        z
          .object({
            id: z.enum(["FOLLOWERS", "ENGAGED"]),
            availability: z.enum(["AVAILABLE", "PARTIAL", "UNAVAILABLE"]),
            size: z.number().int().nonnegative().nullable(),
            dimensions: z.array(dimension).max(4),
            limitations: z.array(limitation).max(12),
          })
          .strict(),
      )
      .max(2),
    freshness: z
      .object({
        state: z.enum(["CURRENT", "STALE", "UNKNOWN"]),
        staleAfterHours: z.literal(192),
      })
      .strict(),
    processingState: z.enum(["IDLE", "PROCESSING", "FAILED"]),
    currentPreserved: z.boolean(),
    limitations: z.array(limitation).max(16),
    settingsRecoveryRoute: z.literal("/creator/settings/instagram"),
  })
  .strict();

const AUDIENCE_V1_VERSION = "creator_audience_v1.1" as const;
const AUDIENCE_V1_MAX_HISTORY = 64;
const ref = z.string().trim().min(1).max(255);
const refs = z.array(ref).min(1).max(64);
const text = z.string().trim().min(1).max(240);
const cohort = z.enum(["FOLLOWERS", "ENGAGED"]);
const factDimension = z.enum(["AGE", "GENDER", "COUNTRY", "CITY"]);
const fact = z
  .object({
    cohort,
    dimension: factDimension,
    bucket: z.string().min(1).max(100),
    count: z.number().int().nonnegative(),
    percentage: z.number().min(0).max(100).nullable(),
    evidenceRefs: refs,
  })
  .strict();
export const creatorAudienceSchema = creatorAudienceSourceSchema
  .extend({
    contractVersion: z.literal(AUDIENCE_V1_VERSION),
    overview: z
      .object({
        accountFollowerCount: z.number().int().nonnegative().nullable(),
        facts: z.array(fact).max(8),
      })
      .strict(),
    profiles: z
      .array(
        z
          .object({
            cohort,
            cohortSize: z.number().int().nonnegative().nullable(),
            facts: z.array(fact).max(4),
            coverage: z
              .object({
                availableDimensions: z.number().int().min(0).max(4),
                requiredDimensions: z.literal(4),
              })
              .strict(),
            limitations: z.array(text).max(16),
          })
          .strict(),
      )
      .max(2),
    contentContext: z
      .array(
        z
          .object({
            audienceFact: fact,
            contentFact: z
              .object({
                text,
                evidenceRefs: refs,
                capturedAt: z.string().datetime(),
              })
              .strict(),
            interpretation: z.literal(
              "SEPARATE_SOURCE_FACTS_NOT_AUDIENCE_PREFERENCE",
            ),
          })
          .strict(),
      )
      .max(2),
    change: z
      .object({
        state: z.enum([
          "NOT_PROCESSED",
          "AVAILABLE",
          "INSUFFICIENT_COMPARABLE_HISTORY",
          "SERIES_BREAK",
          "NO_MATERIAL_CHANGE",
        ]),
        observations: z
          .array(
            z
              .object({
                cohort,
                dimension: factDimension,
                bucket: z.string().min(1).max(100),
                priorPercentage: z.number().min(0).max(100),
                latestPercentage: z.number().min(0).max(100),
                percentagePointDelta: z.number().min(-100).max(100),
                snapshotCount: z
                  .number()
                  .int()
                  .min(3)
                  .max(AUDIENCE_V1_MAX_HISTORY),
                elapsedDays: z.number().int().min(14),
                priorCapturedAt: z.string().datetime(),
                latestCapturedAt: z.string().datetime(),
                evidenceRefs: refs,
              })
              .strict(),
          )
          .max(3),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const fail = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (
      value.overview.accountFollowerCount !==
      (value.cohorts.find((row) => row.id === "FOLLOWERS")?.size ?? null)
    )
      fail("Account follower count requires accepted source truth");
    if (
      new Set(value.profiles.map((row) => row.cohort)).size !==
      value.profiles.length
    )
      fail("Cohorts remain distinct");
    for (const profile of value.profiles) {
      const source = value.cohorts.find((row) => row.id === profile.cohort);
      if (
        !source ||
        source.availability === "UNAVAILABLE" ||
        profile.facts.some((row) => row.cohort !== profile.cohort) ||
        profile.coverage.availableDimensions !==
          source.dimensions.filter((row) => row.state === "AVAILABLE").length
      )
        fail("Profiles require their own usable source cohort and coverage");
    }
    const currentFacts = [
      ...value.overview.facts,
      ...value.profiles.flatMap((row) => row.facts),
      ...value.contentContext.map((row) => row.audienceFact),
    ];
    for (const item of currentFacts) {
      const source = value.cohorts
        .find((row) => row.id === item.cohort)
        ?.dimensions.find(
          (row) => row.id === item.dimension && row.state === "AVAILABLE",
        );
      const bucket = source?.buckets.find((row) => row.key === item.bucket);
      if (
        !bucket ||
        bucket.count !== item.count ||
        bucket.percentage !== item.percentage ||
        (item.percentage !== null && !source?.denominatorValid)
      )
        fail("Facts require exact independent source dimension support");
    }
    for (const change of value.change.observations) {
      const latest = value.cohorts
        .find((row) => row.id === change.cohort)
        ?.dimensions.find(
          (row) => row.id === change.dimension && row.denominatorValid,
        )
        ?.buckets.find((row) => row.key === change.bucket);
      if (
        latest?.percentage !== change.latestPercentage ||
        new Set(change.evidenceRefs).size !== change.snapshotCount ||
        Date.parse(change.priorCapturedAt) >=
          Date.parse(change.latestCapturedAt) ||
        Math.abs(
          change.percentagePointDelta -
            Math.round(
              (change.latestPercentage - change.priorPercentage) * 10,
            ) /
              10,
        ) > 0.000001
      )
        fail(
          "Change requires exact source percentages, distinct samples and ordered time",
        );
    }
    if (value.change.state !== "AVAILABLE" && value.change.observations.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unavailable history has no observations",
      });
    if (value.freshness.state !== "CURRENT" && value.contentContext.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Stale Audience cannot imply current context",
      });
  });
export type CreatorAudience = z.infer<typeof creatorAudienceSchema>;

export type CreatorAudienceCohort = CreatorAudience["cohorts"][number];
