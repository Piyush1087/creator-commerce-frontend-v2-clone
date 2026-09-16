import { z } from "zod";

export const INSTAGRAM_REASON_CODES = [
  "CONNECTION_NOT_CONNECTED",
  "CONNECTION_CONNECTING",
  "REAUTH_REQUIRED",
  "PARTIAL_CAPABILITY",
  "UNKNOWN_CAPABILITY",
  "AUTHORIZATION_DEGRADED",
  "ACCOUNT_IDENTITY_CONFLICT",
  "PROVIDER_TRANSIENT_FAILURE",
  "PROVIDER_REQUEST_FAILED",
  "RATE_LIMITED",
  "INVENTORY_CAP_REACHED",
  "WINDOW_EMPTY",
  "MISSING_TIMESTAMP",
  "METRIC_NOT_SUPPORTED",
  "METRIC_NOT_RETURNED",
  "AUDIENCE_NOT_SUPPORTED",
  "AUDIENCE_PRIVACY_SUPPRESSED",
  "AUDIENCE_FOLLOWERS_UNAVAILABLE",
  "AUDIENCE_ENGAGED_UNAVAILABLE",
  "MEDIA_NOT_SELECTED_FOR_DEEP_ANALYSIS",
  "MEDIA_DOWNLOAD_FAILED",
  "MEDIA_URL_EXPIRED",
  "MEDIA_TYPE_UNSUPPORTED",
  "CAROUSEL_CHILD_UNAVAILABLE",
  "VIDEO_NOT_ANALYZED",
  "AUDIO_NOT_ANALYZED",
  "TRANSCRIPT_NOT_ACQUIRED",
  "COVER_ONLY",
  "INSUFFICIENT_SAMPLE",
  "INSUFFICIENT_COMPARABLE_SAMPLE",
  "INSUFFICIENT_METRIC_COVERAGE",
  "INSUFFICIENT_EVIDENCE",
  "NOT_INSPECTED",
  "INTENTIONAL_ABSENCE",
  "REFRESH_COOLDOWN",
  "REFRESH_NOT_AUTHORIZED",
  "REFRESH_BACKOFF_ACTIVE",
  "REFRESH_ALREADY_RUNNING",
  "CURRENT_PRESERVED_AFTER_FAILURE",
  "DELETE_IN_PROGRESS",
  "DELETED",
  "SOURCE_SCOPE_MISMATCH",
  "OFFERING_MATCH_UNVERIFIED",
  "CREATOR_IDENTITY_UNVERIFIED",
] as const;

const reasonCode = z.enum(INSTAGRAM_REASON_CODES);
const timestamp = z.string().datetime();
const evidenceRefs = z.array(z.string().min(1));
const availableValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.unknown()),
  z.record(z.unknown()),
]);

export const InstagramSourceValueSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("AVAILABLE"), value: availableValue }).strict(),
  z.object({ state: z.literal("EXPLICIT_NULL"), reasonCode }).strict(),
  z.object({ state: z.literal("UNKNOWN"), reasonCode }).strict(),
  z.object({ state: z.literal("NOT_INSPECTED"), reasonCode }).strict(),
  z.object({ state: z.literal("INTENTIONALLY_ABSENT"), reasonCode }).strict(),
]);

export const InstagramObservedMetricSchema = z.discriminatedUnion(
  "availability",
  [
    z
      .object({
        availability: z.literal("OBSERVED"),
        metricId: z.string().min(1),
        value: z.number().positive(),
        unit: z.enum(["COUNT", "PERCENT", "SECONDS", "RATIO"]),
        denominator: InstagramSourceValueSchema,
        evidenceRefs: evidenceRefs.min(1),
      })
      .strict(),
    z
      .object({
        availability: z.literal("OBSERVED_ZERO"),
        metricId: z.string().min(1),
        value: z.literal(0),
        unit: z.enum(["COUNT", "PERCENT", "SECONDS", "RATIO"]),
        denominator: InstagramSourceValueSchema,
        evidenceRefs: evidenceRefs.min(1),
      })
      .strict(),
    z
      .object({
        availability: z.enum([
          "UNAVAILABLE",
          "PROVIDER_FAILURE",
          "UNSUPPORTED",
        ]),
        metricId: z.string().min(1),
        reasonCode,
        evidenceRefs,
      })
      .strict(),
  ],
);

export const InstagramResultSchema = z
  .object({
    kind: z.literal("RESULT"),
    semanticId: z.string().min(1),
    value: z.number(),
    unit: z.enum(["COUNT", "PERCENT", "SECONDS", "RATIO"]),
    sampleSize: z.number().int().nonnegative(),
    evidenceRefs: evidenceRefs.min(1),
  })
  .strict();
export const InstagramSignalSchema = z
  .object({
    kind: z.literal("SIGNAL"),
    semanticId: z.string().min(1),
    statement: z.string().min(1),
    confidence: z.enum(["LOW", "MEDIUM"]),
    sampleSize: z.number().int().min(3),
    comparisonCohortSizes: z.array(z.number().int().min(3)).max(2),
    metricCoveragePercent: z.number().min(50).max(100),
    publicationDateCount: z.number().int().positive(),
    evidenceRefs: evidenceRefs.min(1),
  })
  .strict();
export const InstagramLearningSchema = z
  .object({
    kind: z.literal("LEARNING"),
    semanticId: z.string().min(1),
    statement: z.string().min(1),
    confidence: z.enum(["LOW", "MEDIUM"]),
    supportingSignalIds: z.array(z.string().min(1)).min(1),
    evidenceRefs: evidenceRefs.min(1),
  })
  .strict();

export const InstagramLikelyCollabSchema = z
  .object({
    state: z.enum([
      "LIKELY_COLLAB",
      "POSSIBLE_COLLAB",
      "NO_COLLAB_SIGNAL",
      "UNKNOWN",
    ]),
    confidence: z.enum(["LOW", "MEDIUM", "HIGH"]).nullable(),
    signalClasses: z.array(
      z.enum([
        "PROVIDER_COLLABORATOR_RELATION",
        "EXPLICIT_CAPTION_COLLAB_LANGUAGE",
        "EXPLICIT_PARTNERSHIP_DISCLOSURE",
        "JOINT_BRAND_CREATOR_APPEARANCE",
        "CREATOR_PRODUCT_DEMO_OR_TESTIMONIAL",
        "MENTION_ONLY",
      ]),
    ),
    canonicalCreatorId: z.string().uuid().nullable(),
    canonicalCreatorMatch: z.enum(["EXACT_PREEXISTING", "NONE"]),
    canonicalCollaborationId: z.string().uuid().nullable(),
    canonicalCollaborationMatch: z.enum(["EXACT_PREEXISTING", "NONE"]),
    reasonCodes: z.array(reasonCode),
    evidenceRefs,
    negativeEvidence: z
      .object({
        captionInspected: z.boolean(),
        requiredSelectedMediaInspected: z.boolean(),
      })
      .strict(),
  })
  .strict();

export const InstagramCoverageSchema = z
  .object({
    state: z.enum(["COMPLETE", "PARTIAL", "UNAVAILABLE"]),
    eligibleCount: z.number().int().nonnegative(),
    observedCount: z.number().int().nonnegative(),
    coveragePercent: z.number().min(0).max(100).nullable(),
    reasonCodes: z.array(reasonCode),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.observedCount > value.eligibleCount)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["observedCount"],
        message: "Observed cannot exceed eligible",
      });
    if (value.eligibleCount === 0 && value.coveragePercent !== null)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["coveragePercent"],
        message: "Coverage is unknown without a denominator",
      });
  });

const objectIds = [
  "instagram_content_behavior",
  "instagram_audience_profile",
  "instagram_organic_performance_profile",
] as const;
const objectComponents: Record<(typeof objectIds)[number], readonly string[]> =
  {
    instagram_content_behavior: [
      "window",
      "corpus_summary",
      "posting_cadence",
      "format_mix",
      "theme_patterns",
      "caption_patterns",
      "creative_structure_patterns",
      "offering_presence_patterns",
      "creator_presence_patterns",
      "representative_media_refs",
      "bounded_learnings",
      "coverage",
    ],
    instagram_audience_profile: [
      "window",
      "follower_audience",
      "engaged_audience",
      "distribution_concentration",
      "material_differences",
      "limitations",
      "coverage",
      "summary",
    ],
    instagram_organic_performance_profile: [
      "window",
      "account_results",
      "metric_coverage",
      "format_baselines",
      "response_distribution",
      "high_response_cohorts",
      "low_response_cohorts",
      "content_performance_signals",
      "snapshot_change",
      "representative_media_refs",
      "bounded_learnings",
      "coverage",
    ],
  };

export const InstagramIntelligenceObjectSchema = z
  .object({
    semanticId: z.enum(objectIds),
    objectContractVersion: z.literal("1.0"),
    outputContractVersion: z.literal("1.0"),
    sourceScope: z.literal("INSTAGRAM_OWNED"),
    state: z.enum(["NO_CURRENT", "PARTIAL_CURRENT", "CURRENT"]),
    readiness: z.enum(["NOT_READY", "PARTIAL", "READY"]),
    freshness: z.enum(["UNKNOWN", "CURRENT", "STALE"]),
    currentPreserved: z.boolean(),
    generatedAt: timestamp.nullable(),
    window: z
      .object({ start: timestamp, end: timestamp, days: z.literal(30) })
      .strict(),
    results: z.array(InstagramResultSchema),
    signals: z.array(InstagramSignalSchema),
    learnings: z.array(InstagramLearningSchema),
    components: z.record(InstagramSourceValueSchema),
    coverage: InstagramCoverageSchema,
    evidenceRefs,
  })
  .strict()
  .superRefine((value, context) => {
    const expected = objectComponents[value.semanticId];
    const actual = Object.keys(value.components);
    if (
      actual.some((key) => !expected.includes(key)) ||
      expected.some((key) => !(key in value.components))
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["components"],
        message: "Object components must match the frozen registry",
      });
  });

const manualRefresh = z.discriminatedUnion("state", [
  z
    .object({
      state: z.literal("ALLOWED"),
      cooldownEndsAt: timestamp.nullable(),
    })
    .strict(),
  z.object({ state: z.literal("DENIED"), reasonCode }).strict(),
]);

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
        providerAccountId: z.string().min(1).nullable(),
        handle: z.string().min(1).nullable(),
        reasonCodes: z.array(reasonCode),
      })
      .strict(),
    window: z
      .object({ start: timestamp, end: timestamp, days: z.literal(30) })
      .strict(),
    accountFacts: z.array(
      z
        .object({
          semanticId: z.string().min(1),
          value: InstagramSourceValueSchema,
          observedAt: timestamp.nullable(),
          evidenceRefs,
        })
        .strict(),
    ),
    accountPerformance: z.array(InstagramResultSchema),
    objects: z.array(InstagramIntelligenceObjectSchema).length(3),
    representativeMedia: z.array(
      z
        .object({
          mediaId: z.string().min(1),
          mediaType: z.enum(["IMAGE", "CAROUSEL_ALBUM", "REELS", "VIDEO"]),
          publishedAt: InstagramSourceValueSchema,
          permalink: InstagramSourceValueSchema,
          likelyCollab: InstagramLikelyCollabSchema,
          metricHighlights: z.array(InstagramObservedMetricSchema),
          evidenceRefs,
        })
        .strict(),
    ),
    coverage: z
      .object({
        inventory: InstagramCoverageSchema,
        metrics: InstagramCoverageSchema,
        lightSemantic: InstagramCoverageSchema,
        deepMultimodal: InstagramCoverageSchema,
        audience: InstagramCoverageSchema,
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
        lastAttemptAt: timestamp.nullable(),
        lastSuccessAt: timestamp.nullable(),
        nextDueAt: timestamp.nullable(),
        currentPreserved: z.boolean(),
        reasonCodes: z.array(reasonCode),
      })
      .strict(),
    actions: z
      .object({
        manualRefresh,
        settingsRecoveryPath: z.literal(
          "/brand/settings/integrations?tab=instagram",
        ),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = value.objects.map((item) => item.semanticId);
    if (
      new Set(ids).size !== objectIds.length ||
      !objectIds.every((id) => ids.includes(id))
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["objects"],
        message: "Exactly one of each Instagram V1 Object is required",
      });
  });

export const InstagramRefreshResponseSchema = z
  .object({
    accepted: z.literal(true),
    requestIdentity: z.string().min(1),
    cooldownSeconds: z.literal(900),
  })
  .strict()
  .transform(({ accepted, cooldownSeconds }) => ({
    accepted,
    cooldownSeconds,
  }));
export const InstagramRefreshErrorSchema = z
  .object({
    code: z.literal("INSTAGRAM_REFRESH_COOLDOWN"),
    retryAfterSeconds: z.number().int().positive(),
  })
  .strict();

const boundedSemanticValue = z
  .object({
    semanticId: z.string().min(1),
    label: z.string().min(1),
    confidence: z.enum(["LOW", "MEDIUM"]),
    evidenceRefs: evidenceRefs.min(1),
  })
  .strict();

const presence = z
  .object({
    state: z.enum(["PRESENT", "POSSIBLE", "NOT_OBSERVED", "UNKNOWN"]),
    reasonCodes: z.array(reasonCode),
    evidenceRefs,
  })
  .strict();

export const InstagramMediaDetailSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    mediaId: z.string().min(1),
    mediaType: z.enum(["IMAGE", "CAROUSEL_ALBUM", "REELS", "VIDEO"]),
    publishedAt: InstagramSourceValueSchema,
    permalink: InstagramSourceValueSchema,
    caption: InstagramSourceValueSchema,
    hashtags: z.array(z.string().min(1)),
    mentions: z.array(z.string().min(1)),
    themes: z.array(boundedSemanticValue),
    captionPatterns: z.array(boundedSemanticValue),
    creativeStructures: z.array(boundedSemanticValue),
    visualExecutions: z.array(boundedSemanticValue),
    creatorPresence: presence,
    offeringPresence: presence
      .extend({
        canonicalOfferingId: z.string().uuid().nullable(),
        canonicalOfferingMatch: z.enum(["EXACT_PREEXISTING", "NONE"]),
      })
      .superRefine((value, context) => {
        if (value.state !== "PRESENT" && value.canonicalOfferingId !== null)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["canonicalOfferingId"],
            message: "Only observed presence may carry an exact identity",
          });
        if (
          (value.canonicalOfferingMatch === "EXACT_PREEXISTING") !==
          (value.canonicalOfferingId !== null)
        )
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["canonicalOfferingMatch"],
            message: "Exact identity fields must agree",
          });
      }),
    likelyCollab: InstagramLikelyCollabSchema,
    metrics: z.array(InstagramObservedMetricSchema),
    inspection: z
      .object({
        depth: z.enum([
          "LIGHT_ONLY",
          "DEEP_SELECTED",
          "COVER_ONLY",
          "PARTIAL_DEEP",
          "NOT_INSPECTED",
        ]),
        selectedForDeepAnalysis: z.boolean(),
        selectionReasons: z.array(
          z.enum([
            "RECENT_FORMAT_COVERAGE",
            "TOP_PERFORMANCE_BAND",
            "MIDDLE_PERFORMANCE_BAND",
            "LOW_PERFORMANCE_BAND",
            "LIKELY_CREATOR_CUE",
            "BRAND_ONLY_BASELINE_CUE",
            "OFFERING_DIVERSITY_CUE",
            "THEME_DIVERSITY_CUE",
            "TIME_BUCKET_COVERAGE",
            "STABLE_FILL",
          ]),
        ),
        inspectedChildCount: z.number().int().nonnegative(),
        availableChildCount: z.number().int().nonnegative(),
        inspectedFrameCount: z.number().int().nonnegative(),
        reasonCodes: z.array(reasonCode),
      })
      .strict(),
    coverage: z
      .object({
        sourceEvidenceCount: z.number().int().positive(),
        limitations: z.array(z.string().min(1)),
      })
      .strict(),
    evidence: z
      .object({
        refs: evidenceRefs.min(1),
        capturedAt: timestamp,
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.inspection.inspectedChildCount >
      value.inspection.availableChildCount
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inspection", "inspectedChildCount"],
        message: "Inspected children cannot exceed available children",
      });
  });

export type InstagramB4Response = z.infer<typeof InstagramB4ResponseSchema>;
export type InstagramIntelligenceObject = z.infer<
  typeof InstagramIntelligenceObjectSchema
>;
export type InstagramSourceValue = z.infer<typeof InstagramSourceValueSchema>;
export type InstagramRefreshResponse = z.infer<
  typeof InstagramRefreshResponseSchema
>;
export type InstagramMediaDetail = z.infer<typeof InstagramMediaDetailSchema>;
