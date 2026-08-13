import type { ZodError, ZodIssue } from "zod";
import { IntegratedCampaignWizardPayloadSchema, Step1StrategySchema, Step2TargetingSchema, Step3CommercialsSchema } from "../schemas/campaign-wizard-schema";
import { mapWizardToIntegratedPayload, mapWizardToStep1Payload, mapWizardToStep2Payload, mapWizardToStep3Payload } from "../mappers/map-wizard-to-payload";
import type { WizardData, WizardFieldErrors, WizardFieldKey } from "../types/campaign-wizard";

const API_PATH_TO_FIELD: Record<string, WizardFieldKey> = {
  campaign_name: "campaignName", core_objective: "coreObjective", publishing_schedule: "publishingSchedule",
  publish_from: "publishFrom", publish_until: "publishUntil", platforms: "platforms", campaign_visibility: "campaignVisibility",
  creator_archetypes: "creatorArchetypes", minimum_followers: "minimumFollowers", maximum_followers: "maximumFollowers",
  audience_age_min: "audienceAgeMin", audience_age_max: "audienceAgeMax", audience_gender: "audienceGender",
  audience_affinity_ids: "audienceAffinityIds", audience_geographies: "audienceGeographies",
  receives_brand_support: "receivesBrandSupport", brand_support_type: "brandSupportType",
  brand_support_estimated_value: "brandSupportEstimatedValue", compensation_model: "compensationModel",
  commercial_offer: "commercialOffer", total_campaign_budget: "totalCampaignBudget",
  advance_payment_percentage: "advancePaymentPercentage", payout_terms: "payoutTerms",
};

const COPY: Partial<Record<WizardFieldKey, string>> = {
  campaignName: "Campaign Name must be between 3 and 60 characters.", coreObjective: "Select a Campaign Objective.",
  publishFrom: "Choose a valid Start Date.", publishUntil: "Choose a valid End Date.", platforms: "Select at least one Platform.",
  creatorArchetypes: "Select at least one Creator Archetype.", audienceGeographies: "Select at least one Target Location.",
  minimumFollowers: "Enter a valid minimum follower count.", maximumFollowers: "Maximum Followers must be greater than Minimum Followers.",
  audienceAgeMin: "Choose a valid minimum audience age.", audienceAgeMax: "Maximum Age must be at least Minimum Age.",
  commercialOffer: "Enter the creator payout.", totalCampaignBudget: "Enter the Campaign Budget.",
  brandSupportType: "Select the support creators will receive.", brandSupportEstimatedValue: "Enter the estimated support value.",
};

const STEP_1: WizardFieldKey[] = ["campaignName", "coreObjective", "publishingSchedule", "publishFrom", "publishUntil", "platforms", "campaignVisibility"];
const STEP_2: WizardFieldKey[] = ["creatorArchetypes", "minimumFollowers", "maximumFollowers", "audienceAgeMin", "audienceAgeMax", "audienceGender", "audienceAffinityIds", "audienceGeographies"];

function fieldFor(path: (string | number)[]): WizardFieldKey {
  const keys = path.filter((value): value is string => typeof value === "string");
  return API_PATH_TO_FIELD[keys[keys.length - 1] ?? ""] ?? "_form";
}

function messageFor(issue: ZodIssue, key: WizardFieldKey): string {
  if (key === "campaignName" && issue.code === "too_big") return "Campaign Name must be 60 characters or fewer.";
  if (key === "campaignName" && issue.code === "too_small") return "Campaign Name must be at least 3 characters.";
  if (issue.message === "Start date cannot be in the past.") return issue.message;
  if (issue.message === "End date must follow start date.") return issue.message;
  if (issue.message === "Campaign budget must cover the creator offer.") return "Campaign Budget must cover the creator payout.";
  return COPY[key] ?? "Check this field and try again.";
}

export function wizardStepForField(key: WizardFieldKey): 1 | 2 | 3 {
  return STEP_1.includes(key) ? 1 : STEP_2.includes(key) ? 2 : 3;
}
export function zodErrorToFieldErrors(error: ZodError): WizardFieldErrors {
  const result: WizardFieldErrors = {};
  for (const issue of error.issues) { const key = fieldFor(issue.path); result[key] ??= messageFor(issue, key); }
  return result;
}
export function flattenIssuesToFieldErrors(issues: unknown): WizardFieldErrors {
  const result: WizardFieldErrors = {};
  const visit = (node: unknown, path: string[] = []) => {
    if (Array.isArray(node) && node.length && typeof node[0] === "string") {
      const key = fieldFor(path); result[key] ??= COPY[key] ?? String(node[0]); return;
    }
    if (node && typeof node === "object") for (const [key, value] of Object.entries(node)) visit(value, [...path, key]);
  };
  visit((issues as { fieldErrors?: unknown } | null)?.fieldErrors);
  return result;
}
export function firstWizardFieldError(errors: WizardFieldErrors, fallback: string): string { return Object.values(errors)[0] ?? fallback; }
export function firstWizardErrorStep(errors: WizardFieldErrors): 1 | 2 | 3 | null { const key = Object.keys(errors).find((value) => value !== "_form") as WizardFieldKey | undefined; return key ? wizardStepForField(key) : null; }
export type WizardValidationResult = { success: true } | { success: false; fieldErrors: WizardFieldErrors; formError: string };
function outcome(parsed: { success: true } | { success: false; error: ZodError }): WizardValidationResult {
  if (parsed.success) return { success: true };
  const fieldErrors = zodErrorToFieldErrors(parsed.error);
  return { success: false, fieldErrors, formError: firstWizardFieldError(fieldErrors, "Please fix the highlighted fields before continuing.") };
}
export function validateCampaignWizardStep(step: 1 | 2 | 3, data: WizardData): WizardValidationResult {
  return step === 1 ? outcome(Step1StrategySchema.safeParse(mapWizardToStep1Payload(data))) : step === 2 ? outcome(Step2TargetingSchema.safeParse(mapWizardToStep2Payload(data))) : outcome(Step3CommercialsSchema.safeParse(mapWizardToStep3Payload(data)));
}
export function validateFullCampaignWizard(data: WizardData): WizardValidationResult { return outcome(IntegratedCampaignWizardPayloadSchema.safeParse(mapWizardToIntegratedPayload(data))); }
export function validateCampaignWizardField(key: WizardFieldKey, data: WizardData): string | undefined {
  const result = validateCampaignWizardStep(wizardStepForField(key), data);
  return result.success ? undefined : result.fieldErrors[key];
}
export function getFieldError(errors: WizardFieldErrors, key: WizardFieldKey): string | undefined { return errors[key]; }
