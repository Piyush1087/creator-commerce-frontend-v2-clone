/** Campaign workspace repository view models (API-backed). */
export type RepositoryProduct = {
  id: string;
  name: string;
  skuCode: string | null;
  assetType?: string;
  basePrice: string;
  inventoryCount: number;
  outOfStock: boolean;
};

export type RepositoryBrief = {
  id: string;
  productId?: string | null;
  name: string;
  formatType: string;
  formatTags: string[];
  platforms: string[];
  platformsLabel: string;
  creativeGuidelines: string;
  briefType?: string | null;
  createdAt: string | null;
};
