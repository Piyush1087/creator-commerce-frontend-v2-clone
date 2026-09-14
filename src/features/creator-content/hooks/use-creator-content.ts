import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCreatorContent } from "../api/creator-content-client";
import type { CreatorContent } from "../contracts/creator-content.schema";

export function useCreatorContent() {
  const [data, setData] = useState<CreatorContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preservingLastGood, setPreservingLastGood] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const dataRef = useRef<CreatorContent | null>(null);
  const load = useCallback(async () => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setLoading(dataRef.current === null);
    setError(null);
    try {
      const value = await fetchCreatorContent(next.signal);
      dataRef.current = value;
      setData(value);
      setPreservingLastGood(false);
    } catch (caught) {
      if (next.signal.aborted) return;
      setError(
        caught instanceof Error
          ? caught.message
          : "Content insights could not be loaded.",
      );
      setPreservingLastGood(dataRef.current !== null);
    } finally {
      if (!next.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    return () => controller.current?.abort();
  }, [load]);
  return { data, loading, error, preservingLastGood, retry: load };
}
