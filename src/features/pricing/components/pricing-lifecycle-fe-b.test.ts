// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type {
  BrandSubscriptionRecord,
  CatalogPlanView,
  SubscriptionLifecycleStatus,
} from "../contracts/pricing.contracts";
import { getLifecyclePresentation } from "../utils/format-pricing";
import { PricingFoundersTrialStatus } from "./pricing-founders-trial-status";
import { PricingPlanComparison } from "./pricing-plan-comparison";

const baseSubscription: BrandSubscriptionRecord = {
  id: "subscription-1",
  brandProfileId: "brand-1",
  tier: "FOUNDERS_BETA",
  plan: "FOUNDERS_BETA",
  status: "TRIALING",
  currency: "INR",
  razorpayCustomerId: null,
  razorpaySubscriptionId: null,
  razorpayPlanId: null,
  trialEndsAt: "2026-09-20T00:00:00.000Z",
  currentPeriodStart: "2026-08-21T00:00:00.000Z",
  currentPeriodEnd: "2026-09-20T00:00:00.000Z",
  cancelEffectiveAt: null,
  paymentGraceEndsAt: null,
  lifecycleStatus: "TRIALING",
  accessMode: "FULL_ACCESS",
  requiredAction: "NONE",
  commercialTerms: {
    amountMinor: 999000,
    currency: "INR",
    billingInterval: "MONTH",
    trialDays: 30,
    platformCommissionRate: 0.07,
    taxInclusive: true,
  },
  createdAt: "2026-08-21T00:00:00.000Z",
  updatedAt: "2026-08-21T00:00:00.000Z",
};

const plans: CatalogPlanView[] = [
  {
    tierKey: "FOUNDERS_BETA",
    name: "Founder's Beta",
    priceDescriptor: "₹9,990/mo",
    isPubliclyAvailable: true,
    availability: "PURCHASABLE",
    isPurchasable: true,
    currency: "INR",
    amountMinor: 999000,
    billingInterval: "MONTH",
    trialDays: 30,
    platformCommissionRate: 0.07,
    taxInclusive: true,
  },
  ...(["GROWTH_STARTER", "PROFESSIONAL", "ENTERPRISE"] as const).map(
    (tierKey) => ({
      tierKey,
      name: tierKey.replace(/_/g, " "),
      priceDescriptor: "Upcoming",
      isPubliclyAvailable: true,
      availability: "UPCOMING" as const,
      isPurchasable: false,
      currency: null,
      amountMinor: null,
      billingInterval: null,
      trialDays: null,
      platformCommissionRate: null,
      taxInclusive: null,
    }),
  ),
];

afterEach(cleanup);

describe("FE-B pricing lifecycle read model", () => {
  it.each<SubscriptionLifecycleStatus>([
    "TRIALING",
    "ACTIVE",
    "CANCEL_SCHEDULED",
    "PAST_DUE",
    "TRIAL_EXPIRED",
    "CANCELLED",
    "HALTED",
  ])("presents %s without stale frozen/read-only/7-day copy", (status) => {
    const presentation = getLifecyclePresentation(status, {
      trialEndsAt: "2026-09-20T00:00:00.000Z",
      currentPeriodEnd: "2026-09-20T00:00:00.000Z",
      cancelEffectiveAt: "2026-09-20T00:00:00.000Z",
      paymentGraceEndsAt: "2026-09-05T00:00:00.000Z",
    });
    expect(presentation.label.length).toBeGreaterThan(0);
    expect(`${presentation.heading} ${presentation.description}`).not.toMatch(
      /read-only mode|automation frozen|within 7 days/i,
    );
  });

  it("uses the actual payment grace end for PAST_DUE", () => {
    expect(
      getLifecyclePresentation("PAST_DUE", {
        trialEndsAt: null,
        currentPeriodEnd: "2026-09-20T00:00:00.000Z",
        cancelEffectiveAt: null,
        paymentGraceEndsAt: "2026-09-05T00:00:00.000Z",
      }).description,
    ).toContain("September 5, 2026");
  });
});

describe("FE-B Founder’s Beta catalog", () => {
  it("shows one purchasable plan and three actionless upcoming tiers", () => {
    render(createElement(PricingPlanComparison, { plans }));
    expect(screen.getAllByText("Purchasable")).toHaveLength(1);
    expect(screen.getAllByText("Upcoming")).toHaveLength(3);
    expect(screen.getAllByText("Coming soon")).toHaveLength(3);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText("₹9,990/mo")).toBeTruthy();
    expect(screen.getByText("30-day trial")).toBeTruthy();
    expect(screen.getByText("7% platform commission")).toBeTruthy();
    expect(screen.getByText("India price is tax-inclusive")).toBeTruthy();
  });

  it("shows no trial payment-method or connection action", () => {
    const { container } = render(
      createElement(PricingFoundersTrialStatus, { subscription: baseSubscription }),
    );
    expect(container.textContent).toMatch(/No payment method or billing connection is required/i);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("renders the US/ROW Founder’s Beta catalog price as $99 per month", () => {
    render(
      createElement(PricingPlanComparison, {
        plans: [
          {
            ...plans[0],
            priceDescriptor: "$99/mo",
            currency: "USD",
            amountMinor: 9900,
            taxInclusive: false,
          },
        ],
      }),
    );
    expect(screen.getByText("$99/mo")).toBeTruthy();
    expect(screen.getByText("Monthly subscription billing")).toBeTruthy();
  });
});
