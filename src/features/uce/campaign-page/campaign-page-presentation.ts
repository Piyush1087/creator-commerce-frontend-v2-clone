import type { SelectableCampaignAsset } from "./types";

const TERMINAL_APPLICATION_STATUSES = new Set([
  "APPROVED",
  "REJECTED",
  "SUPERSEDED",
  "WITHDRAWN",
  "EXPIRED",
]);

export function isTerminalApplicationStatus(status?: string): boolean {
  return Boolean(status && TERMINAL_APPLICATION_STATUSES.has(status));
}

export function canonicalAssetKindLabel(
  asset: Pick<SelectableCampaignAsset, "kind" | "subtype">,
): string {
  return asset.kind === "OFFERING" && asset.subtype
    ? asset.subtype
    : asset.kind;
}
