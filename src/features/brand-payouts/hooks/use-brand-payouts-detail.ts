import { useEffect, useState } from "react";

import {
  BrandPayoutsApiError,
  fetchBrandPayoutsActivityDetail,
  fetchBrandPayoutsObligationDetail,
  isBrandPayoutsAuthorizationError,
} from "../api/brand-payouts-client";
import type {
  BrandPayoutsActivityDetailResponse,
  BrandPayoutsObligationDetailResponse,
} from "../contracts/brand-payouts.contracts";

export type BrandPayoutsDetailTarget =
  | { readonly kind: "ACTIVITY"; readonly reference: string }
  | { readonly kind: "OBLIGATION"; readonly reference: string };

export function resolvePayoutsDetailTarget(
  search: string,
): BrandPayoutsDetailTarget | null | "INVALID" {
  const params = new URLSearchParams(search);
  const activity = params.get("activity");
  const obligation = params.get("obligation");
  if (activity && obligation) return "INVALID";
  const reference = activity ?? obligation;
  if (!reference) return null;
  if (reference.length > 512 || reference.trim().length === 0) return "INVALID";
  return activity
    ? { kind: "ACTIVITY", reference }
    : { kind: "OBLIGATION", reference };
}

type DetailState =
  | {
      readonly kind: "ACTIVITY";
      readonly status: "LOADING" | "READY" | "UNAVAILABLE" | "ACCESS_DENIED";
      readonly response: BrandPayoutsActivityDetailResponse | null;
      readonly error: string | null;
    }
  | {
      readonly kind: "OBLIGATION";
      readonly status: "LOADING" | "READY" | "UNAVAILABLE" | "ACCESS_DENIED";
      readonly response: BrandPayoutsObligationDetailResponse | null;
      readonly error: string | null;
    };

export function useBrandPayoutsDetail(target: BrandPayoutsDetailTarget) {
  const [state, setState] = useState<DetailState>({
    kind: target.kind,
    status: "LOADING",
    response: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({
      kind: target.kind,
      status: "LOADING",
      response: null,
      error: null,
    });
    const reject = (error: unknown) => {
      if (controller.signal.aborted) return;
      if (isBrandPayoutsAuthorizationError(error)) {
        setState({
          kind: target.kind,
          status: "ACCESS_DENIED",
          response: null,
          error: null,
        });
        return;
      }
      setState({
        kind: target.kind,
        status: "UNAVAILABLE",
        response: null,
        error:
          error instanceof BrandPayoutsApiError
            ? error.message
            : "This financial detail is temporarily unavailable.",
      });
    };
    if (target.kind === "ACTIVITY") {
      void fetchBrandPayoutsActivityDetail(target.reference, controller.signal)
        .then((response) => {
          setState({
            kind: "ACTIVITY",
            status: "READY",
            response,
            error: null,
          });
        })
        .catch(reject);
    } else {
      void fetchBrandPayoutsObligationDetail(
        target.reference,
        controller.signal,
      )
        .then((response) => {
          setState({
            kind: "OBLIGATION",
            status: "READY",
            response,
            error: null,
          });
        })
        .catch(reject);
    }
    return () => controller.abort();
  }, [target.kind, target.reference]);

  return state;
}
