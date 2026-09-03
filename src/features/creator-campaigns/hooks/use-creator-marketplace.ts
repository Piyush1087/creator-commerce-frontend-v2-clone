import { useCallback, useEffect, useState } from "react";

import {
  fetchMarketplaceCampaigns,
} from "../api/creator-campaigns-client";
import { fetchPublicMarketplaceCampaigns } from "../api/public-marketplace-client";
import type {
  MarketplaceCampaignRow,
  MarketplaceListQuery,
} from "../contracts/creator-campaigns.contracts";

type MarketplaceState = {
  campaigns: MarketplaceCampaignRow[];
  totalCount: number;
  isSocialConnected: boolean;
  isGuest: boolean;
  loading: boolean;
  error: string | null;
};

export function useCreatorMarketplace(
  query: MarketplaceListQuery,
  mode: "authenticated" | "guest" = "authenticated",
) {
  const {
    search_query,
    brand_slug,
    show_match_eligible_only,
    niche,
    deliverable_type,
    target_geography,
    creator_tier,
    production_timeline,
  } = query;
  const creatorTierKey = JSON.stringify(creator_tier);
  const productionTimelineKey = JSON.stringify(production_timeline);

  const [state, setState] = useState<MarketplaceState>({
    campaigns: [],
    totalCount: 0,
    isSocialConnected: false,
    isGuest: mode === "guest",
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    const requestQuery: MarketplaceListQuery = {
      search_query,
      brand_slug,
      show_match_eligible_only,
      niche,
      deliverable_type,
      target_geography,
      creator_tier:
        creatorTierKey === undefined
          ? undefined
          : (JSON.parse(creatorTierKey) as MarketplaceListQuery["creator_tier"]),
      production_timeline:
        productionTimelineKey === undefined
          ? undefined
          : (JSON.parse(productionTimelineKey) as MarketplaceListQuery["production_timeline"]),
    };

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response =
        mode === "guest"
          ? await fetchPublicMarketplaceCampaigns(requestQuery)
          : await fetchMarketplaceCampaigns(requestQuery);
      setState({
        campaigns: response.campaigns,
        totalCount: response.total_count,
        isSocialConnected: response.is_social_connected,
        isGuest: mode === "guest" || response.is_authenticated === false,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load marketplace.",
      }));
    }
  }, [
    mode,
    search_query,
    brand_slug,
    show_match_eligible_only,
    niche,
    deliverable_type,
    target_geography,
    creatorTierKey,
    productionTimelineKey,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
