import { useCallback, useEffect, useState } from "react";

import {
  fetchMarketplaceCampaignDetail,
} from "../api/creator-campaigns-client";
import { fetchPublicMarketplaceCampaignDetail } from "../api/public-marketplace-client";
import type { MarketplaceDetailResponse } from "../contracts/creator-campaigns.contracts";

export function useCreatorCampaignDetail(
  campaignId: string | undefined,
  options?: { inviteToken?: string; mode?: "authenticated" | "guest" },
) {
  const mode = options?.mode ?? "authenticated";
  const inviteToken = options?.inviteToken;

  const [detail, setDetail] = useState<MarketplaceDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!campaignId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response =
        mode === "guest"
          ? await fetchPublicMarketplaceCampaignDetail(campaignId, inviteToken)
          : await fetchMarketplaceCampaignDetail(campaignId, inviteToken);
      setDetail(response);
    } catch (err) {
      setDetail(null);
      setError(err instanceof Error ? err.message : "Failed to load campaign.");
    } finally {
      setLoading(false);
    }
  }, [campaignId, inviteToken, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  return { detail, loading, error, reload: load };
}
