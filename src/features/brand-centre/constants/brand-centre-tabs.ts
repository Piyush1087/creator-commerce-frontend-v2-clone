export type BrandCentreTabId = "dna" | "intelligence" | "planner";

export type BrandCentreTabDefinition = {
  badge?: string;
  /** Shown in app header when this tab is active (e.g. Brand Centre > Brand DNA). */
  headerTitle: string;
  id: BrandCentreTabId;
  label: string;
};

export const BRAND_CENTRE_TABS: BrandCentreTabDefinition[] = [
  { id: "dna", label: "Brand DNA", headerTitle: "Brand DNA" },
  {
    id: "intelligence",
    label: "Intelligence & Gaps",
    headerTitle: "Intelligence & Gaps",
  },
  {
    id: "planner",
    label: "Campaign Planner",
    headerTitle: "Campaign Planner",
    badge: "3 Pending",
  },
];

export const DEFAULT_BRAND_CENTRE_TAB_ID: BrandCentreTabId = "dna";

export function getBrandCentreTabById(
  tabId: BrandCentreTabId,
): BrandCentreTabDefinition {
  return (
    BRAND_CENTRE_TABS.find((tab) => tab.id === tabId) ?? BRAND_CENTRE_TABS[0]
  );
}
