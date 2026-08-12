import type { WizardData } from "../types/campaign-wizard";
import {
  CanonicalCampaignWizardPayloadSchema,
  type CanonicalCampaignWizardPayload,
} from "../schemas/canonical-campaign-wizard-schema";

function dateInputToIso(date: string, endOfDay: boolean): string | null {
  if (!date.trim()) return null;
  const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  const parsed = new Date(`${date}${suffix}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function mapWizardToCanonicalPayload(
  data: WizardData,
): CanonicalCampaignWizardPayload {
  if (!data.objective) throw new Error("Select a Campaign objective.");

  return CanonicalCampaignWizardPayloadSchema.parse({
    strategy: {
      campaign_name: data.name.trim(),
      publishing_schedule: data.publishingSchedule,
      publish_from:
        data.publishingSchedule === "SCHEDULED"
          ? dateInputToIso(data.publishFrom, false)
          : null,
      publish_until:
        data.publishingSchedule === "SCHEDULED"
          ? dateInputToIso(data.publishUntil, true)
          : null,
      core_objective: data.objective,
      platforms: ["INSTAGRAM"],
      campaign_visibility: data.visibility,
    },
    targeting: {
      creator_archetypes: data.archetypes,
      minimum_followers: data.minimumFollowers,
      maximum_followers: data.maximumFollowers,
      audience_age_min: data.audienceAgeMin,
      audience_age_max: data.audienceAgeMax,
      audience_gender: data.audienceGender,
      audience_affinity_ids: data.affinityIds,
      audience_geographies: data.audienceGeographies,
    },
    commercials: {
      receives_brand_support: data.receivesBrandSupport,
      brand_support_type: data.receivesBrandSupport ? data.brandSupportType : null,
      brand_support_estimated_value:
        data.receivesBrandSupport ? data.brandSupportEstimatedValue : null,
      compensation_model: data.compensationModel,
      commercial_offer: data.commercialOffer,
      total_campaign_budget: data.totalCampaignBudget,
      advance_payment_percentage: data.advancePaymentPercentage,
      payout_terms: data.payoutTerms,
    },
  });
}
