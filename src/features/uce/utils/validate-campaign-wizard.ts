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
  publishing_schedule: "milestoneDays",
  publish_from: "startDate",
  publish_until: "endDate",
  platforms: "platforms",
  audience_affinity_ids: "industry",
  creator_archetypes: "archetypes",
  minimum_followers: "followerTiers",
  maximum_followers: "followerTiers",
  audience_age_min: "ageMin",
  audience_age_max: "ageMax",
  audience_gender: "genderFocus",
  audience_geographies: "targetLocations",
  compensation_model: "compensationType",
  commercial_offer: "flatRatePerCreator",
  total_campaign_budget: "budget",
  advance_payment_percentage: "advancePercent",
  payout_terms: "payoutTerms",
};

const STEP_1_FIELDS: WizardFieldKey[] = [
  "name",
  "objective",
  "startDate",
  "endDate",
  "milestoneDays",
  "platforms",
];

const STEP_2_FIELDS: WizardFieldKey[] = [
  "industry",
  "archetypes",
  "followerTiers",
  "ageMin",
  "ageMax",
  "genderFocus",
  "targetLocations",
  "disqualifyingKeywords",
];

const INTEGRATED_SECTIONS = new Set(["strategy", "targeting", "commercials"]);

const SECTION_TO_WIZARD_FIELD: Record<string, WizardFieldKey> = {
  strategy: "name",
  targeting: "industry",
  commercials: "budget",
};

const SECTION_REQUIRED_MESSAGE: Record<string, string> = {
  strategy: "Complete strategy details on step 1 before publishing.",
  targeting: "Complete targeting details on step 2 before publishing.",
  commercials: "Complete commercial terms on step 3 before publishing.",
};

function apiPathToWizardField(path: (string | number)[]): WizardFieldKey {
  const segments = path.filter((segment): segment is string => typeof segment === "string");

  if (segments.includes("platforms")) {
    return "platforms";
  }

  if (
    segments.length >= 2 &&
    INTEGRATED_SECTIONS.has(segments[0] ?? "")
  ) {
    const apiField = segments[1];
    if (apiField) {
      return API_PATH_TO_FIELD[apiField] ?? "_form";
    }
  }

  const leaf = segments[segments.length - 1];
  if (leaf) {
    return API_PATH_TO_FIELD[leaf] ?? "_form";
  }

  return "_form";
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

    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

function walkFlattenedFieldErrors(
  node: Record<string, unknown>,
  prefix: string[],
): WizardFieldErrors {
  const fieldErrors: WizardFieldErrors = {};

  for (const [key, value] of Object.entries(node)) {
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((entry) => typeof entry === "string")
    ) {
      const path = [...prefix, key];
      let wizardKey = apiPathToWizardField(path);
      let message = value[0];

      if (
        prefix.length === 0 &&
        SECTION_TO_WIZARD_FIELD[key] &&
        message === "Required"
      ) {
        wizardKey = SECTION_TO_WIZARD_FIELD[key]!;
        message = SECTION_REQUIRED_MESSAGE[key] ?? message;
      }

      if (!fieldErrors[wizardKey]) {
        fieldErrors[wizardKey] = message;
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
  if (!issues || typeof issues !== "object") {
    return {};
  }

  const record = issues as {
    formErrors?: unknown;
    fieldErrors?: unknown;
  };

  const fieldErrors =
    record.fieldErrors && typeof record.fieldErrors === "object"
      ? walkFlattenedFieldErrors(record.fieldErrors as Record<string, unknown>, [])
      : {};

  if (
    Array.isArray(record.formErrors) &&
    record.formErrors.length > 0 &&
    typeof record.formErrors[0] === "string" &&
    !fieldErrors._form
  ) {
    fieldErrors._form = record.formErrors[0];
  }

  return fieldErrors;
}

export function firstWizardFieldError(
  fieldErrors: WizardFieldErrors,
  fallback: string,
): string {
  for (const key of Object.keys(fieldErrors) as WizardFieldKey[]) {
    if (key !== "_form" && fieldErrors[key]) {
      return fieldErrors[key]!;
    }
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
