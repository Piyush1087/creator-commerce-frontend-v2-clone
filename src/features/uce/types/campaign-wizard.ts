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
  geographyLabels: string[];
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
  | "geographyLabels"
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
