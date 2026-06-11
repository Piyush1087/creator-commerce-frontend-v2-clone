import { useCallback, useEffect, useState } from "react";

export type ApiJsonLoadState<T> =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

type ReloadOptions = {
  silent?: boolean;
};

export function useUceApiJson<T>(
  enabled: boolean,
  fetcher: () => Promise<T>,
): {
  state: ApiJsonLoadState<T>;
  reload: (options?: ReloadOptions) => Promise<void>;
} {
  const [state, setState] = useState<ApiJsonLoadState<T>>({ status: "idle" });

  const reload = useCallback(
    async (options?: ReloadOptions) => {
      const silent = options?.silent === true;
      if (!silent) {
        setState({ status: "loading" });
      }

      try {
        const data = await fetcher();
        setState({ status: "ready", data });
      } catch (err) {
        if (silent) {
          return;
        }
        setState({
          status: "error",
          message:
            err instanceof Error ? err.message : "Could not load API response.",
        });
      }
    },
    [fetcher],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void reload();
  }, [enabled, reload]);

  return { state, reload };
}
