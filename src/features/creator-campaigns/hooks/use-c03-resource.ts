import { useCallback, useEffect, useRef, useState } from "react";
import type { CampaignScope } from "../api/c03-scope";
import { useCampaignScope } from "../components/CampaignAuthority";

export function useCampaignResource<T>(
  load: (scope: CampaignScope) => Promise<T>,
) {
  const scope = useCampaignScope();
  const generation = useRef(0);
  const [state, setState] = useState<{
    data: T | null;
    error: unknown;
    loading: boolean;
  }>({ data: null, error: null, loading: true });
  const refresh = useCallback(async () => {
    const ticket = ++generation.current;
    setState((previous) => ({ ...previous, error: null, loading: true }));
    try {
      const data = await load(scope);
      scope.assertCurrent();
      if (ticket === generation.current)
        setState({ data, error: null, loading: false });
    } catch (error) {
      if (!scope.signal.aborted && ticket === generation.current)
        setState({ data: null, error, loading: false });
    }
  }, [load, scope]);
  useEffect(() => {
    void refresh();
    return () => {
      generation.current++;
    };
  }, [refresh]);
  return { ...state, refresh };
}
