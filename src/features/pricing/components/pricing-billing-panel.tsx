import { CalendarClock, ChevronDown, CircleAlert, Loader2, Receipt, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Alert, Button } from "../../../design-system/aurora";
import type { BillingRequiredField } from "../../settings/contracts/brand-settings.contracts";
import { usePricing } from "../hooks/use-pricing";
import { formatPricingDate, getLifecyclePresentation } from "../utils/format-pricing";
import "../pricing.css";
import { PricingCurrentPlanSummary } from "./pricing-current-plan-summary";
import { PricingFoundersPreview } from "./pricing-founders-preview";
import { PricingFoundersTrialStatus } from "./pricing-founders-trial-status";
import { PricingPlanComparison } from "./pricing-plan-comparison";
import { PricingInvoiceSection, PricingRegulatoryDisclaimers } from "./pricing-support-sections";

const BILLING_FIELD_LABELS: Record<BillingRequiredField, string> = {
  legal_entity_name: "legal entity name",
  legal_entity_type: "legal entity type",
  billing_country_code: "billing country",
  billing_address: "billing address",
};

export function PricingBillingPanel() {
  const {
    status,
    subscription,
    plans,
    errorMessage,
    missingRequiredFields,
    actionLoading,
    invoices,
    billingProfile,
    startLocalTrial,
    beginPaidConversion,
    cancelPlan,
    reactivatePlan,
  } = usePricing();
  const [planOpen, setPlanOpen] = useState(true);
  const [confirmCancellation, setConfirmCancellation] = useState(false);

  const founderPlan = plans.find((plan) => plan.tierKey === "FOUNDERS_BETA") ?? null;
  const canMutate = billingProfile ? !billingProfile.is_read_only : false;
  const billingComplete = billingProfile?.is_complete_for_paid_conversion ?? false;
  const missingBillingFields = (
    missingRequiredFields.length > 0
      ? missingRequiredFields
      : billingProfile?.missing_required_fields ?? []
  ).filter((field): field is BillingRequiredField => field in BILLING_FIELD_LABELS);
  const cancelledTrialCanBeRestored = Boolean(
    subscription?.lifecycleStatus === "CANCELLED" &&
      subscription.trialEndsAt &&
      new Date(subscription.trialEndsAt) > new Date(),
  );
  const conversionNeeded = Boolean(
    subscription &&
      (subscription.lifecycleStatus === "TRIAL_EXPIRED" ||
        subscription.lifecycleStatus === "HALTED" ||
        (subscription.lifecycleStatus === "CANCELLED" && !cancelledTrialCanBeRestored)),
  );
  const continuationNeedsBilling = subscription?.lifecycleStatus === "CANCEL_SCHEDULED";
  const showBillingGuidance =
    !billingComplete && (conversionNeeded || continuationNeedsBilling || missingBillingFields.length > 0);

  const scrollToBillingProfile = () => {
    document.getElementById("billing-profile")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleReactivate = async () => {
    try {
      const result = await reactivatePlan();
      if (result.recovery_mode === "update_payment" && result.payment_links?.[0]) {
        window.open(result.payment_links[0], "_blank", "noopener,noreferrer");
      }
    } catch {
      // The hook exposes the canonical backend error in the panel alert.
    }
  };

  const handlePaidConversion = async () => {
    if (!billingComplete) {
      scrollToBillingProfile();
      return;
    }
    try {
      await beginPaidConversion();
    } catch {
      // The hook exposes the canonical backend error in the panel alert.
    }
  };

  const handleCancel = async () => {
    try {
      await cancelPlan();
      setConfirmCancellation(false);
    } catch {
      // The hook exposes the canonical backend error in the panel alert.
    }
  };

  if (status === "loading") {
    return (
      <div className="pricing-billing__loader" aria-busy="true">
        <Loader2 size={24} className="animate-spin" aria-hidden />
        Loading subscription…
      </div>
    );
  }

  if (status === "error" && !subscription && plans.length === 0) {
    return (
      <Alert title="Could not load subscription" tone="error">
        {errorMessage ?? "Please refresh and try again."}
      </Alert>
    );
  }

  const presentation = subscription
    ? getLifecyclePresentation(subscription.lifecycleStatus, subscription)
    : null;

  return (
    <div className="pricing-billing">
      {errorMessage ? (
        <Alert title="Subscription action needs attention" tone="warning">
          {errorMessage}
        </Alert>
      ) : null}

      {showBillingGuidance ? (
        <div className="pricing-billing__readiness" role="alert">
          <CircleAlert size={21} aria-hidden />
          <div>
            <strong>Complete the billing profile before paid conversion.</strong>
            {missingBillingFields.length > 0 ? (
              <p>
                Missing: {missingBillingFields.map((field) => BILLING_FIELD_LABELS[field]).join(", ")}.
              </p>
            ) : null}
          </div>
          <Button variant="outline" onClick={scrollToBillingProfile}>
            Review billing profile
          </Button>
        </div>
      ) : null}

      {subscription && presentation ? (
        <section className="brand-settings__collapsible">
          <button
            type="button"
            className="brand-settings__collapsible-trigger"
            onClick={() => setPlanOpen((value) => !value)}
            aria-expanded={planOpen}
          >
            <div className="pricing-billing__section-heading">
              <span className="pricing-billing__section-icon"><Receipt size={24} aria-hidden /></span>
              <div>
                <h2 className="brand-settings__collapsible-title">{presentation.heading}</h2>
                <p className="brand-settings__collapsible-desc">
                  {subscription.accessMode === "FULL_ACCESS" ? "Full access" : "Restricted wind-down"}
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
              <PricingCurrentPlanSummary subscription={subscription} />

              {subscription.lifecycleStatus === "TRIALING" ? (
                <PricingFoundersTrialStatus subscription={subscription} />
              ) : null}

              {subscription.lifecycleStatus === "PAST_DUE" ? (
                <div className="pricing-billing__lifecycle-action pricing-billing__lifecycle-action--warning">
                  <div>
                    <strong>Update the payment method before the grace period ends.</strong>
                    <p>
                      Full access remains available through {formatPricingDate(subscription.paymentGraceEndsAt)}.
                    </p>
                  </div>
                  <Button disabled={actionLoading || !canMutate} onClick={() => void handleReactivate()}>
                    <RefreshCw size={18} aria-hidden />
                    Update payment method
                  </Button>
                </div>
              ) : null}

              {subscription.lifecycleStatus === "ACTIVE" ? (
                <div className="pricing-billing__lifecycle-action">
                  {confirmCancellation ? (
                    <>
                      <div>
                        <strong>Confirm period-end cancellation</strong>
                        <p>
                          Access remains active through {formatPricingDate(subscription.currentPeriodEnd)}.
                          Cancellation is scheduled only for the end of this paid period.
                        </p>
                      </div>
                      <div className="pricing-billing__action-row">
                        <Button variant="ghost" disabled={actionLoading} onClick={() => setConfirmCancellation(false)}>
                          Keep subscription
                        </Button>
                        <Button variant="outline" disabled={actionLoading || !canMutate} onClick={() => void handleCancel()}>
                          Confirm period-end cancellation
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <strong>Subscription controls</strong>
                        <p>Cancellation is available only at the end of the current paid period.</p>
                      </div>
                      <Button variant="outline" disabled={!canMutate} onClick={() => setConfirmCancellation(true)}>
                        Schedule cancellation
                      </Button>
                    </>
                  )}
                </div>
              ) : null}

              {subscription.lifecycleStatus === "CANCEL_SCHEDULED" ? (
                <div className="pricing-billing__lifecycle-action">
                  <div>
                    <strong>Full access continues until the effective date.</strong>
                    <p>
                      Continue Founder’s Beta from {formatPricingDate(subscription.cancelEffectiveAt)}
                      through the backend-supported continuation authorization.
                    </p>
                  </div>
                  <Button
                    disabled={actionLoading || !canMutate || !billingComplete}
                    onClick={() => void handleReactivate()}
                  >
                    <CalendarClock size={18} aria-hidden />
                    Continue subscription
                  </Button>
                </div>
              ) : null}

              {subscription.lifecycleStatus === "CANCELLED" && cancelledTrialCanBeRestored ? (
                <div className="pricing-billing__lifecycle-action">
                  <div>
                    <strong>Unused Founder’s Beta trial time is still available.</strong>
                    <p>Restore the remaining no-card trial window.</p>
                  </div>
                  <Button disabled={actionLoading || !canMutate} onClick={() => void handleReactivate()}>
                    Restore remaining trial
                  </Button>
                </div>
              ) : null}

              {conversionNeeded ? (
                <div className="pricing-billing__lifecycle-action pricing-billing__lifecycle-action--restricted">
                  <div>
                    <strong>Restore full access with Founder’s Beta.</strong>
                    <p>Paid conversion uses the canonical Founder’s Beta checkout.</p>
                  </div>
                  <Button
                    disabled={actionLoading || !canMutate || !billingComplete}
                    onClick={() => void handlePaidConversion()}
                  >
                    Start paid conversion
                  </Button>
                </div>
              ) : null}

              {!canMutate ? (
                <p className="settings-team__capacity-warning">
                  Campaign Managers have read-only subscription access. An Owner or Finance Admin
                  can perform billing actions.
                </p>
              ) : null}

              {subscription.lifecycleStatus === "TRIALING" ? <PricingRegulatoryDisclaimers /> : null}
            </div>
          ) : null}
        </section>
      ) : (
        <PricingFoundersPreview
          founderPlan={founderPlan}
          loading={actionLoading}
          canStartTrial={canMutate}
          onStartTrial={() => void startLocalTrial().catch(() => undefined)}
        />
      )}

      <section className="brand-settings__collapsible">
        <div className="brand-settings__collapsible-body">
          <h2 className="brand-settings__collapsible-title">Plan catalog</h2>
          <p className="brand-settings__collapsible-desc">
            Founder’s Beta is the only purchasable MVP plan. Future tiers are informational only.
          </p>
          <PricingPlanComparison plans={plans} />
        </div>
      </section>

      <PricingInvoiceSection invoices={invoices} />
    </div>
  );
}
