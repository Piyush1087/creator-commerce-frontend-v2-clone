import type { CanonicalCampaignDraftResponse } from "../contracts/brand-uce.contracts";
import type { WizardData } from "../types/campaign-wizard";

const dateInput = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function hydrateCanonicalCampaignDraft(draft: CanonicalCampaignDraftResponse, defaults: WizardData): WizardData {
  const strategy = draft.draft.strategy;
  const targeting = draft.draft.targeting;
  const commercials = draft.draft.commercials;
  return {
    ...defaults,
    campaignName: strategy?.campaign_name ?? defaults.campaignName,
    coreObjective: strategy?.core_objective ?? defaults.coreObjective,
    publishingSchedule: strategy?.publishing_schedule ?? defaults.publishingSchedule,
    publishFrom: dateInput(strategy?.publish_from),
    publishUntil: dateInput(strategy?.publish_until),
    platforms: strategy?.platforms ?? defaults.platforms,
    campaignVisibility: strategy?.campaign_visibility ?? defaults.campaignVisibility,
    creatorArchetypes: targeting?.creator_archetypes ?? defaults.creatorArchetypes,
    minimumFollowers: targeting?.minimum_followers ?? defaults.minimumFollowers,
    maximumFollowers: targeting?.maximum_followers === undefined ? defaults.maximumFollowers : targeting.maximum_followers,
    audienceAgeMin: targeting?.audience_age_min ?? defaults.audienceAgeMin,
    audienceAgeMax: targeting?.audience_age_max ?? defaults.audienceAgeMax,
    audienceGender: targeting?.audience_gender ?? defaults.audienceGender,
    audienceAffinityIds: targeting?.audience_affinity_ids ?? defaults.audienceAffinityIds,
    audienceGeographies: targeting?.audience_geographies ?? defaults.audienceGeographies,
    receivesBrandSupport: commercials?.receives_brand_support ?? defaults.receivesBrandSupport,
    brandSupportType: commercials?.brand_support_type === undefined ? defaults.brandSupportType : commercials.brand_support_type,
    brandSupportEstimatedValue: commercials?.brand_support_estimated_value === undefined ? defaults.brandSupportEstimatedValue : commercials.brand_support_estimated_value,
    compensationModel: commercials?.compensation_model ?? defaults.compensationModel,
    commercialOffer: commercials?.commercial_offer ?? defaults.commercialOffer,
    totalCampaignBudget: commercials?.total_campaign_budget ?? defaults.totalCampaignBudget,
    advancePaymentPercentage: commercials?.advance_payment_percentage ?? defaults.advancePaymentPercentage,
    payoutTerms: commercials?.payout_terms ?? defaults.payoutTerms,
  };
}
