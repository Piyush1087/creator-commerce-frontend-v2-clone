import { useCallback, useEffect, useState } from "react";

import { fetchBrandPayoutsHub } from "../api/brand-payouts-client";
import type { BrandPayoutsHubResponse } from "../contracts/brand-payouts.contracts";

export function useBrandPayoutsHub() {
  const [hub, setHub] = useState<BrandPayoutsHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadHub = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchBrandPayoutsHub();
      setHub(response);
    } catch (err) {
      setHub(null);
      setError(err instanceof Error ? err.message : "Failed to load payouts hub.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadHub();
  }, [reloadHub]);

  return { hub, loading, error, reloadHub };
}
