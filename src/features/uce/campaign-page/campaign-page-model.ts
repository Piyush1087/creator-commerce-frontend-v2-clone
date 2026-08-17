import type {
  CampaignPageView,
  CampaignWorkspaceId,
  Capability,
  DiscoveryWorkspaceView,
  SurfaceState,
} from "./types";

export function isCapabilityEnabled(
  capability: Capability | undefined,
): boolean {
  return Boolean(
    capability?.available && capability.presentation === "ENABLED",
  );
}

export function canRenderCapability(
  capability: Capability | undefined,
): boolean {
  return Boolean(capability && capability.presentation !== "HIDDEN");
}

export function resolveInitialWorkspace(
  view: CampaignPageView,
): CampaignWorkspaceId {
  const visible = view.workspaces.filter((item) => item.visible);
  const focus = view.hydration.primaryFocus.toLowerCase();
  return (
    visible.find((item) => focus.includes(item.workspace))?.workspace ??
    visible[0]?.workspace ??
    "discovery"
  );
}

export function surfaceStateMessage(
  state: SurfaceState,
  subject: string,
): string | null {
  if (state === "UNAVAILABLE")
    return `${subject} is unavailable for this Campaign.`;
  if (state === "EMPTY") return `No ${subject.toLowerCase()} yet.`;
  if (state === "ERROR") return `${subject} could not be loaded.`;
  return null;
}

export function canLinkCanonicalAsset(view: CampaignPageView): boolean {
  return isCapabilityEnabled(view.assetsBriefsSummary.capability);
}

export function canCreateCanonicalBrief(view: CampaignPageView): boolean {
  return (
    isCapabilityEnabled(view.assetsBriefsSummary.capability) &&
    isCapabilityEnabled(view.campaign.capabilities.createBrief)
  );
}

export function canEditCanonicalBrief(view: CampaignPageView): boolean {
  return (
    isCapabilityEnabled(view.assetsBriefsSummary.capability) &&
    isCapabilityEnabled(view.campaign.capabilities.edit)
  );
}

export function discoveryCreatorContextLabel(
  discovery: DiscoveryWorkspaceView,
): string | null {
  return discovery.creators.length > 0
    ? "Saved Campaign creators — not current provider recommendations."
    : null;
}

export function canDismissCanonicalWrite(saving: boolean): boolean {
  return !saving;
}
