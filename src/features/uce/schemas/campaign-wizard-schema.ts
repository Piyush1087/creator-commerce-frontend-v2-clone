import { z } from "zod";

const objective = z.enum(["PULSE", "PROOF", "PRODUCTION", "PUSH"]);
const geography = z.object({
  scope: z.enum(["LOCALITY", "REGION", "COUNTRY", "GLOBAL"]),
  label: z.string().min(1),
  country_code: z.string().length(2).nullable(),
  locality: z.string().min(1).nullable(),
  region: z.string().min(1).nullable(),
  radius_km: z.number().positive().nullable(),
  is_primary: z.boolean(),
});

export const Step1StrategySchema = z
  .object({
    campaign_name: z.string().trim().min(3).max(60),
    publishing_schedule: z.enum(["EVERGREEN", "SCHEDULED"]),
    publish_from: z.string().datetime().nullable(),
    publish_until: z.string().datetime().nullable(),
    core_objective: objective,
    platforms: z.tuple([z.literal("INSTAGRAM")]),
    campaign_visibility: z.enum(["PUBLIC", "ELIGIBLE_CREATORS_ONLY", "INVITE_ONLY"]),
  })
  .superRefine((data, ctx) => {
    if (data.publishing_schedule === "SCHEDULED" && !data.publish_from) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["publish_from"], message: "Choose a start date." });
    }
    if (data.publishing_schedule === "SCHEDULED" && !data.publish_until) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["publish_until"], message: "Choose an end date." });
    }
    if (data.publish_from && data.publish_until && new Date(data.publish_until) < new Date(data.publish_from)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["publish_until"], message: "End date must follow start date." });
    }
  });

export const Step2TargetingSchema = z
  .object({
    creator_archetypes: z.array(z.string().min(1)).min(1).max(5),
    minimum_followers: z.number().int().min(0),
    maximum_followers: z.number().int().min(0).nullable(),
    audience_age_min: z.number().int().min(13).max(65),
    audience_age_max: z.number().int().min(13).max(65),
    audience_gender: z.enum(["ALL", "FEMALE", "MALE"]),
    audience_affinity_ids: z.array(z.string().min(1)).max(5),
    audience_geographies: z.array(geography).min(1),
  })
  .refine((data) => data.audience_age_min <= data.audience_age_max, {
    path: ["audience_age_max"],
    message: "Maximum age must be at least the minimum age.",
  });

export const Step3CommercialsSchema = z
  .object({
    receives_brand_support: z.boolean(),
    brand_support_type: z.enum(["PRODUCT", "SERVICE", "EXPERIENCE", "ACCESS_SUBSCRIPTION", "OTHER"]).nullable(),
    brand_support_estimated_value: z.number().min(0).nullable(),
    compensation_model: z.enum(["FIXED", "NEGOTIABLE"]),
    commercial_offer: z.number().min(0),
    total_campaign_budget: z.number().min(0),
    advance_payment_percentage: z.union([z.literal(0), z.literal(25), z.literal(50), z.literal(75), z.literal(100)]),
    payout_terms: z.enum(["NET_7", "NET_15", "NET_30", "NET_45", "NET_60"]),
  })
  .refine((data) => data.total_campaign_budget >= data.commercial_offer, {
    path: ["total_campaign_budget"],
    message: "Campaign budget must cover the creator offer.",
  });

export const IntegratedCampaignWizardPayloadSchema = z.object({
  strategy: Step1StrategySchema,
  targeting: Step2TargetingSchema,
  commercials: Step3CommercialsSchema,
});

export type IntegratedCampaignWizardPayload = z.infer<typeof IntegratedCampaignWizardPayloadSchema>;
export type Step1StrategyPayload = z.infer<typeof Step1StrategySchema>;
export type Step2TargetingPayload = z.infer<typeof Step2TargetingSchema>;
export type Step3CommercialsPayload = z.infer<typeof Step3CommercialsSchema>;
