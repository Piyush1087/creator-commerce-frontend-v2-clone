import { z } from "zod";

export const CREATOR_PAYOUTS_SCHEMA_VERSION = "C06_CREATOR_PAYOUTS_V1" as const;
const instant = z.string().datetime({ offset: true });
const exactDecimal = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/u);
const bounded = z.string().min(1).max(512);
export const creatorPayoutMoneySchema = z
  .object({ amount: exactDecimal, currency: z.string().length(3) })
  .strict();
const viewerSchema = z
  .object({
    actor_role: z.enum(["OWNER", "MANAGER"]),
    workspace_reference: bounded,
  })
  .strict();
const sectionSchema = z
  .object({
    coverage: z.enum(["COMPLETE", "PARTIAL", "UNAVAILABLE"]),
    freshness: z.enum(["CURRENT", "STALE", "UNKNOWN"]),
    source_coverage: z.array(z.string()),
    available_actions: z.array(z.string()),
  })
  .strict();
const envelope = {
  schema_version: z.literal(CREATOR_PAYOUTS_SCHEMA_VERSION),
  as_of: instant,
  viewer: viewerSchema,
} as const;

export const creatorPayoutLifecycleSchema = z.enum([
  "SCHEDULED",
  "READY_QUEUED",
  "PROCESSING",
  "SETTLED",
  "FAILED_RETRYABLE",
  "ACTION_REQUIRED",
  "LEGACY_UNRECONCILED",
]);
export const creatorPayoutGateSchema = z.enum([
  "NOT_YET_DUE",
  "CREATOR_SETUP_REQUIRED",
  "UNSUPPORTED_GEOGRAPHY_OR_RAIL",
  "FUNDING_REQUIRED",
  "RESOLUTION_BLOCKED",
  "PROVIDER_UNAVAILABLE",
  "READY",
]);
export const creatorPayoutObligationSchema = z
  .object({
    obligation_id: bounded,
    public_reference: bounded,
    resource_version: bounded,
    campaign_reference: bounded,
    collaboration_reference: bounded,
    lifecycle: creatorPayoutLifecycleSchema,
    effective_gate: creatorPayoutGateSchema,
    blocking_reason_code: z.string().max(256).nullable(),
    entitlement_value: creatorPayoutMoneySchema.nullable(),
    settled_value: creatorPayoutMoneySchema.nullable(),
    outstanding_value: creatorPayoutMoneySchema.nullable(),
    payment_due_at: instant.nullable(),
    settlement_eligible_at: instant.nullable(),
    payment_term: z.string().max(32).nullable(),
    last_observed_at: instant,
    legacy: z
      .object({
        classification: z.enum([
          "DISPLAY_WITH_LIMITATION",
          "LEGACY_UNRECONCILED",
        ]),
        limitation_reason_code: bounded,
      })
      .strict()
      .nullable(),
  })
  .strict();
const pageSchema = z
  .object({
    limit: z.number().int().min(1).max(100),
    next_cursor: z.string().max(4096).nullable(),
  })
  .strict();
export const creatorPayoutsOverviewSchema = z
  .object({
    ...envelope,
    section: sectionSchema,
    summaries: z.array(
      z
        .object({
          family: z.enum([
            "UPCOMING",
            "DUE_OR_ACTION_REQUIRED",
            "PROCESSING",
            "PAID_TO_DATE",
          ]),
          value: creatorPayoutMoneySchema,
        })
        .strict(),
    ),
  })
  .strict();
export const creatorPayoutsObligationsSchema = z
  .object({
    ...envelope,
    section: sectionSchema,
    items: z.array(creatorPayoutObligationSchema),
    page: pageSchema,
  })
  .strict();
export const creatorPayoutsObligationDetailSchema = z
  .object({
    ...envelope,
    section: sectionSchema,
    obligation: creatorPayoutObligationSchema,
  })
  .strict();

export const creatorPayoutHistorySchema = z
  .object({
    history_id: bounded,
    public_reference: bounded,
    resource_version: bounded,
    event_type: z.enum([
      "OBLIGATION_RECORDED",
      "TRANSFER_PROCESSING",
      "TRANSFER_FAILED",
      "SETTLED",
      "REVERSAL_PROCESSED",
    ]),
    obligation_reference: bounded,
    collaboration_reference: bounded,
    value: creatorPayoutMoneySchema.nullable(),
    recorded_at: instant,
    status: bounded,
  })
  .strict();
export const creatorPayoutsHistoryResponseSchema = z
  .object({
    ...envelope,
    section: sectionSchema,
    items: z.array(creatorPayoutHistorySchema),
    page: pageSchema,
  })
  .strict();
export const creatorPayoutsHistoryDetailSchema = z
  .object({
    ...envelope,
    section: sectionSchema,
    history: creatorPayoutHistorySchema,
  })
  .strict();

export const creatorPayoutMethodSchema = z
  .object({
    status: z.enum([
      "NONE",
      "CURRENT",
      "STALE",
      "ATTENTION",
      "DISABLED",
      "AMBIGUOUS",
      "UNSUPPORTED",
    ]),
    destination_id: bounded.nullable(),
    destination_version: z.number().int().positive().nullable(),
    masked_display: z.string().max(160).nullable(),
    destination_type: z.string().max(40).nullable(),
    country_code: z.string().length(2).nullable(),
    currency_code: z.string().length(3).nullable(),
    is_primary: z.boolean().nullable(),
    destination_state: z.string().max(40).nullable(),
    safe_reason_code: z.string().max(100).nullable(),
    updated_at: instant.nullable(),
    c06_rail_support: z.enum(["SUPPORTED", "UNSUPPORTED", "UNAVAILABLE"]),
    manage_settings_href: z.string().max(256).nullable(),
  })
  .strict();
export const creatorPayoutMethodResponseSchema = z
  .object({
    ...envelope,
    section: sectionSchema,
    payout_method: creatorPayoutMethodSchema,
  })
  .strict();

export type CreatorPayoutsOverview = z.infer<
  typeof creatorPayoutsOverviewSchema
>;
export type CreatorPayoutsObligations = z.infer<
  typeof creatorPayoutsObligationsSchema
>;
export type CreatorPayoutObligation = z.infer<
  typeof creatorPayoutObligationSchema
>;
export type CreatorPayoutsHistoryResponse = z.infer<
  typeof creatorPayoutsHistoryResponseSchema
>;
export type CreatorPayoutHistory = z.infer<typeof creatorPayoutHistorySchema>;
export type CreatorPayoutMethodResponse = z.infer<
  typeof creatorPayoutMethodResponseSchema
>;
