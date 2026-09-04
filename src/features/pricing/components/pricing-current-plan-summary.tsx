import type { BrandSubscriptionRecord } from "../contracts/pricing.contracts";
import {
  formatCommercialPrice,
  formatCommissionRate,
  formatCurrencyLabel,
  getBillingCycleLabel,
  getLifecyclePresentation,
  getRenewalDate,
  getRenewalLabel,
  getTierDisplayName,
  getTrialDaysRemaining,
} from "../utils/format-pricing";

export function PricingCurrentPlanSummary({
  subscription,
}: {
  subscription: BrandSubscriptionRecord;
}) {
  const presentation = getLifecyclePresentation(
    subscription.lifecycleStatus,
    subscription,
  );
  const trialDaysRemaining = getTrialDaysRemaining(subscription);

  return (
    <div className="pricing-billing__summary-grid">
      <div>
        <p className="pricing-billing__summary-label">Current plan</p>
        <p className="pricing-billing__summary-value">
          {getTierDisplayName(subscription.plan)}
        </p>
        <p className="pricing-billing__summary-meta">
          {formatCommercialPrice(subscription)} · {formatCommissionRate(subscription)}
        </p>
      </div>
      <div>
        <p className="pricing-billing__summary-label">Lifecycle</p>
        <p className="pricing-billing__summary-value">
          <span className="pricing-billing__status-pill">{presentation.label}</span>
        </p>
        <p className="pricing-billing__summary-meta">{presentation.description}</p>
      </div>
      <div>
        <p className="pricing-billing__summary-label">Billing</p>
        <p className="pricing-billing__summary-value">
          {getRenewalLabel(subscription)}: {getRenewalDate(subscription)}
        </p>
        <p className="pricing-billing__summary-meta">
          {getBillingCycleLabel(subscription)} · {formatCurrencyLabel(subscription.currency)}
        </p>
        {trialDaysRemaining !== null ? (
          <p className="pricing-billing__summary-meta">
            {trialDaysRemaining === 0
              ? "Trial ends today"
              : `${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} remaining`}
          </p>
        ) : null}
      </div>
      <div>
        <p className="pricing-billing__summary-label">Workspace access</p>
        <p className="pricing-billing__summary-value">
          {subscription.accessMode === "FULL_ACCESS" ? "Full access" : "Restricted wind-down"}
        </p>
        <p className="pricing-billing__summary-meta">
          Required action: {subscription.requiredAction.replace(/_/g, " ").toLowerCase()}
        </p>
      </div>
    </div>
  );
}
