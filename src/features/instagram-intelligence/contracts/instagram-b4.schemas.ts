import { z } from "zod";

const sourceValue = z.discriminatedUnion("state", [
  z.object({ state: z.literal("AVAILABLE"), value: z.unknown() }).strict(),
  z
    .object({ state: z.literal("EXPLICIT_NULL"), reasonCode: z.string() })
    .strict(),
  z.object({ state: z.literal("UNKNOWN"), reasonCode: z.string() }).strict(),
  z
    .object({ state: z.literal("NOT_INSPECTED"), reasonCode: z.string() })
    .strict(),
  z
    .object({
      state: z.literal("INTENTIONALLY_ABSENT"),
      reasonCode: z.string(),
    })
    .strict(),
]);

const coverage = z
  .object({
    state: z.enum(["COMPLETE", "PARTIAL", "UNAVAILABLE"]),
    eligibleCount: z.number().int().nonnegative(),
    observedCount: z.number().int().nonnegative(),
    coveragePercent: z.number().min(0).max(100).nullable(),
    reasonCodes: z.array(z.string()),
  })
  .strict();

const intelligenceObject = z
  .object({
    semanticId: z.enum([
      "instagram_content_behavior",
      "instagram_audience_profile",
      "instagram_organic_performance_profile",
    ]),
    objectContractVersion: z.literal("1.0"),
    outputContractVersion: z.literal("1.0"),
    sourceScope: z.literal("INSTAGRAM_OWNED"),
    state: z.enum(["NO_CURRENT", "PARTIAL_CURRENT", "CURRENT"]),
    readiness: z.enum(["NOT_READY", "PARTIAL", "READY"]),
    freshness: z.enum(["UNKNOWN", "CURRENT", "STALE"]),
    currentPreserved: z.boolean(),
    generatedAt: z.string().datetime().nullable(),
    window: z
      .object({
        start: z.string().datetime(),
        end: z.string().datetime(),
        days: z.literal(30),
      })
      .strict(),
    results: z.array(z.unknown()),
    signals: z.array(z.unknown()),
    learnings: z.array(z.unknown()),
    components: z.record(sourceValue),
    coverage,
    evidenceRefs: z.array(z.string()),
  })
  .strict();

export const InstagramB4ResponseSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    connection: z
      .object({
        state: z.enum([
          "NOT_CONNECTED",
          "CONNECTING",
          "CONNECTED",
          "PARTIAL_CAPABILITY",
          "UNKNOWN_CAPABILITY",
          "REAUTH_REQUIRED",
          "AUTHORIZATION_DEGRADED",
          "SAME_ACCOUNT_RECONNECTING",
          "DIFFERENT_ACCOUNT_CONFLICT",
          "TRANSIENT_PROVIDER_FAILURE",
          "DISCONNECTED",
          "DELETE_IN_PROGRESS",
        ]),
        providerAccountId: z.string().nullable(),
        handle: z.string().nullable(),
        reasonCodes: z.array(z.string()),
      })
      .strict(),
    window: z
      .object({
        start: z.string().datetime(),
        end: z.string().datetime(),
        days: z.literal(30),
      })
      .strict(),
    accountFacts: z.array(z.unknown()),
    accountPerformance: z.array(z.unknown()),
    objects: z.array(intelligenceObject).length(3),
    representativeMedia: z.array(z.unknown()),
    coverage: z
      .object({
        inventory: coverage,
        metrics: coverage,
        lightSemantic: coverage,
        deepMultimodal: coverage,
        audience: coverage,
      })
      .strict(),
    sync: z
      .object({
        state: z.enum([
          "IDLE",
          "INITIALIZING",
          "REFRESHING",
          "BACKOFF",
          "BLOCKED",
        ]),
        lastAttemptAt: z.string().datetime().nullable(),
        lastSuccessAt: z.string().datetime().nullable(),
        nextDueAt: z.string().datetime().nullable(),
        currentPreserved: z.boolean(),
        reasonCodes: z.array(z.string()),
      })
      .strict(),
    actions: z
      .object({
        manualRefresh: z.union([
          z
            .object({
              state: z.literal("ALLOWED"),
              cooldownEndsAt: z.string().datetime().nullable(),
            })
            .strict(),
          z
            .object({ state: z.literal("DENIED"), reasonCode: z.string() })
            .strict(),
        ]),
        settingsRecoveryPath: z.literal(
          "/brand/settings/integrations?tab=instagram",
        ),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.objects.map((item) => item.semanticId)).size !== 3) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["objects"],
        message: "Three unique Instagram Objects are required",
      });
    }
  });

export type InstagramB4Response = z.infer<typeof InstagramB4ResponseSchema>;
