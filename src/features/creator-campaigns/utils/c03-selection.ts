import type { Asset, AuthorizedOpportunity } from "../contracts/c03.contracts";
export type ApplyDraft = {
  assetId: string;
  briefId: string;
  review: boolean;
  uncertain?: boolean;
};
export function assetName(asset: Pick<Asset, "kind" | "offering" | "offer">) {
  return asset.kind === "BRAND"
    ? "Brand"
    : asset.kind === "OFFERING"
      ? (asset.offering?.name ?? "Offering")
      : (asset.offer?.offerName ?? "Offer");
}
export function selectablePairs(opportunity: AuthorizedOpportunity) {
  return opportunity.assets.flatMap((asset) =>
    asset.status === "ACTIVE"
      ? asset.briefs
          .filter(
            (brief) =>
              brief.campaignAssetId === asset.id &&
              brief.status === "PUBLISHED" &&
              brief.applicationSelection.state === "AVAILABLE",
          )
          .map((brief) => ({ asset, brief }))
      : [],
  );
}
