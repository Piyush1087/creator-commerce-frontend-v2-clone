export type CampaignProduct = {
  id: string;
  name: string;
  sku: string;
  basePrice: string;
  tagline: string;
  briefCount: number;
  usps: string[];
  shipping: string;
  stockStatus: string;
};

/** Brand catalogue SKUs that can be linked to any campaign workspace */
export const PRODUCT_CATALOG: CampaignProduct[] = [
  {
    id: "hydration_boost_serum",
    name: "Hydration Boost Serum",
    sku: "HBS-001",
    basePrice: "$45.00",
    tagline: "Triple-Hyaluronic Matrix • Vegan • Cruelty-free",
    briefCount: 1,
    usps: [
      "Triple-Hyaluronic Matrix for 24hr moisture retention.",
      "Vegan, cruelty-free, and paraben-free formulation.",
    ],
    shipping: "Next-day Priority",
    stockStatus: "In Stock / Active",
  },
  {
    id: "glow_serum_premium",
    name: "Glow Serum Premium V2",
    sku: "GSP-204",
    basePrice: "$62.00",
    tagline: "Vitamin C complex • Clinical-grade brightening",
    briefCount: 2,
    usps: [
      "Stabilized 15% Vitamin C for visible brightening in 14 days.",
      "Dermatologist-tested for sensitive skin profiles.",
    ],
    shipping: "Standard 2–3 day",
    stockStatus: "In Stock / Active",
  },
];

/** @deprecated Use PRODUCT_CATALOG */
export const CAMPAIGN_PRODUCTS = PRODUCT_CATALOG;

export function getCampaignProduct(id: string | null | undefined): CampaignProduct | undefined {
  if (!id) return undefined;
  return PRODUCT_CATALOG.find((p) => p.id === id);
}
