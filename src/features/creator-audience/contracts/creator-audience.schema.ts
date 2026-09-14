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

export const creatorAudienceSchema = z
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

export type CreatorAudience = z.infer<typeof creatorAudienceSchema>;
export type CreatorAudienceCohort = CreatorAudience["cohorts"][number];
