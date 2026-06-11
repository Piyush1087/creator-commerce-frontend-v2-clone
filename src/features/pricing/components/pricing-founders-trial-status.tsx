import { CalendarDays, Loader2, Shield } from "lucide-react";

import { Button } from "../../../design-system/aurora";
import type { BrandSubscriptionRecord } from "../contracts/pricing.contracts";
import { FOUNDERS_PREVIEW_FEATURES } from "../constants/pricing-copy";
import {
  formatTakeRateLabel,
  getPostTrialLabel,
  getRenewalDate,
  getTrialDaysRemaining,
} from "../utils/format-pricing";

type PricingFoundersTrialStatusProps = {
  subscription: BrandSubscriptionRecord;
  loading?: boolean;
  onConnectBilling?: () => void;
};

export function PricingFoundersTrialStatus({
  subscription,
  loading = false,
  onConnectBilling,
}: PricingFoundersTrialStatusProps) {
  const daysRemaining = getTrialDaysRemaining(subscription);
  const needsBillingLink = !subscription.razorpaySubscriptionId;

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
            {getPostTrialLabel(subscription.tier)}
          </p>
          <p className="pricing-billing__summary-meta">{formatTakeRateLabel(subscription.tier)}</p>
        </div>
      </div>

      <ul className="pricing-billing__trial-active-features">
        {featureHighlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {needsBillingLink && onConnectBilling ? (
        <div className="pricing-billing__trial-active-cta">
          <div style={{ maxWidth: "32rem" }}>
            <p className="pricing-billing__summary-meta" style={{ margin: 0 }}>
              Optional: connect billing before your trial ends to renew on Founder&apos;s Beta at
              your locked-in rate. You can upgrade to Growth Starter or Professional anytime below
              — those plans charge immediately via Razorpay.
            </p>
            <p className="pricing-billing__summary-meta" style={{ margin: "0.5rem 0 0" }}>
              We create the Razorpay subscription plan automatically on first connect. You only
              need valid test API keys in the backend.
            </p>
          </div>
          <Button disabled={loading} onClick={onConnectBilling}>
            {loading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
            Connect Billing for Renewal
          </Button>
        </div>
      ) : null}
    </section>
  );
}
