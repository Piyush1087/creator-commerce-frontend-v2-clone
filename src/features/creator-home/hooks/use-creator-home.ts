import { useCallback, useEffect, useRef, useState } from "react";

import { fetchCreatorHome } from "../api/creator-home-client";
import type { CreatorHomeResponse } from "../contracts/creator-home.schemas";

type State = {
  data: CreatorHomeResponse | null;
  loading: boolean;
  refreshing: boolean;
  stale: boolean;
  error: string | null;
};

export function useCreatorHome() {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    refreshing: false,
    stale: false,
    error: null,
  });
  const controller = useRef<AbortController | null>(null);
  const reload = useCallback(async (manual = false) => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setState((current) => ({
      ...current,
      loading: current.data === null,
      refreshing: manual && current.data !== null,
      error: null,
    }));
    try {
      const data = await fetchCreatorHome(next.signal);
      setState({
        data,
        loading: false,
        refreshing: false,
        stale: false,
        error: null,
      });
    } catch (error) {
      if (next.signal.aborted) return;
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        stale: current.data !== null,
        error:
          error instanceof Error
            ? error.message
            : "Creator Home could not be loaded.",
      }));
    }
  }, []);
  useEffect(() => {
    void reload();
    return () => controller.current?.abort();
  }, [reload]);
  return { ...state, reload: () => reload(true) };
}
