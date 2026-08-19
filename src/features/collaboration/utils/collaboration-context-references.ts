import type { CollaborationDetailResponse } from "../contracts/collaboration.contracts";

export type CollaborationCanonicalContextReferences = {
  campaignId: string | null;
  campaignAssetId: string | null;
  briefId: string | null;
};

/**
 * Returns only identifiers whose canonical lineage is explicit in the accepted
 * Collaboration projection. Compatibility records never acquire canonical
 * links by inference.
 */
export function collaborationCanonicalContextReferences(
  detail: CollaborationDetailResponse,
): CollaborationCanonicalContextReferences {
  if (detail.projectionSource !== "CANONICAL" || detail.legacyCompatibility) {
    return { campaignId: null, campaignAssetId: null, briefId: null };
  }

  const campaignId = detail.identity.campaignId.trim();
  if (!campaignId || detail.sourceContext.campaign.id !== campaignId) {
    return { campaignId: null, campaignAssetId: null, briefId: null };
  }

  const campaignAssetId = detail.identity.campaignAssetId?.trim() || null;
  const briefId =
    campaignAssetId &&
    detail.identity.briefId.trim() &&
    detail.sourceContext.brief.id === detail.identity.briefId
      ? detail.identity.briefId
      : null;

  return { campaignId, campaignAssetId, briefId };
}
