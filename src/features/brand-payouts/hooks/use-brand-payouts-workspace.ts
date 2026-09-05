import { useCallback, useEffect, useRef, useState } from "react";

import {
  BrandPayoutsApiError,
  fetchBrandPayoutsActivity,
  fetchBrandPayoutsObligations,
  fetchBrandPayoutsOverview,
  isBrandPayoutsAuthorizationError,
} from "../api/brand-payouts-client";
import type {
  BrandPayoutsActivityResponse,
  BrandPayoutsObligationsResponse,
  BrandPayoutsOverviewResponse,
  BrandPayoutsViewer,
} from "../contracts/brand-payouts.contracts";

export type PayoutsLoadStatus =
  | "INITIAL_LOADING"
  | "READY"
  | "REFRESHING"
  | "STALE"
  | "UNAVAILABLE";

export type PayoutsResourceState<T> = {
  readonly data: T | null;
  readonly status: PayoutsLoadStatus;
  readonly error: string | null;
};

const initialState = <T>(): PayoutsResourceState<T> => ({
  data: null,
  status: "INITIAL_LOADING",
  error: null,
});

function beginLoad<T>(state: PayoutsResourceState<T>): PayoutsResourceState<T> {
  return {
    ...state,
    status: state.data ? "REFRESHING" : "INITIAL_LOADING",
    error: null,
  };
}

function failLoad<T>(
  state: PayoutsResourceState<T>,
  error: unknown,
): PayoutsResourceState<T> {
  return {
    data: state.data,
    status: state.data ? "STALE" : "UNAVAILABLE",
    error:
      error instanceof BrandPayoutsApiError
        ? error.message
        : "Payouts data is temporarily unavailable.",
  };
}

function sameViewer(
  left: BrandPayoutsViewer,
  right: BrandPayoutsViewer,
): boolean {
  return (
    left.role === right.role && left.projection_scope === right.projection_scope
  );
}

export function mergeActivityPage(
  current: BrandPayoutsActivityResponse,
  next: BrandPayoutsActivityResponse,
): BrandPayoutsActivityResponse {
  if (
    current.as_of !== next.as_of ||
    !sameViewer(current.viewer, next.viewer)
  ) {
    throw new BrandPayoutsApiError(
      "CONTRACT",
      null,
      "BRAND_PAYOUTS_CURSOR_SNAPSHOT_MISMATCH",
      "The next activity page did not belong to the current snapshot.",
    );
  }
  const currentSection = current.sections[0];
  const nextSection = next.sections[0];
  return {
    ...next,
    sections: [
      {
        ...nextSection,
        payload: [
          ...(currentSection.payload ?? []),
          ...(nextSection.payload ?? []),
        ],
      },
    ],
  };
}

export function mergeObligationsPage(
  current: BrandPayoutsObligationsResponse,
  next: BrandPayoutsObligationsResponse,
): BrandPayoutsObligationsResponse {
  if (
    current.as_of !== next.as_of ||
    !sameViewer(current.viewer, next.viewer)
  ) {
    throw new BrandPayoutsApiError(
      "CONTRACT",
      null,
      "BRAND_PAYOUTS_CURSOR_SNAPSHOT_MISMATCH",
      "The next obligations page did not belong to the current snapshot.",
    );
  }
  const currentSection = current.sections[0];
  const nextSection = next.sections[0];
  return {
    ...next,
    sections: [
      {
        ...nextSection,
        payload: [
          ...(currentSection.payload ?? []),
          ...(nextSection.payload ?? []),
        ],
      },
    ],
  };
}

export function useBrandPayoutsWorkspace() {
  const [overview, setOverview] =
    useState<PayoutsResourceState<BrandPayoutsOverviewResponse>>(initialState);
  const [activity, setActivity] =
    useState<PayoutsResourceState<BrandPayoutsActivityResponse>>(initialState);
  const [obligations, setObligations] =
    useState<PayoutsResourceState<BrandPayoutsObligationsResponse>>(
      initialState,
    );
  const [accessDenied, setAccessDenied] = useState(false);
  const generation = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  const denyAccess = useCallback(() => {
    generation.current += 1;
    activeController.current?.abort();
    setAccessDenied(true);
    setOverview(initialState());
    setActivity(initialState());
    setObligations(initialState());
  }, []);

  const refresh = useCallback(() => {
    const requestGeneration = generation.current + 1;
    generation.current = requestGeneration;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    setAccessDenied(false);
    setOverview(beginLoad);
    setActivity(beginLoad);
    setObligations(beginLoad);

    void fetchBrandPayoutsOverview(controller.signal)
      .then((data) => {
        if (generation.current !== requestGeneration) return;
        setOverview({ data, status: "READY", error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (isBrandPayoutsAuthorizationError(error)) {
          denyAccess();
          return;
        }
        if (generation.current === requestGeneration) {
          setOverview((state) => failLoad(state, error));
        }
      });

    void fetchBrandPayoutsActivity({}, controller.signal)
      .then((data) => {
        if (generation.current !== requestGeneration) return;
        setActivity({ data, status: "READY", error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (isBrandPayoutsAuthorizationError(error)) {
          denyAccess();
          return;
        }
        if (generation.current === requestGeneration) {
          setActivity((state) => failLoad(state, error));
        }
      });

    void fetchBrandPayoutsObligations({}, controller.signal)
      .then((data) => {
        if (generation.current !== requestGeneration) return;
        setObligations({ data, status: "READY", error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (isBrandPayoutsAuthorizationError(error)) {
          denyAccess();
          return;
        }
        if (generation.current === requestGeneration) {
          setObligations((state) => failLoad(state, error));
        }
      });
  }, [denyAccess]);

  useEffect(() => {
    refresh();
    return () => activeController.current?.abort();
  }, [refresh]);

  const loadMoreActivity = useCallback(async () => {
    const current = activity.data;
    const cursor = current?.sections[0].page.next_cursor;
    if (!current || !cursor) return;
    const requestGeneration = generation.current;
    setActivity(beginLoad);
    try {
      const next = await fetchBrandPayoutsActivity({ cursor });
      if (generation.current !== requestGeneration) return;
      setActivity({
        data: mergeActivityPage(current, next),
        status: "READY",
        error: null,
      });
    } catch (error: unknown) {
      if (generation.current !== requestGeneration) return;
      if (isBrandPayoutsAuthorizationError(error)) {
        denyAccess();
        return;
      }
      setActivity((state) => failLoad(state, error));
    }
  }, [activity.data, denyAccess]);

  const loadMoreObligations = useCallback(async () => {
    const current = obligations.data;
    const cursor = current?.sections[0].page.next_cursor;
    if (!current || !cursor) return;
    const requestGeneration = generation.current;
    setObligations(beginLoad);
    try {
      const next = await fetchBrandPayoutsObligations({ cursor });
      if (generation.current !== requestGeneration) return;
      setObligations({
        data: mergeObligationsPage(current, next),
        status: "READY",
        error: null,
      });
    } catch (error: unknown) {
      if (generation.current !== requestGeneration) return;
      if (isBrandPayoutsAuthorizationError(error)) {
        denyAccess();
        return;
      }
      setObligations((state) => failLoad(state, error));
    }
  }, [denyAccess, obligations.data]);

  return {
    accessDenied,
    activity,
    loadMoreActivity,
    loadMoreObligations,
    obligations,
    overview,
    refresh,
  };
}
