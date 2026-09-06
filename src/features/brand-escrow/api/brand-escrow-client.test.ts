// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adoptAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";
import {
  createBrandReturn,
  createEscrowTopUpIntent,
  EscrowApiError,
  fetchBrandReturnRequest,
  fetchBrandReturnRequests,
  fetchBrandReturnSummary,
  fetchEscrowVault,
} from "./brand-escrow-client";
import {
  brandReturnRequestSchema,
  escrowVaultSchema,
} from "../contracts/escrow.contracts";

const fetchMock = vi.fn<typeof fetch>();
const iso = "2026-08-30T10:00:00.000Z";
const ids = {
  vault: "11111111-1111-4111-8111-111111111111",
  brand: "22222222-2222-4222-8222-222222222222",
  request: "33333333-3333-4333-8333-333333333333",
  identity: "44444444-4444-4444-8444-444444444444",
  load: "55555555-5555-4555-8555-555555555555",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function vault(overrides: Record<string, unknown> = {}) {
  return {
    vault_id: ids.vault,
    brand_id: ids.brand,
    razorpay_virtual_account_id: "va_safe_but_not_rendered",
    virtual_account_number: "1234567890",
    ifsc_code: "BANK0000001",
    upi_vpa: null,
    bank_name: "Provider bank",
    virtual_account_enabled: true,
    currency: "INR",
    total_pooled_balance: 10000,
    locked_campaign_funds: 2500,
    available_balance: 7000,
    active_return_commitment: 500,
    tds_buffer_balance: 0,
    pending_funding: 5000,
    created_at: iso,
    updated_at: iso,
    ...overrides,
  };
}

function returnRequest(overrides: Record<string, unknown> = {}) {
  return {
    brand_return_request_id: ids.request,
    idempotency_identity: ids.identity,
    requested_amount: 1000,
    committed_amount: 1000,
    successful_amount: 0,
    unresolved_amount: 1000,
    released_amount: 0,
    currency: "INR",
    status: "PROCESSING",
    action_required_reason: null,
    allocation_count: 0,
    allocations: [],
    requested_at: iso,
    processing_at: iso,
    completed_at: null,
    updated_at: iso,
    ...overrides,
  };
}

beforeEach(() => {
  resetAuthSessionForTests();
  adoptAuthSession({
    accessToken: "treasury-token",
    accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
    user: {
      id: "brand-user",
      email: "owner@example.test",
      name: "Owner",
      role: "BRAND",
    },
  });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetAuthSessionForTests();
});

describe("FE-D Treasury runtime contracts", () => {
  it("accepts every exact vault bucket and rejects a missing or future field", () => {
    expect(escrowVaultSchema.safeParse(vault()).success).toBe(true);
    expect(
      escrowVaultSchema.safeParse({ ...vault(), pending_funding: undefined }).success,
    ).toBe(false);
    expect(
      escrowVaultSchema.safeParse({ ...vault(), reserved_balance: 12 }).success,
    ).toBe(false);
  });

  it("fails closed on an unknown Brand Return lifecycle", () => {
    expect(brandReturnRequestSchema.safeParse(returnRequest()).success).toBe(true);
    expect(
      brandReturnRequestSchema.safeParse(
        returnRequest({ status: "REFUNDED_TO_BANK" }),
      ).success,
    ).toBe(false);
  });
});

describe("FE-D Treasury API client", () => {
  it("reads the canonical vault and validates sensitive fields without projecting them", async () => {
    fetchMock.mockResolvedValue(response(vault()));
    await expect(fetchEscrowVault()).resolves.toMatchObject({
      available_balance: 7000,
      pending_funding: 5000,
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/v1/escrow/vault");
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("Authorization")).toBe(
      "Bearer treasury-token",
    );
  });

  it("uses a UUID idempotency key and exact major-unit top-up body", async () => {
    fetchMock.mockResolvedValue(
      response({
        checkout_order_id: "order_123",
        funding_load_id: ids.load,
        total_invoice_charge_amount: 5118,
        allocation_amount: 5000,
        gateway_surcharge: 100,
        surcharge_gst: 18,
      }),
    );
    await createEscrowTopUpIntent({
      targetAllocation: 5000,
      idempotencyKey: ids.identity,
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      target_allocation: 5000,
      idempotency_key: ids.identity,
    });
  });

  it("uses only amount and UUID identity for Brand Return", async () => {
    fetchMock.mockResolvedValue(response(returnRequest(), 202));
    await createBrandReturn({ amount: 1000, idempotencyIdentity: ids.identity });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      amount: 1000,
      idempotency_identity: ids.identity,
    });
    expect(String(fetchMock.mock.calls[0][1]?.body)).not.toMatch(
      /bank|destination|source|provider|payment/i,
    );
  });

  it("validates summary, list, and detail read routes", async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({
          available_balance: 7000,
          proven_source_available_balance: 6000,
          self_service_returnable_balance: 5500,
          active_return_commitment: 500,
          source_reconciliation_required_amount: 1000,
          currency: "INR",
        }),
      )
      .mockResolvedValueOnce(response([returnRequest()]))
      .mockResolvedValueOnce(response(returnRequest()));
    await expect(fetchBrandReturnSummary()).resolves.toMatchObject({
      self_service_returnable_balance: 5500,
    });
    await expect(fetchBrandReturnRequests()).resolves.toHaveLength(1);
    await expect(fetchBrandReturnRequest(ids.request)).resolves.toMatchObject({
      status: "PROCESSING",
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/brand-returns/summary");
    expect(String(fetchMock.mock.calls[1][0])).toMatch(/brand-returns\?limit=50$/);
    expect(String(fetchMock.mock.calls[2][0])).toContain(`/brand-returns/${ids.request}`);
  });

  it("preserves provider-deferred codes and never maps them to completion", async () => {
    fetchMock.mockResolvedValue(
      response(
        {
          message: {
            code: "PROVIDER_SETUP_REQUIRED",
            message: "Provider adapter is not configured",
          },
        },
        503,
      ),
    );
    const error = await createBrandReturn({
      amount: 1000,
      idempotencyIdentity: ids.identity,
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(EscrowApiError);
    expect(error).toMatchObject({
      code: "PROVIDER_SETUP_REQUIRED",
      status: 503,
      outcomeUnknown: false,
    });
  });

  it("preserves a stale source-eligibility rejection for authoritative reload", async () => {
    fetchMock.mockResolvedValue(
      response(
        {
          message: {
            code: "SOURCE_PROVENANCE_REQUIRED",
            proven_returnable_balance: 250,
            requested_amount: 1000,
          },
        },
        400,
      ),
    );
    const error = await createBrandReturn({
      amount: 1000,
      idempotencyIdentity: ids.identity,
    }).catch((caught: unknown) => caught);
    expect(error).toMatchObject({
      code: "SOURCE_PROVENANCE_REQUIRED",
      status: 400,
      outcomeUnknown: false,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("marks a transport failure as ambiguous and does not retry", async () => {
    fetchMock.mockRejectedValue(new TypeError("network unavailable"));
    const error = await createBrandReturn({
      amount: 1000,
      idempotencyIdentity: ids.identity,
    }).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: "OUTCOME_UNKNOWN", outcomeUnknown: true });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
