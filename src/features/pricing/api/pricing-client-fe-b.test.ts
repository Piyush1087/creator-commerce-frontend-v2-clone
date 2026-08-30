// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { adoptAuthSession, resetAuthSessionForTests } from "../../../shared/auth/auth-session";
import {
  PricingApiError,
  cancelSubscription,
  startPaidConversion,
} from "./pricing-client";

const fetchMock = vi.fn<typeof fetch>();

const subscription = {
  id: "subscription-1",
  brandProfileId: "brand-1",
  tier: "FOUNDERS_BETA" as const,
  plan: "FOUNDERS_BETA" as const,
  status: "TRIAL_EXPIRED" as const,
  currency: "USD" as const,
  razorpayCustomerId: null,
  razorpaySubscriptionId: null,
  razorpayPlanId: null,
  trialEndsAt: "2026-08-01T00:00:00.000Z",
  currentPeriodStart: "2026-07-01T00:00:00.000Z",
  currentPeriodEnd: "2026-08-01T00:00:00.000Z",
  cancelEffectiveAt: null,
  paymentGraceEndsAt: null,
  lifecycleStatus: "TRIAL_EXPIRED" as const,
  accessMode: "RESTRICTED_WIND_DOWN" as const,
  requiredAction: "PAYMENT_REQUIRED" as const,
  commercialTerms: {
    amountMinor: 9900,
    currency: "USD" as const,
    billingInterval: "MONTH" as const,
    trialDays: 30,
    platformCommissionRate: 0.07,
    taxInclusive: false,
  },
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  resetAuthSessionForTests();
  adoptAuthSession({
    accessToken: "pricing-token",
    accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
    user: { id: "brand-user", email: "owner@example.test", name: "Owner", role: "BRAND" },
  });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("FE-B canonical pricing mutations", () => {
  it("starts first paid conversion on the semantic endpoint", async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        {
          subscription,
          checkout: {
            subscriptionId: "provider-1",
            razorpayKeyId: "rzp-test",
            targetTier: "FOUNDERS_BETA",
          },
        },
        201,
      ),
    );
    await expect(startPaidConversion()).resolves.toMatchObject({
      checkout: { targetTier: "FOUNDERS_BETA" },
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/v1/pricing/paid-conversion/start",
    );
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });

  it("preserves backend missing-field guidance for incomplete billing", async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        {
          message: "A complete Billing Profile is required for paid conversion.",
          is_complete_for_paid_conversion: false,
          missing_required_fields: ["legal_entity_type", "billing_address"],
        },
        400,
      ),
    );
    const error = await startPaidConversion().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(PricingApiError);
    expect(error).toMatchObject({
      missingRequiredFields: ["legal_entity_type", "billing_address"],
    });
  });

  it("schedules cancellation without the removed cancel-at-cycle-end choice", async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        subscription: {
          ...subscription,
          status: "CANCEL_SCHEDULED",
          lifecycleStatus: "CANCEL_SCHEDULED",
          accessMode: "FULL_ACCESS",
          requiredAction: "NONE",
          cancelEffectiveAt: "2026-09-01T00:00:00.000Z",
        },
      }),
    );
    await cancelSubscription();
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/v1/pricing/cancel");
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });
});
