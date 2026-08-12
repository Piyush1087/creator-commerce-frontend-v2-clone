import type { CanonicalCampaignDraftPath } from "../api/canonical-campaign-draft-client";
import type {
  CampaignAudienceGeography,
  WizardData,
  WizardFieldKey,
} from "../types/campaign-wizard";

const FIELD_TO_PATH: Partial<Record<WizardFieldKey, CanonicalCampaignDraftPath>> = {
  name: "strategy.campaign_name",
  objective: "strategy.core_objective",
  publishingSchedule: "strategy.publishing_schedule",
  publishFrom: "strategy.publish_from",
  publishUntil: "strategy.publish_until",
  visibility: "strategy.campaign_visibility",
  archetypes: "targeting.creator_archetypes",
  minimumFollowers: "targeting.minimum_followers",
  maximumFollowers: "targeting.maximum_followers",
  audienceAgeMin: "targeting.audience_age_min",
  audienceAgeMax: "targeting.audience_age_max",
  audienceGender: "targeting.audience_gender",
  affinityIds: "targeting.audience_affinity_ids",
  audienceGeographies: "targeting.audience_geographies",
  receivesBrandSupport: "commercials.receives_brand_support",
  brandSupportType: "commercials.brand_support_type",
  brandSupportEstimatedValue: "commercials.brand_support_estimated_value",
  compensationModel: "commercials.compensation_model",
  commercialOffer: "commercials.commercial_offer",
  totalCampaignBudget: "commercials.total_campaign_budget",
  advancePaymentPercentage: "commercials.advance_payment_percentage",
  payoutTerms: "commercials.payout_terms",
};

function dateToIso(date: string, endOfDay: boolean): string | null {
  if (!date.trim()) return null;
  const value = new Date(`${date}${endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z"}`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

export function canonicalDraftPatchForField(
  field: WizardFieldKey,
  data: WizardData,
): { path: CanonicalCampaignDraftPath; value: unknown } | null {
  const path = FIELD_TO_PATH[field];
  if (!path) return null;

  const values: Record<Exclude<WizardFieldKey, "_form">, unknown> = {
    name: data.name.trim(),
    objective: data.objective,
    publishingSchedule: data.publishingSchedule,
    publishFrom: dateToIso(data.publishFrom, false),
    publishUntil: dateToIso(data.publishUntil, true),
    visibility: data.visibility,
    archetypes: data.archetypes,
    minimumFollowers: data.minimumFollowers,
    maximumFollowers: data.maximumFollowers,
    audienceAgeMin: data.audienceAgeMin,
    audienceAgeMax: data.audienceAgeMax,
    audienceGender: data.audienceGender,
    affinityIds: data.affinityIds,
    audienceGeographies: data.audienceGeographies,
    receivesBrandSupport: data.receivesBrandSupport,
    brandSupportType: data.receivesBrandSupport ? data.brandSupportType : null,
    brandSupportEstimatedValue: data.receivesBrandSupport
      ? data.brandSupportEstimatedValue
      : null,
    compensationModel: data.compensationModel,
    commercialOffer: data.commercialOffer,
    totalCampaignBudget: data.totalCampaignBudget,
    advancePaymentPercentage: data.advancePaymentPercentage,
    payoutTerms: data.payoutTerms,
  };

  return { path, value: values[field as Exclude<WizardFieldKey, "_form">] };
}

function isoToDateInput(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  return value.slice(0, 10);
}

function isCampaignAudienceGeography(value: unknown): value is CampaignAudienceGeography {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    ["LOCALITY", "REGION", "COUNTRY", "GLOBAL"].includes(String(item.scope)) &&
    typeof item.label === "string" &&
    (typeof item.country_code === "string" || item.country_code === null) &&
    (typeof item.locality === "string" || item.locality === null) &&
    (typeof item.region === "string" || item.region === null) &&
    (typeof item.radius_km === "number" || item.radius_km === null) &&
    typeof item.is_primary === "boolean"
  );
}

export function mergeCanonicalDraftIntoWizardData(
  base: WizardData,
  draft?: {
    strategy?: Record<string, unknown>;
    targeting?: Record<string, unknown>;
    commercials?: Record<string, unknown>;
  },
): WizardData {
  if (!draft) return base;
  const strategy = draft.strategy ?? {};
  const targeting = draft.targeting ?? {};
  const commercials = draft.commercials ?? {};

  const geographies = Array.isArray(targeting.audience_geographies)
    ? targeting.audience_geographies.filter(isCampaignAudienceGeography)
    : base.audienceGeographies;

  return {
    ...base,
    name: typeof strategy.campaign_name === "string" ? strategy.campaign_name : base.name,
    objective: typeof strategy.core_objective === "string" ? strategy.core_objective as WizardData["objective"] : base.objective,
    publishingSchedule: typeof strategy.publishing_schedule === "string" ? strategy.publishing_schedule as WizardData["publishingSchedule"] : base.publishingSchedule,
    publishFrom: isoToDateInput(strategy.publish_from),
    publishUntil: isoToDateInput(strategy.publish_until),
    visibility: typeof strategy.campaign_visibility === "string" ? strategy.campaign_visibility as WizardData["visibility"] : base.visibility,
    archetypes: Array.isArray(targeting.creator_archetypes) ? targeting.creator_archetypes.map(String) : base.archetypes,
    minimumFollowers: typeof targeting.minimum_followers === "number" ? targeting.minimum_followers : base.minimumFollowers,
    maximumFollowers: typeof targeting.maximum_followers === "number" || targeting.maximum_followers === null ? targeting.maximum_followers as number | null : base.maximumFollowers,
    audienceAgeMin: typeof targeting.audience_age_min === "number" ? targeting.audience_age_min : base.audienceAgeMin,
    audienceAgeMax: typeof targeting.audience_age_max === "number" ? targeting.audience_age_max : base.audienceAgeMax,
    audienceGender: typeof targeting.audience_gender === "string" ? targeting.audience_gender as WizardData["audienceGender"] : base.audienceGender,
    affinityIds: Array.isArray(targeting.audience_affinity_ids) ? targeting.audience_affinity_ids.map(String) : base.affinityIds,
    audienceGeographies: geographies,
    receivesBrandSupport: typeof commercials.receives_brand_support === "boolean" ? commercials.receives_brand_support : base.receivesBrandSupport,
    brandSupportType: typeof commercials.brand_support_type === "string" || commercials.brand_support_type === null ? commercials.brand_support_type as WizardData["brandSupportType"] : base.brandSupportType,
    brandSupportEstimatedValue: typeof commercials.brand_support_estimated_value === "number" || commercials.brand_support_estimated_value === null ? commercials.brand_support_estimated_value as number | null : base.brandSupportEstimatedValue,
    compensationModel: typeof commercials.compensation_model === "string" ? commercials.compensation_model as WizardData["compensationModel"] : base.compensationModel,
    commercialOffer: typeof commercials.commercial_offer === "number" ? commercials.commercial_offer : base.commercialOffer,
    totalCampaignBudget: typeof commercials.total_campaign_budget === "number" ? commercials.total_campaign_budget : base.totalCampaignBudget,
    advancePaymentPercentage: typeof commercials.advance_payment_percentage === "number" ? commercials.advance_payment_percentage as WizardData["advancePaymentPercentage"] : base.advancePaymentPercentage,
    payoutTerms: typeof commercials.payout_terms === "string" ? commercials.payout_terms as WizardData["payoutTerms"] : base.payoutTerms,
  };
}
