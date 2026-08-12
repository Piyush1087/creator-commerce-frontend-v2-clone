import { z } from "zod";

function utcDayStart(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

export const CanonicalCampaignStrategySchema = z
  .object({
    campaign_name: z.string().trim().min(3).max(60),
    publishing_schedule: z.enum(["EVERGREEN", "SCHEDULED"]),
    publish_from: z.string().datetime().optional().nullable(),
    publish_until: z.string().datetime().optional().nullable(),
    core_objective: z.enum(["PULSE", "PROOF", "PRODUCTION", "PUSH"]),
    platforms: z.array(z.literal("INSTAGRAM")).length(1),
    campaign_visibility: z.enum([
      "PUBLIC",
      "ELIGIBLE_CREATORS_ONLY",
      "INVITE_ONLY",
    ]),
  })
  .superRefine((data, ctx) => {
    if (data.publishing_schedule !== "SCHEDULED") return;
    if (!data.publish_from) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["publish_from"], message: "Start date is required for a scheduled Campaign." });
    }
    if (!data.publish_until) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["publish_until"], message: "End date is required for a scheduled Campaign." });
    }
    if (data.publish_from) {
      const start = new Date(data.publish_from);
      if (utcDayStart(start) < utcDayStart(new Date())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["publish_from"], message: "Start date cannot be in the past." });
      }
    }
    if (data.publish_from && data.publish_until && new Date(data.publish_from) > new Date(data.publish_until)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["publish_until"], message: "End date must be on or after the start date." });
    }
  });

export const CanonicalCreatorStrategySchema = z
  .object({
    creator_archetypes: z.array(z.string().trim().min(1)).min(1).max(5),
    minimum_followers: z.number().int().min(0),
    maximum_followers: z.number().int().min(0).optional().nullable(),
    audience_age_min: z.number().int().min(13).max(65),
    audience_age_max: z.number().int().min(13).max(65),
    audience_gender: z.enum(["ALL", "FEMALE", "MALE"]),
    audience_affinity_ids: z.array(z.string().trim().min(1)).max(5),
    audience_geographies: z.array(z.record(z.unknown())).min(1, "Select at least one audience geography."),
  })
  .superRefine((data, ctx) => {
    if (data.maximum_followers != null && data.maximum_followers <= data.minimum_followers) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["maximum_followers"], message: "Maximum followers must be greater than minimum followers." });
    }
    if (data.audience_age_min > data.audience_age_max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["audience_age_max"], message: "Maximum audience age must be at least the minimum age." });
    }
  });

export const CanonicalCommercialPolicySchema = z
  .object({
    receives_brand_support: z.boolean(),
    brand_support_type: z
      .enum(["PRODUCT", "SERVICE", "EXPERIENCE", "ACCESS_SUBSCRIPTION", "OTHER"])
      .optional()
      .nullable(),
    brand_support_estimated_value: z.number().finite().min(0).optional().nullable(),
    compensation_model: z.enum(["FIXED", "NEGOTIABLE"]),
    commercial_offer: z.number().finite().min(0),
    total_campaign_budget: z.number().finite().min(0),
    advance_payment_percentage: z.union([
      z.literal(0),
      z.literal(25),
      z.literal(50),
      z.literal(75),
      z.literal(100),
    ]),
    payout_terms: z.enum(["NET_7", "NET_15", "NET_30", "NET_45", "NET_60"]),
  })
  .superRefine((data, ctx) => {
    if (data.receives_brand_support && !data.brand_support_type) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["brand_support_type"], message: "Select the Brand support type." });
    }
    if (data.total_campaign_budget < data.commercial_offer) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["total_campaign_budget"], message: "Total Campaign budget must be at least the commercial offer." });
    }
  });

export const CanonicalCampaignWizardPayloadSchema = z.object({
  strategy: CanonicalCampaignStrategySchema,
  targeting: CanonicalCreatorStrategySchema,
  commercials: CanonicalCommercialPolicySchema,
});

export type CanonicalCampaignWizardPayload = z.infer<
  typeof CanonicalCampaignWizardPayloadSchema
>;
