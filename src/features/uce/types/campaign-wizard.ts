export type PublishingSchedule = "EVERGREEN" | "SCHEDULED";
export type CampaignObjective = "PULSE" | "PROOF" | "PRODUCTION" | "PUSH";
export type CampaignVisibility = "PUBLIC" | "ELIGIBLE_CREATORS_ONLY" | "INVITE_ONLY";
export type AudienceGender = "ALL" | "FEMALE" | "MALE";
export type CompensationModel = "FIXED" | "NEGOTIABLE";
export type BrandSupportType =
  | "PRODUCT"
  | "SERVICE"
  | "EXPERIENCE"
  | "ACCESS_SUBSCRIPTION"
  | "OTHER";
export type AdvancePaymentPercentage = 0 | 25 | 50 | 75 | 100;
export type PayoutTerms = "NET_7" | "NET_15" | "NET_30" | "NET_45" | "NET_60";

/**
 * Campaign audience geography aligned to the frozen Brand Intelligence market-geography object.
 * CITY input is normalized to LOCALITY; multiple records represent multi-location targeting.
 */
export type CampaignAudienceGeography = {
  scope: "LOCALITY" | "REGION" | "COUNTRY" | "GLOBAL";
  label: string;
  country_code: string | null;
  locality: string | null;
  region: string | null;
  radius_km: number | null;
  is_primary: boolean;
};

export type WizardData = {
  name: string;
  objective: CampaignObjective | "";
  publishingSchedule: PublishingSchedule;
  publishFrom: string;
  publishUntil: string;
  visibility: CampaignVisibility;
  archetypes: string[];
  minimumFollowers: number;
  maximumFollowers: number | null;
  audienceAgeMin: number;
  audienceAgeMax: number;
  audienceGender: AudienceGender;
  affinityIds: string[];
  audienceGeographies: CampaignAudienceGeography[];
  receivesBrandSupport: boolean;
  brandSupportType: BrandSupportType | null;
  brandSupportEstimatedValue: number | null;
  compensationModel: CompensationModel;
  commercialOffer: number;
  totalCampaignBudget: number;
  advancePaymentPercentage: AdvancePaymentPercentage;
  payoutTerms: PayoutTerms;
};

export type WizardFieldKey =
  | "name"
  | "objective"
  | "publishingSchedule"
  | "publishFrom"
  | "publishUntil"
  | "visibility"
  | "archetypes"
  | "minimumFollowers"
  | "maximumFollowers"
  | "audienceAgeMin"
  | "audienceAgeMax"
  | "audienceGender"
  | "affinityIds"
  | "audienceGeographies"
  | "receivesBrandSupport"
  | "brandSupportType"
  | "brandSupportEstimatedValue"
  | "compensationModel"
  | "commercialOffer"
  | "totalCampaignBudget"
  | "advancePaymentPercentage"
  | "payoutTerms"
  | "_form";

export type WizardFieldErrors = Partial<Record<WizardFieldKey, string>>;
