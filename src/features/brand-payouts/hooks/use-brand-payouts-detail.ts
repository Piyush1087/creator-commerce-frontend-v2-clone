import { useEffect, useState } from "react";

import {
  BrandPayoutsApiError,
  fetchBrandPayoutsActivityDetail,
  fetchBrandPayoutsBrandReturnDetail,
  fetchBrandPayoutsObligationDetail,
  isBrandPayoutsAuthorizationError,
} from "../api/brand-payouts-client";
import type {
  BrandPayoutsActivityDetailResponse,
  BrandPayoutsBrandReturnDetailResponse,
  BrandPayoutsObligationDetailResponse,
} from "../contracts/brand-payouts.contracts";

export type BrandPayoutsDetailTarget =
  | { readonly kind: "ACTIVITY"; readonly reference: string }
  | { readonly kind: "OBLIGATION"; readonly reference: string }
  | { readonly kind: "BRAND_RETURN"; readonly reference: string };

export function resolvePayoutsDetailTarget(
  search: string,
): BrandPayoutsDetailTarget | null | "INVALID" {
  const params = new URLSearchParams(search);
  const activity = params.get("activity");
  const obligation = params.get("obligation");
  const brandReturn = params.get("brand_return");
  if ([activity, obligation, brandReturn].filter(Boolean).length > 1) {
    return "INVALID";
  }
  const reference = activity ?? obligation ?? brandReturn;
  if (!reference) return null;
  if (reference.length > 512 || reference.trim().length === 0) return "INVALID";
  if (activity) return { kind: "ACTIVITY", reference };
  if (obligation) return { kind: "OBLIGATION", reference };
  return { kind: "BRAND_RETURN", reference };
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
    }
  | {
      readonly kind: "BRAND_RETURN";
      readonly status: "LOADING" | "READY" | "UNAVAILABLE" | "ACCESS_DENIED";
      readonly response: BrandPayoutsBrandReturnDetailResponse | null;
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
    } else if (target.kind === "OBLIGATION") {
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
    } else {
      void fetchBrandPayoutsBrandReturnDetail(
        target.reference,
        controller.signal,
      )
        .then((response) => {
          setState({
            kind: "BRAND_RETURN",
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
