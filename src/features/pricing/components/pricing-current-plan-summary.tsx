import { Receipt } from "lucide-react";

import { Button } from "../../../design-system/aurora";
import type { BrandSubscriptionRecord } from "../contracts/pricing.contracts";
import {
  formatCurrencyLabel,
  formatStatusLabel,
  formatTakeRateLabel,
  getBillingCycleLabel,
  getPostTrialLabel,
  getRenewalDate,
  getRenewalLabel,
  getStatusDescription,
  getTierDisplayName,
  getTrialDaysRemaining,
} from "../utils/format-pricing";

type PricingCurrentPlanSummaryProps = {
  subscription: BrandSubscriptionRecord | null;
  onUpgrade?: () => void;
  showActions?: boolean;
};

export function PricingCurrentPlanSummary({
  subscription,
  onUpgrade,
  showActions = true,
}: PricingCurrentPlanSummaryProps) {
  const trialDaysRemaining = getTrialDaysRemaining(subscription);

  return (
    <div className="pricing-billing__summary-grid">
      <div>
        <p className="pricing-billing__summary-label">Plan Type</p>
        <p className="pricing-billing__summary-value">
          Active Workspace Tier: {getTierDisplayName(subscription?.tier ?? null)}
        </p>
      </div>
      <div>
        <p className="pricing-billing__summary-label">Subscription Status</p>
        <p className="pricing-billing__summary-value">
          Status:{" "}
          <span className="pricing-billing__status-pill">
            {formatStatusLabel(subscription?.status ?? null)}
          </span>{" "}
          ({getStatusDescription(subscription?.status ?? null)})
        </p>
        <p className="pricing-billing__summary-meta">
          Billing Cycle Term: {getBillingCycleLabel(subscription)}
        </p>
      </div>
      <div>
        <p className="pricing-billing__summary-label">Financials</p>
        <p className="pricing-billing__summary-meta">
          Tracking Ledger Currency: {formatCurrencyLabel(subscription?.currency ?? null)}
        </p>
        <p className="pricing-billing__summary-value">
          {getRenewalLabel(subscription)}: {getRenewalDate(subscription)}
        </p>
        {trialDaysRemaining !== null ? (
          <p className="pricing-billing__summary-meta">
            {trialDaysRemaining === 0
              ? "Trial ends today"
              : `${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} left in preview`}
          </p>
        ) : null}
        <p className="pricing-billing__summary-meta" style={{ fontStyle: "italic" }}>
          {subscription?.status === "TRIALING" ? "After trial: " : "Billing: "}
          {getPostTrialLabel(subscription?.tier ?? null)}
        </p>
        <p className="pricing-billing__summary-meta">
          Escrow: {formatTakeRateLabel(subscription?.tier ?? null)}
        </p>
      </div>
      {showActions ? (
        <div className="pricing-billing__actions" style={{ gridColumn: "1 / -1" }}>
          <Button variant="outline" disabled>
            <Receipt size={18} aria-hidden />
            Download History
          </Button>
          {onUpgrade ? (
            <Button onClick={onUpgrade}>Upgrade Workspace</Button>
          ) : (
            <Button disabled>Upgrade Workspace</Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
