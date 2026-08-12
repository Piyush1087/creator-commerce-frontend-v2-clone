import type { WizardData } from "../types/campaign-wizard";
import {
  CanonicalCampaignWizardPayloadSchema,
  type CanonicalCampaignWizardPayload,
} from "../schemas/canonical-campaign-wizard-schema";

const OBJECTIVE_TO_CANONICAL: Record<
  string,
  CanonicalCampaignWizardPayload["strategy"]["core_objective"]
> = {
  "Brand Awareness": "PULSE",
  "Awareness & Reach": "PULSE",
  "Trust & Validation": "PROOF",
  "High-Quality Assets": "PRODUCTION",
  "Traffic & Clicks": "PUSH",
  "Sales & Conversions": "PUSH",
  "Direct Action": "PUSH",
};

const GENDER_TO_CANONICAL: Record<
  string,
  CanonicalCampaignWizardPayload["targeting"]["audience_gender"]
> = {
  All: "ALL",
  ALL: "ALL",
  "Female-Skewing": "FEMALE",
  FEMALE: "FEMALE",
  "Male-Skewing": "MALE",
  MALE: "MALE",
};

const PAYOUT_TO_CANONICAL: Record<
  string,
  CanonicalCampaignWizardPayload["commercials"]["payout_terms"]
> = {
  "Net 7": "NET_7",
  "Net 15": "NET_15",
  "Net 30": "NET_30",
  "Net 45": "NET_45",
  "Net 60": "NET_60",
  NET_7: "NET_7",
  NET_15: "NET_15",
  NET_30: "NET_30",
  NET_45: "NET_45",
  NET_60: "NET_60",
};

const TIER_BOUNDS: Record<string, { min: number; max: number | null }> = {
  "Nano (1k-10k)": { min: 1_000, max: 10_000 },
  "Micro (10k-50k)": { min: 10_000, max: 50_000 },
  "Mid-Tier (50k-250k)": { min: 50_000, max: 250_000 },
  "Macro (250k+)": { min: 250_000, max: null },
};

function dateInputToIso(date: string, endOfDay: boolean): string | null {
  if (!date.trim()) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) parsed.setHours(23, 59, 59, 999);
  return parsed.toISOString();
}

function followerBounds(tiers: string[]) {
  const bounds = tiers.map((tier) => TIER_BOUNDS[tier]).filter(Boolean);
  if (bounds.length === 0) return { min: 0, max: null as number | null };
  const min = Math.min(...bounds.map((bound) => bound.min));
  const max = bounds.some((bound) => bound.max == null)
    ? null
    : Math.max(...bounds.map((bound) => bound.max as number));
  return { min, max };
}

export function mapWizardToCanonicalPayload(
  data: WizardData,
): CanonicalCampaignWizardPayload {
  const objective = OBJECTIVE_TO_CANONICAL[data.objective];
  if (!objective) throw new Error("Select a canonical Campaign objective.");

  const payoutTerms = PAYOUT_TO_CANONICAL[data.payoutTerms];
  if (!payoutTerms) {
    throw new Error("Select Net 7, Net 15, Net 30, Net 45, or Net 60 payment terms.");
  }

  const allowedAdvance = [0, 25, 50, 75, 100] as const;
  if (!allowedAdvance.includes(data.advancePercent as (typeof allowedAdvance)[number])) {
    throw new Error("Advance payment must be 0%, 25%, 50%, 75%, or 100%.");
  }

  const bounds = followerBounds(data.followerTiers);
  const isFixed = data.compensationType === "fixed";

  const payload: CanonicalCampaignWizardPayload = {
    strategy: {
      campaign_name: data.name.trim(),
      publishing_schedule: data.timeline === "fixed" ? "SCHEDULED" : "EVERGREEN",
      publish_from:
        data.timeline === "fixed" ? dateInputToIso(data.startDate, false) : null,
      publish_until:
        data.timeline === "fixed" ? dateInputToIso(data.endDate, true) : null,
      core_objective: objective,
      platforms: ["INSTAGRAM"],
      campaign_visibility: "PUBLIC",
    },
    targeting: {
      creator_archetypes: data.archetypes,
      minimum_followers: bounds.min,
      maximum_followers: bounds.max,
      audience_age_min: data.ageMin,
      audience_age_max: data.ageMax,
      audience_gender: GENDER_TO_CANONICAL[data.genderFocus] ?? "ALL",
      // Legacy production UI has no canonical affinity selector yet.
      audience_affinity_ids: [],
      // Preserve entered labels without pretending they are normalized Google Places objects.
      audience_geographies: data.targetLocations.map((label) => ({
        source: "LEGACY_LABEL",
        label,
      })),
    },
    commercials: {
      // Legacy production UI does not yet expose Brand-support provisioning fields.
      receives_brand_support: false,
      brand_support_type: null,
      brand_support_estimated_value: null,
      compensation_model: isFixed ? "FIXED" : "NEGOTIABLE",
      commercial_offer: isFixed ? data.flatRatePerCreator : data.negotiableMinFee,
      total_campaign_budget: data.budget,
      advance_payment_percentage: data.advancePercent as
        | 0
        | 25
        | 50
        | 75
        | 100,
      payout_terms: payoutTerms,
    },
  };

  return CanonicalCampaignWizardPayloadSchema.parse(payload);
}
