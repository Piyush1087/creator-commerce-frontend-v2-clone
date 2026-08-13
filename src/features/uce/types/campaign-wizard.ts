import type { CanonicalCampaignPayload } from "../contracts/brand-uce.contracts";

export type CanonicalGeography = CanonicalCampaignPayload["targeting"]["audience_geographies"][number];

/** Frontend authority for Create Campaign. Values intentionally mirror the canonical API. */
export type CreateCampaignFormState = {
  campaignName: string;
  coreObjective: CanonicalCampaignPayload["strategy"]["core_objective"] | "";
  publishingSchedule: CanonicalCampaignPayload["strategy"]["publishing_schedule"];
  publishFrom: string;
  publishUntil: string;
  platforms: CanonicalCampaignPayload["strategy"]["platforms"];
  platformFormats: string[];
  campaignVisibility: CanonicalCampaignPayload["strategy"]["campaign_visibility"];
  creatorArchetypes: string[];
  minimumFollowers: number;
  maximumFollowers: number | null;
  audienceAgeMin: number;
  audienceAgeMax: number;
  audienceGender: CanonicalCampaignPayload["targeting"]["audience_gender"];
  audienceAffinityIds: string[];
  audienceGeographies: CanonicalGeography[];
  receivesBrandSupport: boolean;
  brandSupportType: CanonicalCampaignPayload["commercials"]["brand_support_type"];
  brandSupportEstimatedValue: number | null;
  compensationModel: CanonicalCampaignPayload["commercials"]["compensation_model"];
  commercialOffer: number;
  totalCampaignBudget: number;
  advancePaymentPercentage: CanonicalCampaignPayload["commercials"]["advance_payment_percentage"];
  payoutTerms: CanonicalCampaignPayload["commercials"]["payout_terms"];
};

export type WizardData = CreateCampaignFormState;

export type WizardFieldKey =
  | "campaignName" | "coreObjective" | "publishingSchedule" | "publishFrom" | "publishUntil"
  | "platforms" | "campaignVisibility" | "creatorArchetypes" | "minimumFollowers"
  | "maximumFollowers" | "audienceAgeMin" | "audienceAgeMax" | "audienceGender"
  | "audienceAffinityIds" | "audienceGeographies"
  | "receivesBrandSupport" | "brandSupportType" | "brandSupportEstimatedValue"
  | "compensationModel" | "commercialOffer" | "totalCampaignBudget"
  | "advancePaymentPercentage" | "payoutTerms" | "_form";

export type WizardFieldErrors = Partial<Record<WizardFieldKey, string>>;
