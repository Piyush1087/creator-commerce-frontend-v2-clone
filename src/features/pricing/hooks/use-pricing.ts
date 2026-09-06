import { useCallback, useEffect, useState } from "react";

import { fetchBrandBillingProfile } from "../../settings/api/brand-settings-client";
import type { BrandBillingProfileResponse } from "../../settings/contracts/brand-settings.contracts";
import {
  PricingApiError,
  bootstrapLocalTrial,
  cancelSubscription,
  fetchBillingInvoices,
  fetchGeoContext,
  fetchSubscription,
  fetchUsageSnapshot,
  fetchVisiblePlans,
  reactivateSubscription,
  startPaidConversion,
  type PricingCheckoutSession,
  type ReactivateSubscriptionResult,
} from "../api/pricing-client";
import type {
  BillingInvoiceRecord,
  BrandSubscriptionRecord,
  CatalogPlanView,
  GeoContext,
  UsageSnapshot,
} from "../contracts/pricing.contracts";
import { openRazorpaySubscriptionCheckout } from "../utils/razorpay-subscription-checkout";

export type PricingLoadState = {
  status: "loading" | "ready" | "error";
  subscription: BrandSubscriptionRecord | null;
  plans: CatalogPlanView[];
  usage: UsageSnapshot | null;
  geoContext: GeoContext | null;
  invoices: BillingInvoiceRecord[];
  billingProfile: BrandBillingProfileResponse | null;
  errorMessage: string | null;
  missingRequiredFields: string[];
  actionLoading: boolean;
};

const INITIAL_STATE: PricingLoadState = {
  status: "loading",
  subscription: null,
  plans: [],
  usage: null,
  geoContext: null,
  invoices: [],
  billingProfile: null,
  errorMessage: null,
  missingRequiredFields: [],
  actionLoading: false,
};

function errorDetails(error: unknown): { message: string; missingFields: string[] } {
  if (error instanceof PricingApiError) {
    return { message: error.message, missingFields: error.missingRequiredFields };
  }
  return {
    message: error instanceof Error ? error.message : "Action failed. Please try again.",
    missingFields: [],
  };
}

async function openCheckout(checkout: PricingCheckoutSession): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    void openRazorpaySubscriptionCheckout({
      subscriptionId: checkout.subscriptionId,
      razorpayKeyId: checkout.razorpayKeyId,
      description: "Founder’s Beta monthly subscription",
      onSuccess: () => resolve(),
      onDismiss: () => reject(new Error("Checkout was closed before payment completed.")),
    }).catch(reject);
  });
}

export function usePricing() {
  const [state, setState] = useState<PricingLoadState>(INITIAL_STATE);

  const loadAll = useCallback(async () => {
    setState((current) => ({
      ...current,
      status: "loading",
      errorMessage: null,
      missingRequiredFields: [],
    }));
    try {
      const [subscription, plans, usage, geoContext, invoices, billingProfile] =
        await Promise.all([
          fetchSubscription(),
          fetchVisiblePlans(),
          fetchUsageSnapshot(),
          fetchGeoContext(),
          fetchBillingInvoices(),
          fetchBrandBillingProfile(),
        ]);
      setState({
        status: "ready",
        subscription,
        plans,
        usage,
        geoContext,
        invoices,
        billingProfile,
        errorMessage: null,
        missingRequiredFields: [],
        actionLoading: false,
      });
    } catch (error) {
      const details = errorDetails(error);
      setState((current) => ({
        ...current,
        status: "error",
        actionLoading: false,
        errorMessage: details.message,
        missingRequiredFields: details.missingFields,
      }));
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const runAction = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      setState((current) => ({
        ...current,
        actionLoading: true,
        errorMessage: null,
        missingRequiredFields: [],
      }));
      try {
        const result = await action();
        await loadAll();
        return result;
      } catch (error) {
        const details = errorDetails(error);
        setState((current) => ({
          ...current,
          actionLoading: false,
          errorMessage: details.message,
          missingRequiredFields: details.missingFields,
        }));
        throw error;
      }
    },
    [loadAll],
  );

  const startLocalTrial = useCallback(async () => {
    await runAction(bootstrapLocalTrial);
  }, [runAction]);

  const beginPaidConversion = useCallback(async () => {
    await runAction(async () => {
      const result = await startPaidConversion();
      await openCheckout(result.checkout);
      return result.subscription;
    });
  }, [runAction]);

  const cancelPlan = useCallback(async () => {
    await runAction(cancelSubscription);
  }, [runAction]);

  const reactivatePlan = useCallback(async (): Promise<ReactivateSubscriptionResult> => {
    return runAction(async () => {
      const result = await reactivateSubscription();
      if (result.checkout) {
        await openCheckout(result.checkout);
      }
      return result;
    });
  }, [runAction]);

  return {
    ...state,
    reload: loadAll,
    startLocalTrial,
    beginPaidConversion,
    cancelPlan,
    reactivatePlan,
  };
}
