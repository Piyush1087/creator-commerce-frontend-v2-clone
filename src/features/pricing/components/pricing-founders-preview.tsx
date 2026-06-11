import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "../../../design-system/aurora";
import {
  FOUNDERS_PREVIEW_FEATURES,
  UPCOMING_PLANS,
} from "../constants/pricing-copy";

type PricingFoundersPreviewProps = {
  loading?: boolean;
  onStartTrial: () => void;
  showEvolutionPath?: boolean;
};

export function PricingFoundersPreview({
  loading = false,
  onStartTrial,
  showEvolutionPath = true,
}: PricingFoundersPreviewProps) {
  return (
    <div>
      <div className="pricing-billing__founders-hero">
        <h2>Start your 30-day Founder&apos;s Preview</h2>
        <p className="brand-settings__collapsible-desc" style={{ maxWidth: "36rem", margin: "0 auto" }}>
          You&apos;re in the first 500 brands. Lock in $99/mo pricing forever and help us build
          the future of AI-led creator strategy.
        </p>
        <p className="pricing-billing__summary-meta" style={{ marginTop: "0.5rem" }}>
          No Credit Card Required • Instant Access
        </p>
      </div>

      <div className="pricing-billing__founders-card">
        <div className="pricing-billing__founders-card-body">
          <div style={{ textAlign: "center" }}>
            <span className="pricing-billing__founders-badge">🛡️ FOUNDING MEMBER ACCESS</span>
            <h3
              style={{
                margin: "0 0 0.5rem",
                fontFamily: "var(--font-heading)",
                fontSize: "var(--size-h2)",
                fontWeight: 700,
              }}
            >
              Founder&apos;s Beta
            </h3>
            <p className="pricing-billing__founders-price">$0</p>
            <p style={{ margin: "0.5rem 0 0", fontFamily: "var(--font-body)" }}>
              Then $99/mo + 7% Collaboration Fee
            </p>
            <p
              style={{
                margin: "1rem auto 0",
                maxWidth: "24rem",
                fontStyle: "italic",
                color: "var(--text-muted)",
                fontSize: "var(--size-body)",
              }}
            >
              &quot;Lock in foundational platform access rates forever before the public tier
              catalog expansion rollout.&quot;
            </p>
          </div>

          <div className="pricing-billing__feature-grid">
            <div className="pricing-billing__feature-group">
              <h4>Deep Intel Engine</h4>
              <ul>
                {FOUNDERS_PREVIEW_FEATURES.deepIntel.map((item) => (
                  <li key={item.label}>
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pricing-billing__feature-group">
              <h4>Strategic Execution</h4>
              <ul>
                {FOUNDERS_PREVIEW_FEATURES.strategic.map((item) => (
                  <li key={item.label}>
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pricing-billing__feature-group">
              <h4>Creator Operations</h4>
              <ul>
                {FOUNDERS_PREVIEW_FEATURES.creatorOps.map((item) => (
                  <li key={item.label}>
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pricing-billing__founders-footer">
          <span className="pricing-billing__summary-meta" style={{ textDecoration: "underline" }}>
            I&apos;ll do this later, take me to the limited dashboard.
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-md)" }}>
            <p className="pricing-billing__summary-meta" style={{ maxWidth: "18rem", margin: 0 }}>
              No credit card required to start. Your 30-day Founder&apos;s Preview is completely
              free. We&apos;ll notify you 5 days before your trial ends.
            </p>
            <Button onClick={onStartTrial} disabled={loading}>
              {loading ? (
                <Loader2 size={18} className="animate-spin" aria-hidden />
              ) : (
                <ArrowRight size={18} aria-hidden />
              )}
              Start My Free Trial
            </Button>
          </div>
        </div>
      </div>

      {showEvolutionPath ? (
        <div className="pricing-billing__upcoming">
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                margin: "0 0 0.25rem",
                fontFamily: "var(--font-heading)",
                fontSize: "var(--size-h2)",
                fontWeight: 700,
              }}
            >
              The Evolution Path
            </h3>
            <p className="pricing-billing__summary-meta">
              As we exit Beta, you&apos;ll be first in line for these upgrades.
            </p>
          </div>
          {UPCOMING_PLANS.map((plan) => (
            <div key={plan.name} className="pricing-billing__upcoming-card">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <strong style={{ fontFamily: "var(--font-heading)" }}>{plan.name}</strong>
                  {"badge" in plan && plan.badge ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "0.125rem 0.5rem",
                        borderRadius: "var(--radius-pill)",
                        background: "color-mix(in srgb, #f59e0b 12%, transparent)",
                        color: "#b45309",
                      }}
                    >
                      {plan.badge}
                    </span>
                  ) : null}
                </div>
                <p className="pricing-billing__summary-meta" style={{ margin: "0.25rem 0 0" }}>
                  {plan.description}
                </p>
              </div>
              <strong style={{ fontFamily: "var(--font-heading)", fontSize: "var(--size-h2)" }}>
                {plan.price}
              </strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
