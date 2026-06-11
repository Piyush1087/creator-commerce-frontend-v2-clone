export type TimelineType = "fixed" | "milestone";

export type CompensationType = "fixed" | "negotiable";

export type WizardData = {
  name: string;
  objective: string;
  timeline: TimelineType;
  startDate: string;
  endDate: string;
  milestoneDays: string;
  platforms: {
    instagram: { enabled: boolean; formats: string[] };
    tiktok: { enabled: boolean; formats: string[] };
    youtube: { enabled: boolean; formats: string[] };
  };
  industry: string;
  followerTiers: string[];
  archetypes: string[];
  targetLocations: string[];
  disqualifyingKeywords: string[];
  ageMin: number;
  ageMax: number;
  genderFocus: string;
  compensationType: CompensationType;
  flatRatePerCreator: number;
  negotiableMinFee: number;
  negotiableMaxFee: number;
  budget: number;
  advancePercent: number;
  payoutTerms: string;
};

export type WizardFieldKey =
  | "name"
  | "objective"
  | "startDate"
  | "endDate"
  | "milestoneDays"
  | "platforms"
  | "industry"
  | "archetypes"
  | "followerTiers"
  | "targetLocations"
  | "ageMin"
  | "ageMax"
  | "genderFocus"
  | "disqualifyingKeywords"
  | "compensationType"
  | "flatRatePerCreator"
  | "negotiableMinFee"
  | "negotiableMaxFee"
  | "budget"
  | "advancePercent"
  | "payoutTerms"
  | "_form";

export type WizardFieldErrors = Partial<Record<WizardFieldKey, string>>;
