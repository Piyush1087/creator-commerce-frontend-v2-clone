import { z } from "zod";

export const CanonicalCampaignWizardPayloadSchema = z.object({
  strategy: z.object({
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
  }),
  targeting: z.object({
    creator_archetypes: z.array(z.string().trim().min(1)).min(1).max(5),
    minimum_followers: z.number().int().min(0),
    maximum_followers: z.number().int().min(0).optional().nullable(),
    audience_age_min: z.number().int().min(13).max(65),
    audience_age_max: z.number().int().min(13).max(65),
    audience_gender: z.enum(["ALL", "FEMALE", "MALE"]),
    audience_affinity_ids: z.array(z.string().trim().min(1)).max(5),
    audience_geographies: z.array(z.record(z.unknown())),
  }),
  commercials: z.object({
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
  }),
});

export type CanonicalCampaignWizardPayload = z.infer<
  typeof CanonicalCampaignWizardPayloadSchema
>;
