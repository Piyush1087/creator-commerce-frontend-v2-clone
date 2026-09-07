import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "../../../design-system/aurora";
import { FOUNDERS_PREVIEW_FEATURES } from "../constants/pricing-copy";
import type { CatalogPlanView } from "../contracts/pricing.contracts";

type PricingFoundersPreviewProps = {
  founderPlan: CatalogPlanView | null;
  loading?: boolean;
  canStartTrial: boolean;
  onStartTrial: () => void;
};

export function PricingFoundersPreview({
  founderPlan,
  loading = false,
  canStartTrial,
  onStartTrial,
}: PricingFoundersPreviewProps) {
  return (
    <section className="pricing-billing__founders-card">
      <div className="pricing-billing__founders-card-body">
        <div style={{ textAlign: "center" }}>
          <span className="pricing-billing__founders-badge">FOUNDER&apos;S BETA</span>
          <h2>Start a 30-day trial</h2>
          <p className="pricing-billing__founders-price">Free for 30 days</p>
          <p className="pricing-billing__summary-meta">
            No payment method is required during the trial.
          </p>
          <p style={{ margin: "0.5rem 0 0", fontFamily: "var(--font-body)" }}>
            Then {founderPlan?.priceDescriptor ?? "$99/mo"} + 7% platform commission
            {founderPlan?.currency === "INR" && founderPlan.taxInclusive
              ? " · tax inclusive"
              : ""}
          </p>
        </div>

        <div className="pricing-billing__feature-grid">
          {Object.entries(FOUNDERS_PREVIEW_FEATURES).map(([group, features]) => (
            <div key={group} className="pricing-billing__feature-group">
              <h3>{group.replace(/([A-Z])/g, " $1")}</h3>
              <ul>
                {features.map((item) => (
                  <li key={item.label}>
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="pricing-billing__founders-footer">
        <p className="pricing-billing__summary-meta" style={{ margin: 0 }}>
          Billing profile completion is required only when converting to paid service.
        </p>
        <Button onClick={onStartTrial} disabled={loading || !canStartTrial}>
          {loading ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <ArrowRight size={18} aria-hidden />
          )}
          Start free trial
        </Button>
      </div>
    </section>
  );
}
