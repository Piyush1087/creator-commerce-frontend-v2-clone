import { useCallback, useEffect, useState } from "react";

import {
  disconnectCreatorSocial,
  fetchCreatorSocialIntegrations,
} from "../api/creator-settings-client";
import type {
  CreatorSocialListResponse,
  SocialPlatform,
} from "../contracts/creator-settings.contracts";

export function useCreatorSocialSettings() {
  const [data, setData] = useState<CreatorSocialListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCreatorSocialIntegrations();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load social channels.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const disconnect = useCallback(
    async (platform: SocialPlatform) => {
      setDisconnecting(true);
      setError(null);
      try {
        await disconnectCreatorSocial(platform);
        await reload();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to disconnect channel.";
        setError(message);
        throw err;
      } finally {
        setDisconnecting(false);
      }
    },
    [reload],
  );

  return { data, loading, error, disconnecting, reload, disconnect };
}
