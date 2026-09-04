import { CalendarDays, Shield } from "lucide-react";
import type { BrandSubscriptionRecord } from "../contracts/pricing.contracts";
import { FOUNDERS_PREVIEW_FEATURES } from "../constants/pricing-copy";
import {
  formatCommercialPrice,
  formatCommissionRate,
  getRenewalDate,
  getTrialDaysRemaining,
} from "../utils/format-pricing";

type PricingFoundersTrialStatusProps = {
  subscription: BrandSubscriptionRecord;
};

export function PricingFoundersTrialStatus({
  subscription,
}: PricingFoundersTrialStatusProps) {
  const daysRemaining = getTrialDaysRemaining(subscription);

  const featureHighlights: string[] = [
    FOUNDERS_PREVIEW_FEATURES.deepIntel[0]?.label ?? "",
    FOUNDERS_PREVIEW_FEATURES.strategic[0]?.label ?? "",
    FOUNDERS_PREVIEW_FEATURES.creatorOps[2]?.label ?? "",
  ].filter((item) => item.length > 0);

  return (
    <section className="pricing-billing__trial-active" aria-labelledby="founders-trial-heading">
      <div className="pricing-billing__trial-active-header">
        <span className="pricing-billing__founders-badge">
          <Shield size={14} aria-hidden />
          FOUNDER&apos;S BETA — ACTIVE PREVIEW
        </span>
        <h2 id="founders-trial-heading">Your 30-day preview is live</h2>
        <p className="brand-settings__collapsible-desc" style={{ margin: 0, maxWidth: "40rem" }}>
          You started on Founder&apos;s Beta during onboarding. Full platform access is enabled
          until your trial ends — no card required during the preview window.
        </p>
      </div>

      <div className="pricing-billing__trial-active-metrics">
        <div>
          <p className="pricing-billing__summary-label">Trial ends</p>
          <p className="pricing-billing__summary-value">
            <CalendarDays
              size={18}
              style={{ verticalAlign: "middle", marginRight: "0.35rem" }}
              aria-hidden
            />
            {getRenewalDate(subscription)}
          </p>
          {daysRemaining !== null ? (
            <p className="pricing-billing__summary-meta">
              {daysRemaining === 0
                ? "Ends today"
                : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`}
            </p>
          ) : null}
        </div>
        <div>
          <p className="pricing-billing__summary-label">After trial</p>
          <p className="pricing-billing__summary-value">
            {formatCommercialPrice(subscription)}
          </p>
          <p className="pricing-billing__summary-meta">{formatCommissionRate(subscription)}</p>
        </div>
      </div>

      <ul className="pricing-billing__trial-active-features">
        {featureHighlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <p className="pricing-billing__summary-meta" style={{ margin: 0 }}>
        No payment method or billing connection is required while the trial is active.
      </p>
    </section>
  );
}
