import { useCallback, useEffect, useState } from "react";

import { fetchCreatorPayoutsHub } from "../api/creator-payouts-client";
import type { CreatorPayoutsHubResponse } from "../contracts/creator-payouts.contracts";

export function useCreatorPayouts() {
  const [data, setData] = useState<CreatorPayoutsHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCreatorPayoutsHub();
      setData(response);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load payouts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
