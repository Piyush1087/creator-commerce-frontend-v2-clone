import { z } from "zod";

export const BRAND_PAYOUTS_V2_MEDIA_TYPE =
  "application/vnd.creator-shop.brand-payouts.v2+json";
export const BRAND_PAYOUTS_V2_SCHEMA_VERSION = "brand-payouts.v2" as const;

const boundedText = z.string().min(1).max(512);
const nullableBoundedText = z.string().max(512).nullable();
const reasonCode = z.string().min(1).max(256);
const utcInstant = z.string().datetime({ offset: true });
const exactDecimal = z
  .string()
  .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u, "Expected an exact decimal string");

export const brandPayoutsViewerRoleSchema = z.enum([
  "BRAND_OWNER",
  "FINANCE_ADMIN",
  "CAMPAIGN_MANAGER",
]);

export const brandPayoutsProjectionScopeSchema = z.enum([
  "FULL_FINANCIAL",
  "AUTHORIZED_CAMPAIGN_COLLABORATION_ONLY",
  "NO_FINANCIAL_ROWS",
]);

export const brandPayoutsViewerSchema = z.union([
  z
    .object({
      role: z.enum(["BRAND_OWNER", "FINANCE_ADMIN"]),
      projection_scope: z.literal("FULL_FINANCIAL"),
    })
    .strict(),
  z
    .object({
      role: z.literal("CAMPAIGN_MANAGER"),
      projection_scope: z.enum([
        "AUTHORIZED_CAMPAIGN_COLLABORATION_ONLY",
        "NO_FINANCIAL_ROWS",
      ]),
    })
    .strict(),
]);

export const brandPayoutsMoneySchema = z
  .object({
    amount: exactDecimal,
    currency: z.string().min(1).max(8),
  })
  .strict();

const sourceIdSchema = z.enum([
  "VAULT",
  "FUNDING",
  "FINANCIAL_LEDGER",
  "PAYOUT_OBLIGATIONS",
  "BRAND_RETURNS",
  "COLLABORATION_RESERVE_REQUESTS",
]);

const sourceCoverageSchema = z
  .object({
    source: sourceIdSchema,
    status: z.enum(["AVAILABLE", "PARTIAL", "UNAVAILABLE"]),
    limitation_reason_code: reasonCode.nullable(),
    recovery_hint: nullableBoundedText,
  })
  .strict();

const legacyLimitationSchema = z
  .object({
    source: sourceIdSchema,
    reason_code: reasonCode,
    detail: z.string().min(1).max(1_000),
  })
  .strict();

const readActionSchema = z.enum([
  "VIEW_DETAIL",
  "OPEN_SETTINGS_ADD_FUNDS",
  "OPEN_SETTINGS_BRAND_RETURN",
  "DOWNLOAD_FINANCIAL_ACTIVITY_CSV",
]);

const availableActionSchema = z
  .object({
    action: readActionSchema,
    resource_reference: boundedText,
    resource_version: boundedText,
    authorized_as_of: utcInstant,
  })
  .strict();

const pageMetadataSchema = z
  .object({
    next_cursor: z.string().min(1).max(4_096).nullable(),
    page_complete: z.boolean(),
    source_complete: z.boolean(),
  })
  .strict();

const sectionMetadata = {
  coverage: z.enum(["COMPLETE", "PARTIAL", "UNAVAILABLE"]),
  freshness: z.enum(["CURRENT", "STALE"]),
  source_observed_at: utcInstant.nullable(),
  source_coverage: z.array(sourceCoverageSchema),
  legacy_limitations: z.array(legacyLimitationSchema),
  available_actions: z.array(availableActionSchema),
} as const;

const unavailableAmountBucketSchema = z
  .object({
    status: z.literal("UNAVAILABLE"),
    value: z.null(),
    limitation_reason_code: reasonCode,
  })
  .strict();

const authoritativeAmountBucketSchema = z
  .object({
    status: z.literal("AUTHORITATIVE"),
    value: brandPayoutsMoneySchema,
  })
  .strict();

export const brandPayoutsAmountBucketSchema = z.discriminatedUnion("status", [
  authoritativeAmountBucketSchema,
  unavailableAmountBucketSchema,
]);

const unavailableCountBucketSchema = z
  .object({
    status: z.literal("UNAVAILABLE"),
    value: z.null(),
    limitation_reason_code: reasonCode,
  })
  .strict();

const authoritativeCountBucketSchema = z
  .object({
    status: z.literal("AUTHORITATIVE"),
    value: z.number().int().nonnegative(),
  })
  .strict();

const countBucketSchema = z.discriminatedUnion("status", [
  authoritativeCountBucketSchema,
  unavailableCountBucketSchema,
]);

const settledAmountBucketSchema = z.discriminatedUnion("status", [
  authoritativeAmountBucketSchema.extend({
    basis: z.enum(["LIFETIME", "REQUESTED_RANGE"]),
  }),
  unavailableAmountBucketSchema.extend({
    basis: z.enum(["LIFETIME", "REQUESTED_RANGE"]),
  }),
]);

const fullFinancialSummarySchema = z
  .object({
    projection: z.literal("FULL_FINANCIAL"),
    available_funds: brandPayoutsAmountBucketSchema,
    pending_funding: brandPayoutsAmountBucketSchema,
    committed_protected_funds: brandPayoutsAmountBucketSchema,
    active_brand_return_commitment: brandPayoutsAmountBucketSchema,
    scheduled_creator_obligations: brandPayoutsAmountBucketSchema,
    processing_creator_obligations: brandPayoutsAmountBucketSchema,
    settled_activity: settledAmountBucketSchema,
    action_required_count: countBucketSchema,
  })
  .strict();

const campaignOperationalSummarySchema = z
  .object({
    projection: z.literal("CAMPAIGN_OPERATIONAL"),
    treasury_capacity: z.enum([
      "SUFFICIENT",
      "SHORTFALL",
      "PENDING_APPROVAL",
      "UNAVAILABLE",
    ]),
    action_required_count: countBucketSchema,
  })
  .strict();

export const brandPayoutsSummarySchema = z.discriminatedUnion("projection", [
  fullFinancialSummarySchema,
  campaignOperationalSummarySchema,
]);

const legacyStateSchema = z
  .object({
    classification: z.enum([
      "CANONICALLY_RECONCILABLE",
      "DISPLAY_AS_LEGACY",
      "DISPLAY_WITH_LIMITATION",
      "LEGACY_UNRECONCILED",
    ]),
    limitation_reason_code: reasonCode.nullable(),
  })
  .strict();

export const brandPayoutsObligationLifecycleSchema = z.enum([
  "SCHEDULED",
  "READY_QUEUED",
  "PROCESSING",
  "HELD_RELEASE_PENDING",
  "SETTLED",
  "FAILED_RETRYABLE",
  "ACTION_REQUIRED",
  "PARTIAL_REVERSAL",
  "FULL_REVERSAL",
  "LEGACY_UNRECONCILED",
]);

export const brandPayoutsObligationGateSchema = z.enum([
  "NOT_YET_DUE",
  "CREATOR_SETUP_REQUIRED",
  "UNSUPPORTED_GEOGRAPHY_OR_RAIL",
  "PROVIDER_REVIEW",
  "PROTECTED_FUNDING_BLOCKED",
  "RESOLUTION_BLOCKED",
  "DEPENDENCY_UNAVAILABLE",
  "ELIGIBLE",
]);

export const brandPayoutsObligationSchema = z
  .object({
    obligation_id: boundedText,
    public_reference: boundedText,
    resource_version: boundedText,
    campaign_id: boundedText,
    collaboration_id: boundedText,
    creator_reference: boundedText,
    lifecycle: brandPayoutsObligationLifecycleSchema,
    current_gate: brandPayoutsObligationGateSchema,
    blocking_reason_code: reasonCode.nullable(),
    recovery_reference: nullableBoundedText,
    entitlement_value: brandPayoutsMoneySchema.nullable(),
    settled_value: brandPayoutsMoneySchema.nullable(),
    reversed_value: brandPayoutsMoneySchema.nullable(),
    outstanding_value: brandPayoutsMoneySchema.nullable(),
    payment_due_at: utcInstant.nullable(),
    last_observed_at: utcInstant,
    legacy: legacyStateSchema.nullable(),
  })
  .strict();

export const brandPayoutsActivityCategorySchema = z.enum([
  "MONEY_MOVEMENT",
  "PROTECTED_ALLOCATION",
  "BUSINESS_OBLIGATION",
  "PROVIDER_EXECUTION",
  "RETURN_REFUND_REVERSAL",
  "INFORMATIONAL_LIFECYCLE",
]);

export const brandPayoutsActivitySchema = z
  .object({
    activity_id: boundedText,
    public_reference: boundedText,
    resource_version: boundedText,
    source_owner: z.enum([
      "FINANCIAL_LEDGER",
      "COLLABORATION",
      "PAYOUT_EXECUTION",
      "BRAND_RETURN",
    ]),
    source_reference: boundedText,
    category: brandPayoutsActivityCategorySchema,
    is_financial_movement: z.boolean(),
    financial_value: brandPayoutsMoneySchema.nullable(),
    recorded_at: utcInstant,
    occurred_at: utcInstant.nullable(),
    source_observed_at: utcInstant.nullable(),
    normalized_status: boundedText,
    actor_source: nullableBoundedText,
    references: z
      .object({
        campaign_id: nullableBoundedText,
        collaboration_id: nullableBoundedText,
        creator_reference: nullableBoundedText,
        obligation_id: nullableBoundedText,
        brand_return_id: nullableBoundedText,
      })
      .strict(),
    legacy: legacyStateSchema.nullable(),
  })
  .strict();

const overviewSectionSchema = z
  .object({
    section_id: z.literal("OVERVIEW"),
    ...sectionMetadata,
    payload: brandPayoutsSummarySchema.nullable(),
    page: pageMetadataSchema.optional(),
  })
  .strict();

const activityListSectionSchema = z
  .object({
    section_id: z.literal("ACTIVITY"),
    ...sectionMetadata,
    payload: z.array(brandPayoutsActivitySchema).nullable(),
    page: pageMetadataSchema,
  })
  .strict();

const activityDetailSectionSchema = z
  .object({
    section_id: z.literal("ACTIVITY"),
    ...sectionMetadata,
    payload: brandPayoutsActivitySchema.nullable(),
    page: pageMetadataSchema.optional(),
  })
  .strict();

const obligationListSectionSchema = z
  .object({
    section_id: z.literal("OBLIGATIONS"),
    ...sectionMetadata,
    payload: z.array(brandPayoutsObligationSchema).nullable(),
    page: pageMetadataSchema,
  })
  .strict();

const obligationDetailSectionSchema = z
  .object({
    section_id: z.literal("OBLIGATIONS"),
    ...sectionMetadata,
    payload: brandPayoutsObligationSchema.nullable(),
    page: pageMetadataSchema.optional(),
  })
  .strict();

function envelope<T extends z.ZodTypeAny>(section: T) {
  return z
    .object({
      schema_version: z.literal(BRAND_PAYOUTS_V2_SCHEMA_VERSION),
      as_of: utcInstant,
      viewer: brandPayoutsViewerSchema,
      sections: z.array(section).length(1),
    })
    .strict();
}

export const brandPayoutsOverviewResponseSchema = envelope(
  overviewSectionSchema,
).superRefine((response, context) => {
  const section = response.sections[0];
  const projection = section.payload?.projection;
  if (projection === undefined) {
    if (section.coverage !== "UNAVAILABLE") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Missing overview payload must be explicitly unavailable",
      });
    }
    return;
  }
  if (
    (response.viewer.projection_scope === "FULL_FINANCIAL" &&
      projection !== "FULL_FINANCIAL") ||
    (response.viewer.role === "CAMPAIGN_MANAGER" &&
      projection !== "CAMPAIGN_OPERATIONAL")
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Viewer and overview projection must agree",
    });
  }
});

function requireNoRowsForFailClosedViewer(
  response: {
    readonly viewer: BrandPayoutsViewer;
    readonly sections: readonly {
      readonly payload: readonly unknown[] | null;
      readonly available_actions: readonly unknown[];
    }[];
  },
  context: z.RefinementCtx,
) {
  const section = response.sections[0];
  if (
    section &&
    response.viewer.projection_scope === "NO_FINANCIAL_ROWS" &&
    ((section.payload?.length ?? 0) > 0 || section.available_actions.length > 0)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Fail-closed viewer cannot receive rows or actions",
    });
  }
}

export const brandPayoutsActivityResponseSchema = envelope(
  activityListSectionSchema,
).superRefine(requireNoRowsForFailClosedViewer);
export const brandPayoutsActivityDetailResponseSchema = envelope(
  activityDetailSectionSchema,
).superRefine((response, context) => {
  if (
    response.viewer.projection_scope === "NO_FINANCIAL_ROWS" &&
    (response.sections[0].payload !== null ||
      response.sections[0].available_actions.length > 0)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Fail-closed viewer cannot receive detail",
    });
  }
});
export const brandPayoutsObligationsResponseSchema = envelope(
  obligationListSectionSchema,
).superRefine(requireNoRowsForFailClosedViewer);
export const brandPayoutsObligationDetailResponseSchema = envelope(
  obligationDetailSectionSchema,
).superRefine((response, context) => {
  if (
    response.viewer.projection_scope === "NO_FINANCIAL_ROWS" &&
    (response.sections[0].payload !== null ||
      response.sections[0].available_actions.length > 0)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Fail-closed viewer cannot receive detail",
    });
  }
});

export type BrandPayoutsViewerRole = z.infer<
  typeof brandPayoutsViewerRoleSchema
>;
export type BrandPayoutsViewer = z.infer<typeof brandPayoutsViewerSchema>;
export type BrandPayoutsMoney = z.infer<typeof brandPayoutsMoneySchema>;
export type BrandPayoutsAmountBucket = z.infer<
  typeof brandPayoutsAmountBucketSchema
>;
export type BrandPayoutsSummary = z.infer<typeof brandPayoutsSummarySchema>;
export type BrandPayoutsActivity = z.infer<typeof brandPayoutsActivitySchema>;
export type BrandPayoutsActivityCategory = z.infer<
  typeof brandPayoutsActivityCategorySchema
>;
export type BrandPayoutsObligation = z.infer<
  typeof brandPayoutsObligationSchema
>;
export type BrandPayoutsOverviewResponse = z.infer<
  typeof brandPayoutsOverviewResponseSchema
>;
export type BrandPayoutsActivityResponse = z.infer<
  typeof brandPayoutsActivityResponseSchema
>;
export type BrandPayoutsActivityDetailResponse = z.infer<
  typeof brandPayoutsActivityDetailResponseSchema
>;
export type BrandPayoutsObligationsResponse = z.infer<
  typeof brandPayoutsObligationsResponseSchema
>;
export type BrandPayoutsObligationDetailResponse = z.infer<
  typeof brandPayoutsObligationDetailResponseSchema
>;
export type BrandPayoutsSectionMetadata = Pick<
  z.infer<typeof overviewSectionSchema>,
  | "coverage"
  | "freshness"
  | "source_observed_at"
  | "source_coverage"
  | "legacy_limitations"
  | "available_actions"
>;
