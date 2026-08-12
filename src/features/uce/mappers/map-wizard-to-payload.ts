import type { WizardData } from "../types/campaign-wizard";
import type {
  IntegratedCampaignWizardPayload,
  Step1StrategyPayload,
  Step2TargetingPayload,
  Step3CommercialsPayload,
} from "../schemas/campaign-wizard-schema";
import { mapWizardToCanonicalPayload } from "./map-wizard-to-canonical-payload";

/** @deprecated Use mapWizardToCanonicalPayload. */
export function mapWizardToStep1Payload(data: WizardData): Step1StrategyPayload {
  return mapWizardToCanonicalPayload(data).strategy;
}

/** @deprecated Use mapWizardToCanonicalPayload. */
export function mapWizardToStep2Payload(data: WizardData): Step2TargetingPayload {
  return mapWizardToCanonicalPayload(data).targeting;
}

/** @deprecated Use mapWizardToCanonicalPayload. */
export function mapWizardToStep3Payload(data: WizardData): Step3CommercialsPayload {
  return mapWizardToCanonicalPayload(data).commercials;
}

/** @deprecated Use mapWizardToCanonicalPayload. */
export function mapWizardToIntegratedPayload(data: WizardData): IntegratedCampaignWizardPayload {
  return mapWizardToCanonicalPayload(data);
}
