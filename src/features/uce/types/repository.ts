/** Campaign workspace repository view models (API-backed). */
export type RepositoryProduct = {
  id: string;
  name: string;
  skuCode: string;
  basePrice: string;
  inventoryCount: number;
  outOfStock: boolean;
};

export type RepositoryBrief = {
  id: string;
  name: string;
  formatType: string;
  formatTags: string[];
  platforms: string[];
  platformsLabel: string;
  creativeGuidelines: string;
  createdAt: string | null;
};
