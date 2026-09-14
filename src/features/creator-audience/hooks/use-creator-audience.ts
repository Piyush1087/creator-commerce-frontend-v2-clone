import { useCallback, useEffect, useRef, useState } from "react";

import { fetchCreatorAudience } from "../api/creator-audience-client";
import type { CreatorAudience } from "../contracts/creator-audience.schema";

export function useCreatorAudience() {
  const [data, setData] = useState<CreatorAudience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preservingLastGood, setPreservingLastGood] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setLoading(data === null);
    setError(null);
    try {
      const value = await fetchCreatorAudience(next.signal);
      setData(value);
      setPreservingLastGood(false);
    } catch (caught) {
      if (next.signal.aborted) return;
      setError(
        caught instanceof Error
          ? caught.message
          : "Audience could not be loaded.",
      );
      setPreservingLastGood(data !== null);
    } finally {
      if (!next.signal.aborted) setLoading(false);
    }
  }, [data]);
  useEffect(() => {
    void load();
    return () => controller.current?.abort();
    // Initial read only. Retry is explicit and never a provider refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { data, loading, error, preservingLastGood, retry: load };
}
