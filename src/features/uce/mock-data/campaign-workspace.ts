import type { CampaignProduct } from "./campaign-products";
import { getCampaignProduct, PRODUCT_CATALOG } from "./campaign-products";

export type CampaignBrief = {
  id: string;
  name: string;
  formatType: string;
};

export type LinkedCampaignProduct = {
  catalogProductId: string;
  isActive: boolean;
  briefs: CampaignBrief[];
};

export type CampaignWorkspace = {
  campaignId: string;
  products: LinkedCampaignProduct[];
};

export type EnrichedCampaignProduct = CampaignProduct & {
  isActive: boolean;
  briefs: CampaignBrief[];
};

const WORKSPACE_SEED: Record<string, CampaignWorkspace> = {
  "CAM-001": {
    campaignId: "CAM-001",
    products: [
      {
        catalogProductId: "hydration_boost_serum",
        isActive: true,
        briefs: [
          {
            id: "brief_summer_skin",
            name: "Summer Skin Routine",
            formatType: "Video Reel",
          },
        ],
      },
    ],
  },
  "CAM-002": {
    campaignId: "CAM-002",
    products: [],
  },
  "CAM-003": {
    campaignId: "CAM-003",
    products: [],
  },
};

export function getInitialCampaignWorkspace(campaignId: string): CampaignWorkspace {
  const seed = WORKSPACE_SEED[campaignId];
  if (seed) {
    return {
      campaignId,
      products: seed.products.map((p) => ({
        ...p,
        briefs: [...p.briefs],
      })),
    };
  }
  return { campaignId, products: [] };
}

export function enrichWorkspaceProducts(
  workspace: CampaignWorkspace,
): EnrichedCampaignProduct[] {
  return workspace.products
    .map((link) => {
      const product = getCampaignProduct(link.catalogProductId);
      if (!product) return null;
      return {
        ...product,
        briefCount: link.briefs.length,
        isActive: link.isActive,
        briefs: link.briefs,
      };
    })
    .filter((p): p is EnrichedCampaignProduct => p !== null);
}

export function countWorkspaceBriefs(workspace: CampaignWorkspace): number {
  return workspace.products.reduce((sum, p) => sum + p.briefs.length, 0);
}

export function getCatalogProductsNotInCampaign(
  workspace: CampaignWorkspace,
): CampaignProduct[] {
  const linked = new Set(workspace.products.map((p) => p.catalogProductId));
  return PRODUCT_CATALOG.filter((p) => !linked.has(p.id));
}

export function linkProductToCampaign(
  workspace: CampaignWorkspace,
  catalogProductId: string,
): CampaignWorkspace {
  if (workspace.products.some((p) => p.catalogProductId === catalogProductId)) {
    return workspace;
  }
  return {
    ...workspace,
    products: [
      ...workspace.products,
      { catalogProductId, isActive: true, briefs: [] },
    ],
  };
}

export function setProductActive(
  workspace: CampaignWorkspace,
  catalogProductId: string,
  isActive: boolean,
): CampaignWorkspace {
  return {
    ...workspace,
    products: workspace.products.map((p) =>
      p.catalogProductId === catalogProductId ? { ...p, isActive } : p,
    ),
  };
}

export function addBriefToProduct(
  workspace: CampaignWorkspace,
  catalogProductId: string,
  brief: Omit<CampaignBrief, "id">,
): CampaignWorkspace {
  return {
    ...workspace,
    products: workspace.products.map((p) => {
      if (p.catalogProductId !== catalogProductId) return p;
      return {
        ...p,
        briefs: [
          ...p.briefs,
          {
            ...brief,
            id: `brief_${Date.now()}`,
          },
        ],
      };
    }),
  };
}
