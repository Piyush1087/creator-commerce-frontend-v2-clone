import type { WizardData } from "../types/campaign-wizard";
import type { CanonicalCampaignWizardPayload } from "../schemas/canonical-campaign-wizard-schema";
import { mapWizardToCanonicalPayload } from "./map-wizard-to-canonical-payload";

/**
 * Production Create Campaign keeps the mature wizard presentation, but the API
 * boundary now emits the canonical Phase 1 Campaign field object. Legacy UCE
 * field names are no longer authoritative at the frontend boundary.
 */
export function mapWizardToIntegratedPayload(
  data: WizardData,
): CanonicalCampaignWizardPayload {
  return mapWizardToCanonicalPayload(data);
}
