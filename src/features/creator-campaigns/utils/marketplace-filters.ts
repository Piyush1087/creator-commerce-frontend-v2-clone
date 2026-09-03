import type { MarketplaceListQuery } from "../contracts/creator-campaigns.contracts";

export type MarketplaceFiltersState = {
  niche: string;
  deliverable_type: string;
  creator_tier: string[];
  target_geography: string;
  production_timeline: string[];
};

export const EMPTY_MARKETPLACE_FILTERS: MarketplaceFiltersState = {
  niche: "",
  deliverable_type: "",
  creator_tier: [],
  target_geography: "",
  production_timeline: [],
};

export function marketplaceFiltersToQuery(
  filters: MarketplaceFiltersState,
): Pick<
  MarketplaceListQuery,
  "niche" | "deliverable_type" | "creator_tier" | "target_geography" | "production_timeline"
> {
  return {
    niche: filters.niche.trim() || undefined,
    deliverable_type: filters.deliverable_type || undefined,
    creator_tier: filters.creator_tier.length > 0 ? filters.creator_tier : undefined,
    target_geography: filters.target_geography.trim() || undefined,
    production_timeline:
      filters.production_timeline.length > 0 ? filters.production_timeline : undefined,
  };
}

export function countActiveFilters(filters: MarketplaceFiltersState): number {
  let count = 0;
  if (filters.niche.trim()) count += 1;
  if (filters.deliverable_type) count += 1;
  if (filters.creator_tier.length > 0) count += 1;
  if (filters.target_geography.trim()) count += 1;
  if (filters.production_timeline.length > 0) count += 1;
  return count;
}
