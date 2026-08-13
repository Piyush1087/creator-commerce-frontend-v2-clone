import type { WizardData } from "../types/campaign-wizard";
import type {
  IntegratedCampaignWizardPayload,
  Step1StrategyPayload,
  Step2TargetingPayload,
  Step3CommercialsPayload,
} from "../schemas/campaign-wizard-schema";

const OBJECTIVE_TO_API: Record<string, Step1StrategyPayload["core_objective"]> = {
  "Brand Awareness": "PULSE",
  "Traffic & Clicks": "PROOF",
  "Content Production": "PRODUCTION",
  "Sales & Conversions": "PUSH",
};
const ARCHETYPE_TO_API: Record<string, string> = {
  Aesthetic: "AESTHETIC_MINIMALIST",
  Comedy: "ENTERTAINER",
  Tech: "INDUSTRY_EXPERT",
  Educational: "EDUCATOR",
  Lifestyle: "LIFESTYLE_INTEGRATOR",
  Fitness: "COACH",
  Beauty: "PRODUCT_REVIEWER",
};
const AFFINITY_TO_API: Record<string, string> = {
  fashion: "FASHION",
  beauty: "BEAUTY",
  tech: "TECHNOLOGY",
  fitness: "FITNESS",
  food: "FOOD",
};
const PAYOUT_TO_API: Record<string, Step3CommercialsPayload["payout_terms"]> = {
  "Net 7": "NET_7",
  "Net 15": "NET_15",
  "Net 30": "NET_30",
  "Net 45": "NET_45",
  "Net 60": "NET_60",
};
const COUNTRY_CODES: Record<string, string> = {
  "United States": "US",
  "United Kingdom": "GB",
  India: "IN",
  Canada: "CA",
  Australia: "AU",
};

function dateInputToIso(date: string, endOfDay: boolean): string | null {
  if (!date.trim()) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) parsed.setHours(23, 59, 59, 999);
  return parsed.toISOString();
}

export function mapWizardToStep1Payload(data: WizardData): Step1StrategyPayload {
  return {
    campaign_name: data.name.trim(),
    publishing_schedule: data.timeline === "fixed" ? "SCHEDULED" : "EVERGREEN",
    publish_from: data.timeline === "fixed" ? dateInputToIso(data.startDate, false) : null,
    publish_until: data.timeline === "fixed" ? dateInputToIso(data.endDate, true) : null,
    core_objective: OBJECTIVE_TO_API[data.objective] ?? "PULSE",
    platforms: ["INSTAGRAM"],
    campaign_visibility: "PUBLIC",
  };
}

export function mapWizardToStep2Payload(data: WizardData): Step2TargetingPayload {
  const tiers = data.followerTiers;
  const minimum_followers = tiers.includes("Nano (1k-10k)") ? 1_000 : tiers.includes("Micro (10k-50k)") ? 10_000 : tiers.includes("Mid-Tier (50k-250k)") ? 50_000 : 250_000;
  const maximum_followers = tiers.includes("Macro (250k+)") ? null : tiers.includes("Mid-Tier (50k-250k)") ? 250_000 : tiers.includes("Micro (10k-50k)") ? 50_000 : 10_000;
  return {
    creator_archetypes: data.archetypes.map((value) => ARCHETYPE_TO_API[value] ?? value),
    minimum_followers,
    maximum_followers,
    audience_age_min: data.ageMin,
    audience_age_max: data.ageMax,
    audience_gender: data.genderFocus === "Female-Skewing" ? "FEMALE" : data.genderFocus === "Male-Skewing" ? "MALE" : "ALL",
    audience_affinity_ids: data.industry ? [AFFINITY_TO_API[data.industry] ?? data.industry.toUpperCase()] : [],
    audience_geographies: data.targetLocations.map((label, index) => ({
      scope: COUNTRY_CODES[label] ? "COUNTRY" as const : "LOCALITY" as const,
      label,
      country_code: COUNTRY_CODES[label] ?? null,
      locality: COUNTRY_CODES[label] ? null : label,
      region: null,
      radius_km: null,
      is_primary: index === 0,
    })),
  };
}

export function mapWizardToStep3Payload(data: WizardData): Step3CommercialsPayload {
  const offer = data.compensationType === "fixed" ? data.flatRatePerCreator : data.negotiableMinFee;
  return {
    receives_brand_support: false,
    brand_support_type: null,
    brand_support_estimated_value: null,
    compensation_model: data.compensationType === "fixed" ? "FIXED" : "NEGOTIABLE",
    commercial_offer: offer,
    total_campaign_budget: data.budget,
    advance_payment_percentage: data.advancePercent as 0 | 25 | 50 | 75 | 100,
    payout_terms: PAYOUT_TO_API[data.payoutTerms] ?? "NET_7",
  };
}

export function mapWizardToIntegratedPayload(data: WizardData): IntegratedCampaignWizardPayload {
  return {
    strategy: mapWizardToStep1Payload(data),
    targeting: mapWizardToStep2Payload(data),
    commercials: mapWizardToStep3Payload(data),
  };
}
