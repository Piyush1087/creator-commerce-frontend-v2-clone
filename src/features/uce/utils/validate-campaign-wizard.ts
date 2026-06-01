import type { ZodError } from "zod";

import {
  IntegratedCampaignWizardPayloadSchema,
  Step1StrategySchema,
  Step2TargetingSchema,
  Step3CommercialsSchema,
} from "../schemas/campaign-wizard-schema";
import {
  mapWizardToIntegratedPayload,
  mapWizardToStep1Payload,
  mapWizardToStep2Payload,
  mapWizardToStep3Payload,
} from "../mappers/map-wizard-to-payload";
import type { WizardData, WizardFieldErrors, WizardFieldKey } from "../types/campaign-wizard";

const API_PATH_TO_FIELD: Record<string, WizardFieldKey> = {
  campaign_name: "name",
  core_objective: "objective",
  timeline_type: "milestoneDays",
  fixed_start_date: "startDate",
  fixed_end_date: "endDate",
  dynamic_days_limit: "milestoneDays",
  platform_deliverables: "platforms",
  industry_vertical: "industry",
  creator_archetypes: "archetypes",
  follower_tiers: "followerTiers",
  audience_age_min: "ageMin",
  audience_age_max: "ageMax",
  audience_gender: "genderFocus",
  target_locations: "targetLocations",
  disqualifying_keywords: "disqualifyingKeywords",
  compensation_type: "compensationType",
  fixed_fee_amount: "flatRatePerCreator",
  negotiable_min_fee: "negotiableMinFee",
  negotiable_max_fee: "negotiableMaxFee",
  total_campaign_budget_pool: "budget",
  advance_payment_percentage: "advancePercent",
  final_balance_terms: "payoutTerms",
};

export function zodErrorToFieldErrors(error: ZodError): WizardFieldErrors {
  const fieldErrors: WizardFieldErrors = {};

  for (const issue of error.issues) {
    const segment = issue.path[0];
    const key =
      segment !== undefined
        ? API_PATH_TO_FIELD[String(segment)] ?? "_form"
        : "_form";

    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

export type WizardValidationResult =
  | { success: true }
  | {
      success: false;
      fieldErrors: WizardFieldErrors;
      formError: string;
    };

function failure(error: ZodError): WizardValidationResult {
  const fieldErrors = zodErrorToFieldErrors(error);
  const formError =
    error.issues[0]?.message ?? "Please fix the highlighted fields before continuing.";
  return { success: false, fieldErrors, formError };
}

export function validateCampaignWizardStep(
  step: 1 | 2 | 3,
  data: WizardData,
): WizardValidationResult {
  if (step === 1) {
    const parsed = Step1StrategySchema.safeParse(mapWizardToStep1Payload(data));
    return parsed.success ? { success: true } : failure(parsed.error);
  }
  if (step === 2) {
    const parsed = Step2TargetingSchema.safeParse(mapWizardToStep2Payload(data));
    return parsed.success ? { success: true } : failure(parsed.error);
  }
  const parsed = Step3CommercialsSchema.safeParse(mapWizardToStep3Payload(data));
  return parsed.success ? { success: true } : failure(parsed.error);
}

export function validateFullCampaignWizard(
  data: WizardData,
): WizardValidationResult {
  const parsed = IntegratedCampaignWizardPayloadSchema.safeParse(
    mapWizardToIntegratedPayload(data),
  );
  return parsed.success ? { success: true } : failure(parsed.error);
}

export function getFieldError(
  errors: WizardFieldErrors,
  key: WizardFieldKey,
): string | undefined {
  return errors[key];
}
