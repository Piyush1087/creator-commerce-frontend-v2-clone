export type CreatorCentreTabId = "home" | "analytics" | "media-kit";

export type CreatorCentreTab = {
  id: CreatorCentreTabId;
  label: string;
  headerTitle: string;
};

export const CREATOR_CENTRE_TABS: CreatorCentreTab[] = [
  { id: "home", label: "Command Center", headerTitle: "Command Center" },
  { id: "analytics", label: "Analytics", headerTitle: "Content Pulse" },
  { id: "media-kit", label: "Media Kit", headerTitle: "Live Media Kit" },
];

export function getCreatorCentreTabById(
  tabId: CreatorCentreTabId,
): CreatorCentreTab {
  return (
    CREATOR_CENTRE_TABS.find((tab) => tab.id === tabId) ?? CREATOR_CENTRE_TABS[0]
  );
}

export function parseCreatorCentreTabId(
  raw: string | null | undefined,
): CreatorCentreTabId {
  if (raw === "analytics" || raw === "media-kit" || raw === "home") {
    return raw;
  }
  return "home";
}

export function isCreatorCentrePath(pathname: string): boolean {
  return (
    pathname === "/creator/home" ||
    pathname === "/creator/dashboard" ||
    pathname === "/creator/analytics" ||
    pathname === "/creator/media-kit" ||
    pathname.startsWith("/creator/home/")
  );
}
