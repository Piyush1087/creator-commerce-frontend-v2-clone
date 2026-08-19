import type { CollaborationThreadRow } from "../contracts/collaboration.contracts";

function stringField(
  value: Record<string, unknown> | null,
  key: string,
): string | null {
  const field = value?.[key];
  return typeof field === "string" && field.trim() ? field.trim() : null;
}

export type CollaborationInboxIdentity = {
  title: string;
  handle: string | null;
  context: string;
};

export function collaborationInboxIdentity(
  row: CollaborationThreadRow,
): CollaborationInboxIdentity {
  const assetName = stringField(row.sourceContext.campaignAsset, "name");
  const assetType = stringField(row.sourceContext.campaignAsset, "type");
  const asset = [assetName, assetType].filter(Boolean).join(" · ");

  return {
    title: row.counterpart.displayName || "Collaboration",
    handle: row.counterpart.handle || null,
    context: [
      row.sourceContext.campaign.name,
      asset || null,
      row.sourceContext.brief.title,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}
