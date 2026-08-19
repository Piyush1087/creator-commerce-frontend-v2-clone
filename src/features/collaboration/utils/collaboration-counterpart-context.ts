import type { CollaborationDetailResponse } from "../contracts/collaboration.contracts";

export type CollaborationCounterpartMvpFields = {
  displayName: string;
  handle: string | null;
  campaignName: string | null;
  campaignAssetName: string | null;
  briefTitle: string | null;
};

function stringField(record: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * MVP counterpart context from already-hydrated detail/sourceContext only.
 * Omits unavailable optional fields; never fabricates history or debug copy.
 */
export function collaborationCounterpartMvpFields(
  detail: CollaborationDetailResponse,
  viewer: "BRAND" | "CREATOR",
): CollaborationCounterpartMvpFields {
  const counterpart = viewer === "BRAND" ? detail.identity.creator : detail.identity.brand;
  const asset = detail.sourceContext.campaignAsset;
  return {
    displayName: counterpart.displayName?.trim() || (viewer === "BRAND" ? "Creator" : "Brand"),
    handle:
      viewer === "BRAND" && counterpart.handle?.trim()
        ? counterpart.handle.trim().replace(/^@/, "")
        : null,
    campaignName: detail.sourceContext.campaign.name?.trim() || null,
    campaignAssetName: stringField(asset, "name") ?? stringField(asset, "productName"),
    briefTitle: detail.sourceContext.brief.title?.trim() || null,
  };
}
