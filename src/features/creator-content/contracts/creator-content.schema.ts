import { z } from "zod";

const text = z.string().trim().min(1).max(240);
const refs = z.array(z.string().trim().min(1).max(255)).min(1).max(24);
const confidence = z.enum(["LOW", "MEDIUM"]);
const safePermalink = z
  .string()
  .url()
  .max(500)
  .refine((value) => /^https:\/\//i.test(value), "HTTPS permalink required")
  .nullable();
export const creatorContentMetricSchema = z.enum([
  "INTERACTION_RATE",
  "REACH",
  "VIEWS",
  "LIKES",
  "COMMENTS",
  "SAVES",
  "SHARES",
  "TOTAL_INTERACTIONS",
]);

const media = z
  .object({
    providerMediaId: z.string().trim().min(1).max(100),
    publishedAt: z.string().datetime(),
    mediaType: z.enum(["IMAGE", "CAROUSEL_ALBUM", "VIDEO", "REEL"]),
    permalink: safePermalink,
    semanticState: z.enum(["AVAILABLE", "PARTIAL", "UNKNOWN"]),
    themes: z.array(text).max(8),
    captionPatterns: z.array(text).max(6),
    creativeStructures: z.array(text).max(6),
    visualExecution: z.array(text).max(6),
    metrics: z.record(
      creatorContentMetricSchema,
      z.number().nonnegative().nullable(),
    ),
    evidenceRefs: refs,
  })
  .strict();

export const creatorContentSchema = z
  .object({
    contractVersion: z.literal("creator_content_v0.1"),
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
    snapshot: z
      .object({
        windowDays: z.literal(90),
        windowStart: z.string().datetime(),
        windowEnd: z.string().datetime(),
        eligibleCount: z.number().int().nonnegative().max(24),
        providerRowsReturned: z.number().int().nonnegative(),
        cap: z.literal(24),
        coverage: z.number().min(0).max(1),
        media: z.array(media).max(24),
      })
      .strict(),
    highlights: z
      .array(
        z
          .object({
            id: z.string().min(1).max(120),
            kind: z.enum(["PERFORMANCE", "RECURRENCE", "LIMITATION"]),
            text,
            confidence,
            evidenceRefs: refs,
          })
          .strict(),
      )
      .max(3),
    whatYouCreate: z
      .object({
        themes: z
          .array(
            z
              .object({
                value: text,
                postCount: z.number().int().positive(),
                evidenceRefs: refs,
              })
              .strict(),
          )
          .max(12),
        formats: z
          .array(
            z
              .object({
                value: z.enum(["IMAGE", "CAROUSEL_ALBUM", "VIDEO", "REEL"]),
                postCount: z.number().int().positive(),
                evidenceRefs: refs,
              })
              .strict(),
          )
          .max(4),
      })
      .strict(),
    performance: z
      .object({
        comparisonProfile: z.literal("v0.1"),
        claims: z
          .array(
            z
              .object({
                id: z.string().min(1).max(160),
                cohort: text,
                metric: creatorContentMetricSchema,
                direction: z.enum(["HIGHER", "LOWER"]),
                cohortMedian: z.number().nonnegative(),
                complementMedian: z.number().nonnegative(),
                absolutePercentagePointDelta: z.number().nullable(),
                relativeDelta: z.number(),
                cohortSample: z.number().int().nonnegative(),
                complementSample: z.number().int().nonnegative(),
                cohortCoverage: z.number().min(0).max(1),
                complementCoverage: z.number().min(0).max(1),
                confidence,
                evidenceRefs: refs,
              })
              .strict(),
          )
          .max(12),
      })
      .strict(),
    representatives: z
      .array(
        z
          .object({
            providerMediaId: z.string().min(1).max(100),
            publishedAt: z.string().datetime(),
            reason: text,
            permalink: safePermalink,
            evidenceRefs: refs,
          })
          .strict(),
      )
      .max(6),
    freshness: z
      .object({
        state: z.enum(["CURRENT", "STALE", "UNKNOWN"]),
        staleAfterHours: z.literal(48),
        capturedAt: z.string().datetime().nullable(),
      })
      .strict(),
    processingState: z.enum(["IDLE", "PROCESSING", "FAILED"]),
    currentPreserved: z.boolean(),
    limitations: z.array(text).max(24),
    settingsRecoveryRoute: z.literal("/creator/settings/instagram"),
  })
  .strict();

export type CreatorContent = z.infer<typeof creatorContentSchema>;
