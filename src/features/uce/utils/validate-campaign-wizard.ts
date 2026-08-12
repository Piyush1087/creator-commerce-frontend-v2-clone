import type { ZodError } from "zod";

import {
  CanonicalCampaignStrategySchema,
  CanonicalCommercialPolicySchema,
  CanonicalCreatorStrategySchema,
  CanonicalCampaignWizardPayloadSchema,
} from "../schemas/canonical-campaign-wizard-schema";
import { mapWizardToCanonicalPayload } from "../mappers/map-wizard-to-canonical-payload";
import type { WizardData, WizardFieldErrors, WizardFieldKey } from "../types/campaign-wizard";

const API_PATH_TO_FIELD: Record<string, WizardFieldKey> = {
  campaign_name: "name",
  core_objective: "objective",
  publishing_schedule: "publishingSchedule",
  publish_from: "publishFrom",
  publish_until: "publishUntil",
  campaign_visibility: "visibility",
  creator_archetypes: "archetypes",
  minimum_followers: "minimumFollowers",
  maximum_followers: "maximumFollowers",
  audience_age_min: "audienceAgeMin",
  audience_age_max: "audienceAgeMax",
  audience_gender: "audienceGender",
  audience_affinity_ids: "affinityIds",
  audience_geographies: "geographyLabels",
  receives_brand_support: "receivesBrandSupport",
  brand_support_type: "brandSupportType",
  brand_support_estimated_value: "brandSupportEstimatedValue",
  compensation_model: "compensationModel",
  commercial_offer: "commercialOffer",
  total_campaign_budget: "totalCampaignBudget",
  advance_payment_percentage: "advancePaymentPercentage",
  payout_terms: "payoutTerms",
};

const STEP_1_FIELDS: WizardFieldKey[] = [
  "name",
  "objective",
  "publishingSchedule",
  "publishFrom",
  "publishUntil",
  "visibility",
];
const STEP_2_FIELDS: WizardFieldKey[] = [
  "archetypes",
  "minimumFollowers",
  "maximumFollowers",
  "audienceAgeMin",
  "audienceAgeMax",
  "audienceGender",
  "affinityIds",
  "geographyLabels",
];

function apiPathToWizardField(path: (string | number)[]): WizardFieldKey {
  const leaf = [...path].reverse().find((segment): segment is string => typeof segment === "string");
  return leaf ? API_PATH_TO_FIELD[leaf] ?? "_form" : "_form";
}

export function wizardStepForField(key: WizardFieldKey): 1 | 2 | 3 {
  if (STEP_1_FIELDS.includes(key)) return 1;
  if (STEP_2_FIELDS.includes(key)) return 2;
  return 3;
}

export function zodErrorToFieldErrors(error: ZodError): WizardFieldErrors {
  const fieldErrors: WizardFieldErrors = {};
  for (const issue of error.issues) {
    const key = apiPathToWizardField(issue.path);
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function walkFlattenedFieldErrors(
  node: Record<string, unknown>,
  prefix: string[] = [],
): WizardFieldErrors {
  const fieldErrors: WizardFieldErrors = {};
  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      if (value.length > 0) {
        const wizardKey = apiPathToWizardField([...prefix, key]);
        if (!fieldErrors[wizardKey]) fieldErrors[wizardKey] = value[0] as string;
      }
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(
        fieldErrors,
        walkFlattenedFieldErrors(value as Record<string, unknown>, [...prefix, key]),
      );
    }
  }
  return fieldErrors;
}

export function flattenIssuesToFieldErrors(issues: unknown): WizardFieldErrors {
  if (!issues || typeof issues !== "object") return {};

  const issueRecord = issues as {
    issues?: Array<{ path?: Array<string | number>; message?: string }>;
    fieldErrors?: Record<string, unknown>;
    formErrors?: unknown;
  };

  if (Array.isArray(issueRecord.issues)) {
    const fieldErrors: WizardFieldErrors = {};
    for (const issue of issueRecord.issues) {
      const key = apiPathToWizardField(issue.path ?? []);
      if (!fieldErrors[key] && issue.message) fieldErrors[key] = issue.message;
    }
    return fieldErrors;
  }

  const fieldErrors = issueRecord.fieldErrors
    ? walkFlattenedFieldErrors(issueRecord.fieldErrors)
    : {};
  if (
    Array.isArray(issueRecord.formErrors) &&
    typeof issueRecord.formErrors[0] === "string" &&
    !fieldErrors._form
  ) {
    fieldErrors._form = issueRecord.formErrors[0];
  }
  return fieldErrors;
}

export function firstWizardFieldError(fieldErrors: WizardFieldErrors, fallback: string): string {
  for (const key of Object.keys(fieldErrors) as WizardFieldKey[]) {
    if (key !== "_form" && fieldErrors[key]) return fieldErrors[key]!;
  }
  return fieldErrors._form ?? fallback;
}

export function firstWizardErrorStep(fieldErrors: WizardFieldErrors): 1 | 2 | 3 | null {
  for (const key of Object.keys(fieldErrors) as WizardFieldKey[]) {
    if (key === "_form") continue;
    return wizardStepForField(key);
  }
  return null;
}

export type WizardValidationResult =
  | { success: true }
  | { success: false; fieldErrors: WizardFieldErrors; formError: string };

function failure(error: ZodError): WizardValidationResult {
  const fieldErrors = zodErrorToFieldErrors(error);
  return {
    success: false,
    fieldErrors,
    formError: error.issues[0]?.message ?? "Please fix the highlighted fields before continuing.",
  };
}

function strategyInput(data: WizardData) {
  return {
    campaign_name: data.name.trim(),
    publishing_schedule: data.publishingSchedule,
    publish_from:
      data.publishingSchedule === "SCHEDULED" && data.publishFrom
        ? new Date(`${data.publishFrom}T00:00:00`).toISOString()
        : null,
    publish_until:
      data.publishingSchedule === "SCHEDULED" && data.publishUntil
        ? new Date(`${data.publishUntil}T23:59:59.999`).toISOString()
        : null,
    core_objective: data.objective,
    platforms: ["INSTAGRAM"],
    campaign_visibility: data.visibility,
  };
}

function targetingInput(data: WizardData) {
  return {
    creator_archetypes: data.archetypes,
    minimum_followers: data.minimumFollowers,
    maximum_followers: data.maximumFollowers,
    audience_age_min: data.audienceAgeMin,
    audience_age_max: data.audienceAgeMax,
    audience_gender: data.audienceGender,
    audience_affinity_ids: data.affinityIds,
    audience_geographies: data.geographyLabels.map((label) => ({
      source: "PENDING_GOOGLE_PLACES_NORMALIZATION",
      label,
    })),
  };
}

function commercialInput(data: WizardData) {
  return {
    receives_brand_support: data.receivesBrandSupport,
    brand_support_type: data.receivesBrandSupport ? data.brandSupportType : null,
    brand_support_estimated_value: data.receivesBrandSupport
      ? data.brandSupportEstimatedValue
      : null,
    compensation_model: data.compensationModel,
    commercial_offer: data.commercialOffer,
    total_campaign_budget: data.totalCampaignBudget,
    advance_payment_percentage: data.advancePaymentPercentage,
    payout_terms: data.payoutTerms,
  };
}

export function validateCampaignWizardStep(
  step: 1 | 2 | 3,
  data: WizardData,
): WizardValidationResult {
  if (step === 1) {
    const parsed = CanonicalCampaignStrategySchema.safeParse(strategyInput(data));
    return parsed.success ? { success: true } : failure(parsed.error);
  }
  if (step === 2) {
    const parsed = CanonicalCreatorStrategySchema.safeParse(targetingInput(data));
    return parsed.success ? { success: true } : failure(parsed.error);
  }
  const parsed = CanonicalCommercialPolicySchema.safeParse(commercialInput(data));
  return parsed.success ? { success: true } : failure(parsed.error);
}

export function validateFullCampaignWizard(data: WizardData): WizardValidationResult {
  try {
    const parsed = CanonicalCampaignWizardPayloadSchema.safeParse(
      mapWizardToCanonicalPayload(data),
    );
    return parsed.success ? { success: true } : failure(parsed.error);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Campaign data.";
    return {
      success: false,
      fieldErrors: { _form: message },
      formError: message,
    };
  }
}

export function getFieldError(
  errors: WizardFieldErrors,
  key: WizardFieldKey,
): string | undefined {
  return errors[key];
}
