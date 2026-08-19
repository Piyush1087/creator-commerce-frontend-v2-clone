import {
  CanonicalCampaignStrategySchema,
  CanonicalCommercialPolicySchema,
  CanonicalCreatorStrategySchema,
  CanonicalCampaignWizardPayloadSchema,
} from "./canonical-campaign-wizard-schema";

/**
 * Compatibility exports for older imports. The production Create Campaign path is
 * now canonical; these names intentionally alias the Phase 1 schemas instead of
 * preserving the retired UCE field vocabulary.
 */
export const Step1StrategySchema = CanonicalCampaignStrategySchema;
export const Step2TargetingSchema = CanonicalCreatorStrategySchema;
export const Step3CommercialsSchema = CanonicalCommercialPolicySchema;
export const IntegratedCampaignWizardPayloadSchema = CanonicalCampaignWizardPayloadSchema;

export type Step1StrategyPayload = typeof Step1StrategySchema._output;
export type Step2TargetingPayload = typeof Step2TargetingSchema._output;
export type Step3CommercialsPayload = typeof Step3CommercialsSchema._output;
export type IntegratedCampaignWizardPayload = typeof IntegratedCampaignWizardPayloadSchema._output;
