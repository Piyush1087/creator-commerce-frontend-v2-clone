import type {
  BrandHomeItem,
  BrandHomeResponse,
} from "../contracts/brand-home.schemas";

export const BRAND_HOME_TEST_IDS = {
  brand: "brand-test",
  item: "home-item-test",
  offering: "offering-test",
  campaign: "campaign-test",
  collaboration: "collaboration-test",
} as const;

export function brandHomeItemFixture(
  overrides: Partial<BrandHomeItem> = {},
): BrandHomeItem {
  return {
    id: BRAND_HOME_TEST_IDS.item,
    kind: "WORKSPACE_SETUP",
    reasonCode: "WORKSPACE_SETUP_REQUIRED",
    priorityTier: "MATERIAL_SETUP_CAPABILITY_BLOCKER",
    title: "Complete your Brand setup",
    summary: "Creator Shop needs one more grounded Brand detail.",
    entityRefs: [{ type: "BRAND", id: BRAND_HOME_TEST_IDS.brand }],
    navigation: {
      destinationId: "BRAND_CENTRE",
      entityRef: { type: "BRAND", id: BRAND_HOME_TEST_IDS.brand },
    },
    freshness: {
      state: "CURRENT",
      observedAt: "2026-09-03T09:00:00.000Z",
      changedAt: "2026-09-03T08:30:00.000Z",
      dueAt: null,
    },
    sourceDomains: ["BRAND", "WORKSPACE_READINESS"],
    limitations: [],
    recommendation: {
      text: "Review the missing Brand detail.",
      basisRefs: ["workspace-readiness"],
      nonMutating: true,
    },
    ...overrides,
  };
}

export function brandHomeResponseFixture(
  overrides: Partial<BrandHomeResponse> = {},
): BrandHomeResponse {
  return {
    contractVersion: "1.0",
    generatedAt: "2026-09-03T09:05:00.000Z",
    status: "READY",
    brand: {
      id: BRAND_HOME_TEST_IDS.brand,
      displayName: "Northstar",
    },
    sections: [
      {
        id: "NEEDS_ATTENTION",
        state: "READY",
        items: [brandHomeItemFixture()],
      },
      { id: "CREATOR_SHOP_HAS_LEARNED", state: "EMPTY", items: [] },
      { id: "OPPORTUNITIES_NEXT_ACTIONS", state: "EMPTY", items: [] },
      { id: "CURRENT_MOMENTUM", state: "EMPTY", items: [] },
    ],
    sourceStates: [
      {
        sourceDomain: "BRAND",
        state: "READY",
        freshness: "CURRENT",
        observedAt: "2026-09-03T09:00:00.000Z",
        truncated: false,
        limitations: [],
      },
    ],
    truncated: false,
    limitations: [],
    ...overrides,
  };
}
