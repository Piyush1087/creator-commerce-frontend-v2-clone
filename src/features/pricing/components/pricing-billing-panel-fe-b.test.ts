// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BrandBillingProfileResponse } from "../../settings/contracts/brand-settings.contracts";
import type { BrandSubscriptionRecord } from "../contracts/pricing.contracts";

const usePricingMock = vi.hoisted(() => vi.fn());
vi.mock("../hooks/use-pricing", () => ({ usePricing: usePricingMock }));

import { PricingBillingPanel } from "./pricing-billing-panel";

const billingProfile: BrandBillingProfileResponse = {
  is_read_only: false,
  profile_state: "CONFIGURED",
  is_complete_for_paid_conversion: true,
  missing_required_fields: [],
  billing_profile: {
    legal_entity_name: "Acme",
    legal_entity_type: "LLC",
    billing_country_code: "US",
    billing_address: "100 Main Street",
    gstin: null,
    profile_state: "CONFIGURED",
    configured_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
  },
};

function subscription(
  overrides: Partial<BrandSubscriptionRecord> = {},
): BrandSubscriptionRecord {
  return {
    id: "subscription-1",
    brandProfileId: "brand-1",
    tier: "FOUNDERS_BETA",
    plan: "FOUNDERS_BETA",
    status: "ACTIVE",
    currency: "USD",
    razorpayCustomerId: "customer-1",
    razorpaySubscriptionId: "provider-1",
    razorpayPlanId: "plan-1",
    trialEndsAt: null,
    currentPeriodStart: "2026-08-01T00:00:00.000Z",
    currentPeriodEnd: "2026-09-01T00:00:00.000Z",
    cancelEffectiveAt: null,
    paymentGraceEndsAt: null,
    lifecycleStatus: "ACTIVE",
    accessMode: "FULL_ACCESS",
    requiredAction: "NONE",
    commercialTerms: {
      amountMinor: 9900,
      currency: "USD",
      billingInterval: "MONTH",
      trialDays: 30,
      platformCommissionRate: 0.07,
      taxInclusive: false,
    },
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function pricingState(
  sub: BrandSubscriptionRecord | null,
  profile: BrandBillingProfileResponse = billingProfile,
) {
  return {
    status: "ready",
    subscription: sub,
    plans: [],
    usage: null,
    geoContext: { zone: "ZONE_US", currency: "USD" },
    invoices: [],
    billingProfile: profile,
    errorMessage: null,
    missingRequiredFields: [],
    actionLoading: false,
    reload: vi.fn(),
    startLocalTrial: vi.fn().mockResolvedValue(undefined),
    beginPaidConversion: vi.fn().mockResolvedValue(undefined),
    cancelPlan: vi.fn().mockResolvedValue(undefined),
    reactivatePlan: vi.fn().mockResolvedValue({
      subscription: sub,
      recovery_mode: "trial_restored",
    }),
  };
}

afterEach(() => {
  cleanup();
  usePricingMock.mockReset();
});

describe("FE-B subscription actions and role authority", () => {
  it.each(["Brand Owner", "Finance Admin"])(
    "%s can confirm only period-end cancellation",
    async () => {
      const state = pricingState(subscription());
      usePricingMock.mockReturnValue(state);
      render(createElement(PricingBillingPanel));
      fireEvent.click(screen.getByRole("button", { name: "Schedule cancellation" }));
      expect(screen.getByText(/Access remains active through September 1, 2026/i)).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: "Confirm period-end cancellation" }),
      );
      await waitFor(() => expect(state.cancelPlan).toHaveBeenCalledOnce());
    },
  );

  it("keeps Campaign Manager subscription actions read-only", () => {
    const state = pricingState(subscription(), { ...billingProfile, is_read_only: true });
    usePricingMock.mockReturnValue(state);
    render(createElement(PricingBillingPanel));
    const cancel = screen.getByRole("button", { name: "Schedule cancellation" });
    expect(cancel.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/Campaign Managers have read-only subscription access/i)).toBeTruthy();
  });

  it("shows no payment action during TRIALING", () => {
    const state = pricingState(
      subscription({
        status: "TRIALING",
        lifecycleStatus: "TRIALING",
        trialEndsAt: "2026-09-20T00:00:00.000Z",
        razorpaySubscriptionId: null,
      }),
    );
    usePricingMock.mockReturnValue(state);
    render(createElement(PricingBillingPanel));
    expect(screen.queryByRole("button", { name: /connect billing|payment method|paid conversion/i })).toBeNull();
    expect(screen.getByText(/No payment method or billing connection is required/i)).toBeTruthy();
  });

  it("keeps PAST_DUE in full access through the actual grace end", () => {
    const state = pricingState(
      subscription({
        status: "PAST_DUE",
        lifecycleStatus: "PAST_DUE",
        accessMode: "FULL_ACCESS",
        requiredAction: "UPDATE_PAYMENT_METHOD",
        paymentGraceEndsAt: "2026-09-05T00:00:00.000Z",
      }),
    );
    usePricingMock.mockReturnValue(state);
    render(createElement(PricingBillingPanel));
    expect(screen.getAllByText(/Full access/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/through September 5, 2026/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Update payment method" })).toBeTruthy();
  });

  it("shows scheduled cancellation access and backend continuation action", () => {
    const state = pricingState(
      subscription({
        status: "CANCEL_SCHEDULED",
        lifecycleStatus: "CANCEL_SCHEDULED",
        cancelEffectiveAt: "2026-09-20T00:00:00.000Z",
      }),
    );
    usePricingMock.mockReturnValue(state);
    render(createElement(PricingBillingPanel));
    expect(screen.getByText(/Full access continues until September 20, 2026/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue subscription" })).toBeTruthy();
  });

  it("guides incomplete paid conversion to the missing billing fields", () => {
    const state = pricingState(
      subscription({
        status: "TRIAL_EXPIRED",
        lifecycleStatus: "TRIAL_EXPIRED",
        accessMode: "RESTRICTED_WIND_DOWN",
        requiredAction: "PAYMENT_REQUIRED",
      }),
      {
        is_read_only: false,
        profile_state: "NOT_CONFIGURED",
        is_complete_for_paid_conversion: false,
        missing_required_fields: ["legal_entity_type", "billing_address"],
        billing_profile: null,
      },
    );
    usePricingMock.mockReturnValue(state);
    render(createElement(PricingBillingPanel));
    expect(screen.getByText(/Missing: legal entity type, billing address/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start paid conversion" }).hasAttribute("disabled")).toBe(true);
  });
});
