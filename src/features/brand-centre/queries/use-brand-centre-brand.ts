import { useEffect, useState, useSyncExternalStore } from "react";
import { createBrandWorkspaceCache } from "./brand-workspace-cache";
import { shouldPollProcessorRuntime } from "../adapters/brand-processor-runtime";

export function useBrandCentreBrand() {
  const [cache] = useState(createBrandWorkspaceCache);
  const state = useSyncExternalStore(
    cache.subscribe,
    cache.getSnapshot,
    cache.getSnapshot,
  );
  useEffect(() => {
    void cache.refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible") void cache.refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cache.cancel();
      window.removeEventListener("focus", onFocus);
    };
  }, [cache]);
  useEffect(() => {
    if (
      state.status === "REQUEST_LOADING" ||
      state.status === "BACKGROUND_LOADING"
    )
      return;
    if (!shouldPollProcessorRuntime(state.projection?.processorRuntime)) return;
    // Poll while any detailed processor reports activity that can progress unaided.
    const timer = window.setTimeout(() => {
      void cache.refresh();
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [cache, state]);
  return state;
}
