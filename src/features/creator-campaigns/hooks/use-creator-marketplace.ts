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
  const [state, setState] = useState<MarketplaceState>({
    campaigns: [],
    totalCount: 0,
    isSocialConnected: false,
    isGuest: mode === "guest",
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response =
        mode === "guest"
          ? await fetchPublicMarketplaceCampaigns(query)
          : await fetchMarketplaceCampaigns(query);
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
    query.search_query,
    query.brand_slug,
    query.show_match_eligible_only,
    query.niche,
    query.deliverable_type,
    query.target_geography,
    JSON.stringify(query.creator_tier),
    JSON.stringify(query.production_timeline),
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
