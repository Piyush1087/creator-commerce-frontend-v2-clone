import type { WizardData } from "../types/campaign-wizard";
import type { IntegratedCampaignWizardPayload, Step1StrategyPayload, Step2TargetingPayload, Step3CommercialsPayload } from "../schemas/campaign-wizard-schema";

function dateInputToIso(date: string, endOfDay: boolean): string | null {
  if (!date.trim()) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) parsed.setHours(23, 59, 59, 999);
  return parsed.toISOString();
}

export function mapWizardToStep1Payload(data: WizardData): Step1StrategyPayload {
  return {
    campaign_name: data.campaignName.trim(),
    publishing_schedule: data.publishingSchedule,
    publish_from: data.publishingSchedule === "SCHEDULED" ? dateInputToIso(data.publishFrom, false) : null,
    publish_until: data.publishingSchedule === "SCHEDULED" ? dateInputToIso(data.publishUntil, true) : null,
    core_objective: data.coreObjective || "PULSE",
    platforms: data.platforms,
    campaign_visibility: data.campaignVisibility,
  };
}

export function mapWizardToStep2Payload(data: WizardData): Step2TargetingPayload {
  return {
    creator_archetypes: data.creatorArchetypes,
    minimum_followers: data.minimumFollowers,
    maximum_followers: data.maximumFollowers,
    audience_age_min: data.audienceAgeMin,
    audience_age_max: data.audienceAgeMax,
    audience_gender: data.audienceGender,
    audience_affinity_ids: data.audienceAffinityIds,
    audience_geographies: data.audienceGeographies,
  };
}

export function mapWizardToStep3Payload(data: WizardData): Step3CommercialsPayload {
  return {
    receives_brand_support: data.receivesBrandSupport,
    brand_support_type: data.receivesBrandSupport ? data.brandSupportType : null,
    brand_support_estimated_value: data.receivesBrandSupport ? data.brandSupportEstimatedValue : null,
    compensation_model: data.compensationModel,
    commercial_offer: data.commercialOffer,
    total_campaign_budget: data.totalCampaignBudget,
    advance_payment_percentage: data.advancePaymentPercentage,
    payout_terms: data.payoutTerms,
  };
}

export function mapWizardToIntegratedPayload(data: WizardData): IntegratedCampaignWizardPayload {
  return { strategy: mapWizardToStep1Payload(data), targeting: mapWizardToStep2Payload(data), commercials: mapWizardToStep3Payload(data) };
}
