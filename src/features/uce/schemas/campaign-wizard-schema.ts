import { z } from "zod";

/** Aligned with backend `uce-wizard.schema.ts` and product docs (Zod Schema.md). */

export const UceCampaignStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
]);

export const UceTimelineStructureSchema = z.enum([
  "FIXED_DATES",
  "DYNAMIC_MILESTONES",
]);

export const UceCampaignObjectiveSchema = z.enum([
  "BRAND_AWARENESS",
  "TRAFFIC_CLICKS",
  "SALES_CONVERSIONS",
]);

export const UceCompensationTypeSchema = z.enum(["FIXED_FEE", "NEGOTIABLE"]);

export const UcePayoutTermsSchema = z.enum([
  "IMMEDIATE",
  "NET_7",
  "NET_15",
  "NET_30",
]);

export const UceMediaPlatformSchema = z.enum([
  "INSTAGRAM",
  "TIKTOK",
  "YOUTUBE",
]);

export const Step1StrategySchema = z
  .object({
    campaign_name: z
      .string()
      .min(3, "Campaign naming profiles require at least 3 characters.")
      .max(255),
    timeline_type: UceTimelineStructureSchema,
    fixed_start_date: z.string().datetime().optional().nullable(),
    fixed_end_date: z.string().datetime().optional().nullable(),
    dynamic_days_limit: z.number().int().positive().optional().nullable(),
    core_objective: UceCampaignObjectiveSchema,
    platform_deliverables: z
      .array(
        z.object({
          platform: UceMediaPlatformSchema,
          formats: z
            .array(z.string())
            .min(1, "Assign at least one deliverable layout variant."),
        }),
      )
      .min(1, "The campaign build must specify platform deliverables targets."),
  })
  .superRefine((data, ctx) => {
    if (data.timeline_type === "FIXED_DATES") {
      if (!data.fixed_start_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Fixed configurations require a clear start timeline context.",
          path: ["fixed_start_date"],
        });
      }
      if (!data.fixed_end_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Fixed configurations require a clear termination deadline.",
          path: ["fixed_end_date"],
        });
      }
      if (
        data.fixed_start_date &&
        data.fixed_end_date &&
        new Date(data.fixed_start_date) >= new Date(data.fixed_end_date)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Campaign initiation timelines must precede specified end parameters.",
          path: ["fixed_end_date"],
        });
      }
    }
    if (data.timeline_type === "DYNAMIC_MILESTONES" && !data.dynamic_days_limit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Dynamic execution tracks require explicitly defined baseline days limits.",
        path: ["dynamic_days_limit"],
      });
    }
  });

export const Step2TargetingSchema = z
  .object({
    industry_vertical: z
      .string()
      .min(1, "Target enterprise industry categorization required."),
    creator_archetypes: z
      .array(z.string())
      .min(1, "Map at least one creator demographic target profile orientation."),
    follower_tiers: z
      .array(z.string())
      .min(1, "Specify targeted creator community scale ranges."),
    audience_age_min: z
      .number()
      .int()
      .min(13, "Minimum tracking limits match standard OAuth privacy definitions at 13."),
    audience_age_max: z.number().int().max(65),
    audience_gender: z.string().default("ALL"),
    target_locations: z
      .array(z.string())
      .min(1, "Provide targeted operational territory distribution maps."),
    disqualifying_keywords: z.array(z.string()).optional().default([]),
  })
  .refine((data) => data.audience_age_min <= data.audience_age_max, {
    message: "Minimum parameters framework cannot overtake defined max boundaries.",
    path: ["audience_age_min"],
  });

export const Step3CommercialsSchema = z
  .object({
    compensation_type: UceCompensationTypeSchema,
    fixed_fee_amount: z.number().nonnegative().optional().default(0),
    negotiable_min_fee: z.number().nonnegative().optional().default(0),
    negotiable_max_fee: z.number().nonnegative().optional().default(0),
    total_campaign_budget_pool: z
      .number()
      .positive("Campaign fiscal execution bounds must track valid monetary balances."),
    advance_payment_percentage: z
      .number()
      .int()
      .min(30, "System protection locks force advance escrow thresholds to at least 30%.")
      .max(100),
    final_balance_terms: UcePayoutTermsSchema,
  })
  .superRefine((data, ctx) => {
    if (data.compensation_type === "FIXED_FEE" && data.fixed_fee_amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fixed compensation models require positive creator fee settings.",
        path: ["fixed_fee_amount"],
      });
    }
    if (data.compensation_type === "NEGOTIABLE") {
      if (data.negotiable_min_fee >= data.negotiable_max_fee) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Minimum boundaries must be strictly less than maximum budget caps.",
          path: ["negotiable_min_fee"],
        });
      }
      if (data.negotiable_max_fee <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Negotiation ceiling configurations require valid caps.",
          path: ["negotiable_max_fee"],
        });
      }
    }
  });

export const IntegratedCampaignWizardPayloadSchema = z.object({
  strategy: Step1StrategySchema,
  targeting: Step2TargetingSchema,
  commercials: Step3CommercialsSchema,
});

export type IntegratedCampaignWizardPayload = z.infer<
  typeof IntegratedCampaignWizardPayloadSchema
>;

export type Step1StrategyPayload = z.infer<typeof Step1StrategySchema>;
export type Step2TargetingPayload = z.infer<typeof Step2TargetingSchema>;
export type Step3CommercialsPayload = z.infer<typeof Step3CommercialsSchema>;
