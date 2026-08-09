import { ChevronDown, Loader2, Lock, Receipt, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";

import { Alert, Button } from "../../../design-system/aurora";
import type { SubscriptionTier } from "../contracts/pricing.contracts";
import { usePricing } from "../hooks/use-pricing";
import "../pricing.css";
import { PricingCurrentPlanSummary } from "./pricing-current-plan-summary";
import { PricingFoundersPreview } from "./pricing-founders-preview";
import { PricingFoundersTrialStatus } from "./pricing-founders-trial-status";
import { PricingPlanComparison } from "./pricing-plan-comparison";
import {
  PricingAiDisclaimer,
  PricingBillingDetailsSection,
  PricingFeatureTeasers,
  PricingInvoiceSection,
  PricingRegulatoryDisclaimers,
} from "./pricing-support-sections";

export function PricingBillingPanel({
  hideBillingDetailsSection = false,
}: {
  hideBillingDetailsSection?: boolean;
}) {
  const {
    status,
    subscription,
    plans,
    errorMessage,
    actionLoading,
    geoContext,
    invoices,
    startLocalTrial,
    connectRazorpayBilling,
    upgradeTier,
    reactivatePlan,
  } = usePricing();

  const [planOpen, setPlanOpen] = useState(true);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);

  const isFrozen =
    subscription?.status === "HALTED" || subscription?.status === "CANCELED";
  const isPastDue = subscription?.status === "PAST_DUE";
  const showFoundersPreview = !subscription;
  const showFoundersTrialStatus =
    subscription?.status === "TRIALING" && subscription.tier === "FOUNDERS_BETA";
  const showPlanComparison =
    subscription &&
    (subscription.status === "ACTIVE" ||
      subscription.status === "TRIALING" ||
      subscription.status === "PAST_DUE" ||
      (recoveryOpen &&
        (subscription.status === "CANCELED" || subscription.status === "HALTED")));

  const handleStartTrial = async () => {
    await startLocalTrial(geoContext?.currency);
  };

  const handleConnectBilling = async () => {
    await connectRazorpayBilling(geoContext?.currency);
  };

  const handleUpgradeTier = async (tier: SubscriptionTier) => {
    await upgradeTier(tier);
  };

  const scrollToComparison = () => {
    comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleReactivate = async () => {
    const result = await reactivatePlan();
    setRecoveryOpen(true);
    scrollToComparison();
    if (result.recovery_mode === "update_payment" && result.payment_links?.length) {
      window.open(result.payment_links[0], "_blank", "noopener,noreferrer");
    }
  };

  if (status === "loading") {
    return (
      <div className="pricing-billing__loader" aria-busy="true">
        <Loader2 size={24} className="animate-spin" aria-hidden />
        Loading billing…
      </div>
    );
  }

  if (status === "error") {
    return (
      <Alert title="Could not load billing" tone="error">
        {errorMessage ?? "Please refresh and try again."}
      </Alert>
    );
  }

  return (
    <div className="pricing-billing">
      {errorMessage ? (
        <Alert title="Action failed" tone="warning">
          {errorMessage}
        </Alert>
      ) : null}

      {isPastDue ? (
        <div className="pricing-billing__past-due" role="alert">
          <div>
            <h2>⚠️ Subscription Past Due</h2>
            <p>
              Your payment failed. Access is locked in read-only mode. Update your card
              parameters within 7 days to restore automation paths.
            </p>
          </div>
          <Button
            disabled={actionLoading}
            onClick={() => void handleReactivate()}
          >
            <RefreshCw size={18} aria-hidden />
            Update Payment Details &amp; Retry Clearing
          </Button>
        </div>
      ) : null}

      {isFrozen ? (
        <div className="pricing-billing__frozen">
          <div className="pricing-billing__frozen-overlay">
            <Lock size={48} color="var(--color-danger)" aria-hidden />
            <h3>Workspace Automation Frozen</h3>
            <p className="pricing-billing__summary-meta" style={{ maxWidth: "24rem" }}>
              Access to campaign tools and automation paths is suspended. Reactivate your
              workspace ledger to restore full capabilities.
            </p>
            <Button
              style={{ marginTop: "var(--space-md)" }}
              disabled={actionLoading}
              onClick={() => void handleReactivate()}
            >
              <RefreshCw size={18} aria-hidden />
              Reactivate Workspace Ledger &amp; Select Plan
            </Button>
          </div>
          <div className="pricing-billing__frozen-content">
            <PricingCurrentPlanSummary subscription={subscription} showActions={false} />
          </div>
        </div>
      ) : (
        <section className="brand-settings__collapsible">
          <button
            type="button"
            className="brand-settings__collapsible-trigger"
            onClick={() => setPlanOpen((value) => !value)}
            aria-expanded={planOpen}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-card-standard)",
                  background: "var(--surface-workflow)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--color-primary)",
                  flexShrink: 0,
                }}
              >
                <Receipt size={24} aria-hidden />
              </div>
              <div>
                <h2 className="brand-settings__collapsible-title">
                  Current Plan{" "}
                  {subscription?.status === "TRIALING" ? (
                    <span className="brand-settings__badge brand-settings__badge--trial">
                      Trialing
                    </span>
                  ) : subscription?.status === "ACTIVE" ? (
                    <span className="brand-settings__badge">Active</span>
                  ) : null}
                </h2>
                <p className="brand-settings__collapsible-desc">
                  Manage your subscription and billing
                </p>
              </div>
            </div>
            <ChevronDown
              size={20}
              style={{
                transform: planOpen ? "rotate(180deg)" : undefined,
                transition: "transform 0.2s ease",
                flexShrink: 0,
              }}
              aria-hidden
            />
          </button>
          {planOpen ? (
            <div className="brand-settings__collapsible-body">
              <PricingCurrentPlanSummary
                subscription={subscription}
                onUpgrade={showPlanComparison ? scrollToComparison : undefined}
              />

              {subscription?.status === "TRIALING" && subscription.tier === "FOUNDERS_BETA" ? (
                <PricingRegulatoryDisclaimers />
              ) : null}
            </div>
          ) : null}
        </section>
      )}

      {!isFrozen && showFoundersTrialStatus && subscription ? (
        <PricingFoundersTrialStatus
          subscription={subscription}
          loading={actionLoading}
          onConnectBilling={
            subscription.razorpaySubscriptionId
              ? undefined
              : () => void handleConnectBilling()
          }
        />
      ) : null}

      {!isFrozen && showFoundersPreview ? (
        <PricingFoundersPreview
          loading={actionLoading}
          onStartTrial={() => void handleStartTrial()}
        />
      ) : null}

      {(!isFrozen || recoveryOpen) && showPlanComparison ? (
        <section ref={comparisonRef} className="brand-settings__collapsible">
          <div className="brand-settings__collapsible-body" style={{ padding: "var(--space-md)" }}>
            <h3
              style={{
                margin: "0 0 var(--space-md)",
                fontFamily: "var(--font-heading)",
                fontSize: "var(--size-h2)",
                fontWeight: 700,
              }}
            >
              {subscription?.tier === "FOUNDERS_BETA"
                ? "Upgrade paths"
                : "Workspace tiers"}
            </h3>
            <PricingPlanComparison
              subscription={subscription}
              plans={plans}
              loading={actionLoading}
              onChangeTier={(tier) => void handleUpgradeTier(tier)}
            />
          </div>
        </section>
      ) : null}

      {!isFrozen ? (
        <>
          {!hideBillingDetailsSection ? <PricingBillingDetailsSection /> : null}
          <PricingInvoiceSection invoices={invoices} />
          <PricingFeatureTeasers />
          <PricingAiDisclaimer />
        </>
      ) : null}
    </div>
  );
}
