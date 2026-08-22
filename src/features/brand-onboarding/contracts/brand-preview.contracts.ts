export const BRAND_PREVIEW_RUNTIME_STATES = [
  "ANALYSIS_ACTIVE",
  "PREVIEW_READY",
  "PREVIEW_FAILED_RECOVERABLE",
  "PREVIEW_NOT_READY",
] as const;

export type BrandPreviewRuntimeState = (typeof BRAND_PREVIEW_RUNTIME_STATES)[number];

export const BRAND_PREVIEW_PHASES = [
  "UNDERSTANDING_BRAND",
  "LEARNING_AUDIENCE",
  "FINDING_CREATOR_OPPORTUNITIES",
  "PREPARING_PREVIEW",
] as const;

export type BrandPreviewPhase = (typeof BRAND_PREVIEW_PHASES)[number];

export type BrandPreviewCompleteness = "NORMAL" | "PARTIAL";

export type BrandPreviewAudienceGroup = {
  id: string;
  label: string;
  whyItMatters: string;
};

export type BrandPreviewOpportunity = {
  title: string;
  whyItMatters: string;
};

export type BrandPreviewArchetype = {
  archetypeId: string;
  label: string;
  rationale: string;
};

export type BrandPreviewPayload = {
  identity: {
    brandName: string;
    brandLogo: string | null;
    websiteUrl: string;
    displayDomain: string;
    confirmedIndustry: "D2C" | "SAAS_AI" | "HEALTHCARE" | "OFFLINE_SERVICES";
    brandDescriptor: string | null;
  };
  understanding: {
    narrative: string;
  };
  audiences: BrandPreviewAudienceGroup[];
  opportunities: BrandPreviewOpportunity[];
  creatorStartingPoint: {
    archetypes: BrandPreviewArchetype[];
  };
};

export type BrandPreviewRuntimeProjection = {
  state: BrandPreviewRuntimeState;
  phase: BrandPreviewPhase | null;
  completeness: BrandPreviewCompleteness | null;
  canRetry: boolean;
  preview: BrandPreviewPayload | null;
  verificationContext: {
    brandProfileId: string;
  } | null;
};

export type BrandPreviewViewState =
  | {
      state: "FAST_ANALYSIS_ACTIVE";
      phase: BrandPreviewPhase | null;
    }
  | {
      state: "PREVIEW_READY";
      completeness: BrandPreviewCompleteness;
      preview: BrandPreviewPayload;
      brandProfileId: string;
    }
  | {
      state: "ANALYSIS_RECOVERABLE_FAILURE";
      canRetry: true;
    }
  | {
      state: "PREVIEW_NOT_READY";
      canRetry: boolean;
    };
