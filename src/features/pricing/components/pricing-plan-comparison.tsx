import { CheckCircle2, Clock3 } from "lucide-react";

import type { CatalogPlanView } from "../contracts/pricing.contracts";

function planTerms(plan: CatalogPlanView): string[] {
  if (!plan.isPurchasable) return ["Plan details will be published before launch."];
  return [
    `${plan.trialDays ?? 30}-day trial`,
    `${Math.round((plan.platformCommissionRate ?? 0.07) * 100)}% platform commission`,
    plan.currency === "INR" && plan.taxInclusive
      ? "India price is tax-inclusive"
      : "Monthly subscription billing",
  ];
}

export function PricingPlanComparison({ plans }: { plans: CatalogPlanView[] }) {
  return (
    <div className="pricing-billing__plan-cards">
      {plans.map((plan) => (
        <article
          key={plan.tierKey}
          className={`pricing-billing__plan-card ${
            plan.isPurchasable ? "pricing-billing__plan-card--active" : ""
          }`}
        >
          <div className="pricing-billing__plan-card-heading">
            <div>
              <h4>{plan.name}</h4>
              <p className="pricing-billing__plan-card-price">
                {plan.isPurchasable ? plan.priceDescriptor : "Coming soon"}
              </p>
            </div>
            <span className="pricing-billing__status-pill">
              {plan.isPurchasable ? "Purchasable" : "Upcoming"}
            </span>
          </div>
          <ul>
            {planTerms(plan).map((term) => (
              <li key={term}>
                {plan.isPurchasable ? (
                  <CheckCircle2 size={18} color="var(--color-primary)" aria-hidden />
                ) : (
                  <Clock3 size={18} color="var(--text-muted)" aria-hidden />
                )}
                {term}
              </li>
            ))}
          </ul>
          <p className="pricing-billing__summary-meta" style={{ marginBottom: 0 }}>
            {plan.isPurchasable
              ? "Founder’s Beta is the only purchasable MVP plan."
              : "No selection, checkout, or tier change is available yet."}
          </p>
        </article>
      ))}
    </div>
  );
}
