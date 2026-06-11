import { useCallback, useEffect, useState } from "react";

import {
  PricingApiError,
  bootstrapLocalTrial,
  cancelSubscription,
  changeSubscriptionTier,
  initializeRazorpayTrial,
  reactivateSubscription,
  restoreFoundersTrial,
  fetchBillingInvoices,
  fetchGeoContext,
  fetchSubscription,
  fetchUsageSnapshot,
  fetchVisiblePlans,
} from "../api/pricing-client";
import { TIER_DISPLAY_NAMES } from "../constants/pricing-copy";
import { openRazorpaySubscriptionCheckout } from "../utils/razorpay-subscription-checkout";
import type {
  BillingInvoiceRecord,
  BrandSubscriptionRecord,
  CatalogPlanView,
  GeoContext,
  SubscriptionCurrency,
  SubscriptionTier,
  UsageSnapshot,
} from "../contracts/pricing.contracts";

export type PricingLoadState = {
  status: "loading" | "ready" | "error";
  subscription: BrandSubscriptionRecord | null;
  plans: CatalogPlanView[];
  usage: UsageSnapshot | null;
  geoContext: GeoContext | null;
  invoices: BillingInvoiceRecord[];
  errorMessage: string | null;
  actionLoading: boolean;
};

export function usePricing() {
  const [state, setState] = useState<PricingLoadState>({
    status: "loading",
    subscription: null,
    plans: [],
    usage: null,
    geoContext: null,
    invoices: [],
    errorMessage: null,
    actionLoading: false,
  });

  const loadAll = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const [subscription, plans, usage, geoContext, invoices] = await Promise.all([
        fetchSubscription(),
        fetchVisiblePlans(),
        fetchUsageSnapshot(),
        fetchGeoContext(),
        fetchBillingInvoices(),
      ]);
      setState({
        status: "ready",
        subscription,
        plans,
        usage,
        geoContext,
        invoices,
        errorMessage: null,
        actionLoading: false,
      });
    } catch (error) {
      const message =
        error instanceof PricingApiError || error instanceof Error
          ? error.message
          : "Failed to load billing data.";
      setState((current) => ({
        ...current,
        status: "error",
        errorMessage: message,
      }));
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const runAction = useCallback(
    async (action: () => Promise<BrandSubscriptionRecord | void>) => {
      setState((current) => ({ ...current, actionLoading: true, errorMessage: null }));
      try {
        await action();
        await loadAll();
      } catch (error) {
        const message =
          error instanceof PricingApiError || error instanceof Error
            ? error.message
            : "Action failed. Please try again.";
        setState((current) => ({
          ...current,
          actionLoading: false,
          errorMessage: message,
        }));
        throw error;
      }
    },
    [loadAll],
  );

  const startLocalTrial = useCallback(
    async (currency?: SubscriptionCurrency) => {
      await runAction(() => bootstrapLocalTrial(currency));
    },
    [runAction],
  );

  const connectRazorpayBilling = useCallback(
    async (currency?: SubscriptionCurrency) => {
      await runAction(() => initializeRazorpayTrial(currency));
    },
    [runAction],
  );

  const upgradeTier = useCallback(
    async (targetTier: SubscriptionTier) => {
      setState((current) => ({ ...current, actionLoading: true, errorMessage: null }));
      try {
        const result = await changeSubscriptionTier(targetTier);
        if (result.checkout) {
          await new Promise<void>((resolve, reject) => {
            void openRazorpaySubscriptionCheckout({
              subscriptionId: result.checkout!.subscriptionId,
              razorpayKeyId: result.checkout!.razorpayKeyId,
              description: `Subscribe to ${TIER_DISPLAY_NAMES[result.checkout!.targetTier]}`,
              onSuccess: () => resolve(),
              onDismiss: () => {
                void restoreFoundersTrial()
                  .catch(() => undefined)
                  .finally(() => {
                    reject(
                      new Error(
                        "Checkout was closed before payment completed. Your Founder's trial is still active.",
                      ),
                    );
                  });
              },
            }).catch(reject);
          });
        }
        await loadAll();
      } catch (error) {
        const message =
          error instanceof PricingApiError || error instanceof Error
            ? error.message
            : "Upgrade failed. Please try again.";
        setState((current) => ({
          ...current,
          actionLoading: false,
          errorMessage: message,
        }));
        throw error;
      }
    },
    [loadAll],
  );

  const cancelPlan = useCallback(
    async (cancelAtCycleEnd = false) => {
      await runAction(() => cancelSubscription(cancelAtCycleEnd));
    },
    [runAction],
  );

  const reactivatePlan = useCallback(async () => {
    setState((current) => ({ ...current, actionLoading: true, errorMessage: null }));
    try {
      const result = await reactivateSubscription();
      await loadAll();
      return result;
    } catch (error) {
      const message =
        error instanceof PricingApiError || error instanceof Error
          ? error.message
          : "Reactivation failed. Please try again.";
      setState((current) => ({
        ...current,
        actionLoading: false,
        errorMessage: message,
      }));
      throw error;
    }
  }, [loadAll]);

  return {
    ...state,
    reload: loadAll,
    startLocalTrial,
    connectRazorpayBilling,
    upgradeTier,
    cancelPlan,
    reactivatePlan,
  };
}
