import { useCallback, useEffect, useRef, useState } from "react";

import {
  CreatorPayoutsApiError,
  fetchCreatorPayoutMethod,
  fetchCreatorPayoutsHistory,
  fetchCreatorPayoutsObligations,
  fetchCreatorPayoutsOverview,
  isCreatorPayoutsAuthorizationError,
} from "../api/creator-payouts-client";
import type {
  CreatorPayoutMethodResponse,
  CreatorPayoutsHistoryResponse,
  CreatorPayoutsObligations,
  CreatorPayoutsOverview,
} from "../contracts/creator-payouts.contracts";

export type CreatorPayoutResource<T> = {
  data: T | null;
  status: "INITIAL_LOADING" | "READY" | "REFRESHING" | "STALE" | "UNAVAILABLE";
  error: string | null;
};
const initial = <T>(): CreatorPayoutResource<T> => ({
  data: null,
  status: "INITIAL_LOADING",
  error: null,
});
const loading = <T>(
  state: CreatorPayoutResource<T>,
): CreatorPayoutResource<T> => ({
  ...state,
  status: state.data ? "REFRESHING" : "INITIAL_LOADING",
  error: null,
});
const failed = <T>(
  state: CreatorPayoutResource<T>,
  error: unknown,
): CreatorPayoutResource<T> => ({
  data: state.data,
  status: state.data ? "STALE" : "UNAVAILABLE",
  error:
    error instanceof CreatorPayoutsApiError
      ? error.message
      : "Payout information is temporarily unavailable.",
});

export function useCreatorPayouts() {
  const [overview, setOverview] =
    useState<CreatorPayoutResource<CreatorPayoutsOverview>>(initial);
  const [obligations, setObligations] =
    useState<CreatorPayoutResource<CreatorPayoutsObligations>>(initial);
  const [history, setHistory] =
    useState<CreatorPayoutResource<CreatorPayoutsHistoryResponse>>(initial);
  const [method, setMethod] =
    useState<CreatorPayoutResource<CreatorPayoutMethodResponse>>(initial);
  const [accessDenied, setAccessDenied] = useState(false);
  const generation = useRef(0);
  const active = useRef<AbortController | null>(null);
  const refresh = useCallback(() => {
    const current = ++generation.current;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setAccessDenied(false);
    setOverview(loading);
    setObligations(loading);
    setHistory(loading);
    setMethod(loading);
    const load = <T>(
      promise: Promise<T>,
      setter: React.Dispatch<React.SetStateAction<CreatorPayoutResource<T>>>,
    ) =>
      void promise
        .then((data) => {
          if (generation.current === current)
            setter({ data, status: "READY", error: null });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || generation.current !== current)
            return;
          if (isCreatorPayoutsAuthorizationError(error)) {
            setAccessDenied(true);
            setOverview(initial());
            setObligations(initial());
            setHistory(initial());
            setMethod(initial());
            return;
          }
          setter((state) => failed(state, error));
        });
    load(fetchCreatorPayoutsOverview(controller.signal), setOverview);
    load(
      fetchCreatorPayoutsObligations(undefined, controller.signal),
      setObligations,
    );
    load(fetchCreatorPayoutsHistory(undefined, controller.signal), setHistory);
    load(fetchCreatorPayoutMethod(controller.signal), setMethod);
  }, []);
  useEffect(() => {
    refresh();
    return () => active.current?.abort();
  }, [refresh]);
  return { overview, obligations, history, method, accessDenied, refresh };
}
