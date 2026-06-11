import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "../../../design-system/aurora";
import type {
  BrandSubscriptionRecord,
  CatalogPlanView,
  SubscriptionTier,
} from "../contracts/pricing.contracts";
import { PLAN_CARD_FEATURES, TIER_DISPLAY_NAMES } from "../constants/pricing-copy";

type PricingPlanComparisonProps = {
  subscription: BrandSubscriptionRecord;
  plans: CatalogPlanView[];
  loading?: boolean;
  onChangeTier: (tier: SubscriptionTier) => void;
};

const PAID_COMPARISON_TIERS: SubscriptionTier[] = [
  "GROWTH_STARTER",
  "PROFESSIONAL",
  "ENTERPRISE",
];

function parsePriceAmount(descriptor: string): string {
  const match = descriptor.match(/\$[\d,]+/);
  return match?.[0] ?? descriptor;
}

export function PricingPlanComparison({
  subscription,
  plans,
  loading = false,
  onChangeTier,
}: PricingPlanComparisonProps) {
  const planByTier = new Map(plans.map((plan) => [plan.tierKey, plan]));
  const isFoundersTrial =
    subscription.status === "TRIALING" && subscription.tier === "FOUNDERS_BETA";
  const foundersTrialWindowOpen =
    subscription.tier === "FOUNDERS_BETA" &&
    subscription.trialEndsAt !== null &&
    new Date(subscription.trialEndsAt) > new Date();
  const canChangeTier =
    subscription.status === "ACTIVE" ||
    Boolean(subscription.razorpaySubscriptionId) ||
    foundersTrialWindowOpen;

  return (
    <div className="pricing-billing__plan-cards">
      {isFoundersTrial || (foundersTrialWindowOpen && subscription.status === "CANCELED") ? (
        <p className="pricing-billing__summary-meta pricing-billing__plan-hint" role="status">
          Your Founder&apos;s preview is free for 30 days. Choosing Growth Starter or Professional
          opens Razorpay checkout for the first payment and sets up monthly auto-billing.
        </p>
      ) : null}
      {PAID_COMPARISON_TIERS.map((tier) => {
        const catalog = planByTier.get(tier);
        const isActive = subscription.tier === tier;
        const isEnterprise = tier === "ENTERPRISE";
        const features =
          tier === "GROWTH_STARTER" || tier === "PROFESSIONAL"
            ? PLAN_CARD_FEATURES[tier]
            : [
                "Dedicated Account Manager",
                "White-label Dashboard",
              ];

        return (
          <div
            key={tier}
            className={`pricing-billing__plan-card ${isActive ? "pricing-billing__plan-card--active" : ""}`}
          >
            {isActive ? (
              <div className="pricing-billing__plan-card-banner">
                Current Tier Focus: {TIER_DISPLAY_NAMES[tier]} — Active
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-sm)" }}>
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--size-h2)",
                    fontWeight: 700,
                  }}
                >
                  {catalog?.name ?? TIER_DISPLAY_NAMES[tier]}
                </h4>
                <p className="pricing-billing__plan-card-price">
                  {isEnterprise
                    ? "Custom"
                    : parsePriceAmount(catalog?.priceDescriptor ?? "—")}
                  {!isEnterprise ? (
                    <span
                      style={{
                        fontSize: "var(--size-body)",
                        fontWeight: 400,
                        color: "var(--text-muted)",
                      }}
                    >
                      /mo
                    </span>
                  ) : null}
                </p>
              </div>
              {isActive ? (
                <span className="pricing-billing__status-pill">Active</span>
              ) : null}
            </div>

            {isEnterprise ? (
              <p className="pricing-billing__summary-meta" style={{ margin: "0.5rem 0 var(--space-md)" }}>
                Tailored solutions for large creator agencies and global brand hubs.
              </p>
            ) : null}

            <ul>
              {features.map((feature) => (
                <li key={feature}>
                  <CheckCircle2 size={18} color="var(--color-primary)" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>

            {isActive ? (
              <Button disabled style={{ width: "100%" }}>
                Current Plan
              </Button>
            ) : isEnterprise ? (
              <Button variant="outline" disabled style={{ width: "100%" }}>
                Contact Sales
              </Button>
            ) : (
              <Button
                variant="outline"
                style={{ width: "100%" }}
                disabled={loading || subscription.tier === tier || !canChangeTier}
                onClick={() => onChangeTier(tier)}
              >
                {loading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
                {canChangeTier
                  ? foundersTrialWindowOpen &&
                      (subscription.status === "TRIALING" ||
                        subscription.status === "CANCELED" ||
                        subscription.status === "HALTED")
                    ? "Subscribe"
                    : "Change plan"
                  : "Billing unavailable"}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
