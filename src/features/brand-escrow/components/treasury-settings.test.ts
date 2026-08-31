// @vitest-environment jsdom
import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EscrowApiError } from "../api/brand-escrow-client";
import type {
  BrandReturnRequestApiResponse,
  BrandReturnStatus,
  EscrowVaultApiResponse,
  TreasuryRole,
} from "../contracts/escrow.contracts";
import {
  amountIsWithinAuthoritativeLimit,
  meetsIndiaTopUpMinimum,
  parseTreasuryAmount,
} from "../utils/treasury-money";

const mocks = vi.hoisted(() => ({
  useEscrow: vi.fn(),
  topUp: vi.fn(),
  brandReturn: vi.fn(),
  checkout: vi.fn(),
  reload: vi.fn(),
}));

vi.mock("../hooks/use-brand-escrow", () => ({
  useBrandEscrow: mocks.useEscrow,
}));

vi.mock("../api/brand-escrow-client", async () => {
  const actual = await vi.importActual<typeof import("../api/brand-escrow-client")>(
    "../api/brand-escrow-client",
  );
  return {
    ...actual,
    createEscrowTopUpIntent: mocks.topUp,
    createBrandReturn: mocks.brandReturn,
  };
});

vi.mock("../utils/razorpay-checkout", () => ({
  openRazorpayCheckout: mocks.checkout,
}));

import { EscrowAccountCard } from "./escrow-account-card";
import { BrandReturnDrawer } from "./brand-return-drawer";

const iso = "2026-08-30T10:00:00.000Z";
const ids = {
  vault: "11111111-1111-4111-8111-111111111111",
  brand: "22222222-2222-4222-8222-222222222222",
  request: "33333333-3333-4333-8333-333333333333",
  identity: "44444444-4444-4444-8444-444444444444",
  load: "55555555-5555-4555-8555-555555555555",
};

const vault: EscrowVaultApiResponse = {
  vault_id: ids.vault,
  brand_id: ids.brand,
  razorpay_virtual_account_id: "va_hidden",
  virtual_account_number: "1234567890",
  ifsc_code: "BANK0000001",
  upi_vpa: "hidden@bank",
  bank_name: "Hidden Bank",
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
};

function request(
  status: BrandReturnStatus = "PROCESSING",
  overrides: Partial<BrandReturnRequestApiResponse> = {},
): BrandReturnRequestApiResponse {
  return {
    brand_return_request_id: ids.request,
    idempotency_identity: ids.identity,
    requested_amount: 1000,
    committed_amount: status === "COMPLETED" ? 0 : 1000,
    successful_amount: status === "COMPLETED" ? 1000 : 0,
    unresolved_amount: status === "COMPLETED" ? 0 : 1000,
    released_amount: 0,
    currency: "INR",
    status,
    action_required_reason:
      status === "ACTION_REQUIRED" ? "PROVIDER_RECONCILIATION_REQUIRED" : null,
    allocation_count: 0,
    allocations: [],
    requested_at: iso,
    processing_at: iso,
    completed_at: status === "COMPLETED" ? iso : null,
    updated_at: iso,
    ...overrides,
  };
}

function setState(
  role: TreasuryRole,
  overrides: Record<string, unknown> = {},
) {
  mocks.useEscrow.mockReturnValue({
    status: "ready",
    vault,
    returnSummary: {
      available_balance: 7000,
      proven_source_available_balance: 6000,
      self_service_returnable_balance: 5500,
      active_return_commitment: 500,
      source_reconciliation_required_amount: 1000,
      currency: "INR",
    },
    returnRequests: [request()],
    ledger: [
      {
        id: ids.load,
        label: "Funding load",
        transactionType: "LOAD",
        occurredAt: iso,
        amount: 5000,
        currency: "INR",
        direction: "credit",
        status: "CREDITED",
        collaborationId: null,
        gatewayReferenceId: null,
        trancheTarget: null,
      },
    ],
    role,
    errorMessage: null,
    refreshing: false,
    reload: mocks.reload,
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setState("BRAND_OWNER");
  mocks.reload.mockResolvedValue(undefined);
  mocks.topUp.mockResolvedValue({
    checkout_order_id: "order_123",
    funding_load_id: ids.load,
    total_invoice_charge_amount: 5118,
    allocation_amount: 5000,
    gateway_surcharge: 100,
    surcharge_gst: 18,
  });
  mocks.brandReturn.mockResolvedValue(request("PROCESSING"));
  mocks.checkout.mockResolvedValue(undefined);
  vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
    ids.identity as `${string}-${string}-${string}-${string}-${string}`,
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("FE-D Treasury role matrix", () => {
  it.each(["BRAND_OWNER", "FINANCE_ADMIN"] as const)(
    "allows %s to add funds and request Brand Return",
    (role) => {
      setState(role);
      render(createElement(EscrowAccountCard));
      expect(screen.getByRole("button", { name: "Add funds" })).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "Return unused funds" }),
      ).toBeTruthy();
    },
  );

  it("keeps Campaign Manager Treasury-readable with every mutation absent", () => {
    setState("CAMPAIGN_MANAGER");
    render(createElement(EscrowAccountCard, { showLedgerInline: true }));
    expect(screen.getByText("Campaign Manager read-only access")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add funds" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Return unused funds" }),
    ).toBeNull();
    expect(screen.getByText("Available balance")).toBeTruthy();
    expect(screen.getByText("Funding load")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /approve creator payment/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /release creator funds/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /reverse payout/i })).toBeNull();
  });
});

describe("FE-D vault and fixed-point money truth", () => {
  it("shows pending, locked, and available as distinct backend values", () => {
    render(createElement(EscrowAccountCard));
    expect(screen.getByText("Pending funding")).toBeTruthy();
    expect(screen.getByText("Locked campaign funds")).toBeTruthy();
    expect(screen.getByText("Available balance")).toBeTruthy();
    expect(screen.getAllByText("₹5,000.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹7,000.00").length).toBeGreaterThan(0);
    expect(screen.getByText(/Not usable or returnable until payment is confirmed/)).toBeTruthy();
  });

  it("compares user input and authoritative limits with scaled integers", () => {
    const belowMinimum = parseTreasuryAmount("4999.99");
    const exactMinimum = parseTreasuryAmount("5000.00");
    expect(belowMinimum && meetsIndiaTopUpMinimum(belowMinimum, "INR")).toBe(false);
    expect(exactMinimum && meetsIndiaTopUpMinimum(exactMinimum, "INR")).toBe(true);
    expect(exactMinimum && amountIsWithinAuthoritativeLimit(exactMinimum, 5000)).toBe(true);
    expect(parseTreasuryAmount("0.1")).toMatchObject({ canonical: "0.10" });
    expect(parseTreasuryAmount("1.001")).toBeNull();
  });

  it("keeps legacy unknown-source available money visible but not returnable", () => {
    setState("BRAND_OWNER", {
      returnSummary: {
        available_balance: 7000,
        proven_source_available_balance: 1000,
        self_service_returnable_balance: 1000,
        active_return_commitment: 0,
        source_reconciliation_required_amount: 6000,
        currency: "INR",
      },
    });
    render(createElement(EscrowAccountCard));
    expect(screen.getByText(/Some available money lacks eligible source evidence/)).toBeTruthy();
    expect(screen.getAllByText("₹1,000.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹7,000.00").length).toBeGreaterThan(0);
  });
});

describe("FE-D top-up fail-closed handoff", () => {
  it("enforces the INR minimum and never credits on checkout success", async () => {
    mocks.checkout.mockImplementation(async (input: { onSuccess: () => void }) => {
      input.onSuccess();
    });
    render(createElement(EscrowAccountCard));
    fireEvent.click(screen.getByRole("button", { name: "Add funds" }));
    const amount = screen.getByLabelText("Amount (INR)");
    fireEvent.change(amount, { target: { value: "4999" } });
    expect(screen.getByText("The minimum INR top-up is ₹5,000.")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Continue to provider" }).hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.change(amount, { target: { value: "5000" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue to provider" }));
    await waitFor(() =>
      expect(mocks.topUp).toHaveBeenCalledWith({
        targetAllocation: 5000,
        idempotencyKey: ids.identity,
      }),
    );
    await waitFor(() => expect(mocks.reload).toHaveBeenCalled());
    expect(document.body.textContent).not.toMatch(/funds added|vault credited/i);
    expect(screen.getByText(/Payment was submitted/)).toBeTruthy();
  });

  it("treats provider handoff failure as a possibly pending load", async () => {
    mocks.checkout.mockRejectedValue(new Error("Provider script unavailable"));
    render(createElement(EscrowAccountCard));
    fireEvent.click(screen.getByRole("button", { name: "Add funds" }));
    fireEvent.change(screen.getByLabelText("Amount (INR)"), {
      target: { value: "5000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to provider" }));
    expect(await screen.findByText(/funding request may already exist/i)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/funds added|credited successfully/i);
  });
});

describe("FE-D Brand Return", () => {
  it("renders backend-authoritative INR and keeps an eligible mutation available", () => {
    render(createElement(EscrowAccountCard));
    const openButton = screen.getByRole("button", { name: "Return unused funds" });
    expect(openButton.hasAttribute("disabled")).toBe(false);
    fireEvent.click(openButton);
    const dialog = screen.getByRole("dialog", { name: "Return unused funds" });
    expect(within(dialog).getByText("₹5,500.00")).toBeTruthy();
    fireEvent.change(within(dialog).getByLabelText("Return amount (INR)"), {
      target: { value: "1000" },
    });
    fireEvent.click(within(dialog).getByRole("checkbox"));
    expect(
      within(dialog)
        .getByRole("button", { name: "Confirm Brand Return" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("renders backend-authoritative USD without an INR fallback", () => {
    setState("BRAND_OWNER", {
      returnSummary: {
        available_balance: 7000,
        proven_source_available_balance: 6000,
        self_service_returnable_balance: 5500,
        active_return_commitment: 500,
        source_reconciliation_required_amount: 1000,
        currency: "USD",
      },
    });
    render(createElement(EscrowAccountCard));
    const openButton = screen.getByRole("button", { name: "Return unused funds" });
    expect(openButton.hasAttribute("disabled")).toBe(false);
    fireEvent.click(openButton);
    const dialog = screen.getByRole("dialog", { name: "Return unused funds" });
    expect(within(dialog).getByText("$5,500.00")).toBeTruthy();
    expect(dialog.textContent).not.toContain("₹");
    expect(dialog.textContent).not.toContain("INR");
  });

  it("renders unavailable summary semantics and blocks null-currency mutation", () => {
    setState("BRAND_OWNER", {
      returnSummary: {
        available_balance: 7000,
        proven_source_available_balance: 6000,
        self_service_returnable_balance: 5500,
        active_return_commitment: 500,
        source_reconciliation_required_amount: 1000,
        currency: null,
      },
    });
    const { container } = render(createElement(EscrowAccountCard));
    const panel = container.querySelector(".brand-escrow-return-panel");
    expect(panel).not.toBeNull();
    expect(within(panel as HTMLElement).getAllByText("—")).toHaveLength(3);
    expect(panel?.textContent).not.toMatch(/[₹$]/);
    expect(panel?.textContent).not.toMatch(/\b(?:INR|USD)\b/);
    expect(
      screen
        .getByRole("button", { name: "Return unused funds" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      within(panel as HTMLElement).getByText(
        /Return currency is currently unavailable\. Refresh Treasury status before requesting a return\./,
      ),
    ).toBeTruthy();
  });

  it("keeps the drawer unavailable and fail-closed when currency authority is null", () => {
    render(
      createElement(BrandReturnDrawer, {
        open: true,
        summary: {
          available_balance: 7000,
          proven_source_available_balance: 6000,
          self_service_returnable_balance: 5500,
          active_return_commitment: 500,
          source_reconciliation_required_amount: 1000,
          currency: null,
        },
        onClose: vi.fn(),
        onRefresh: mocks.reload,
        onNotice: vi.fn(),
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Return unused funds" });
    expect(within(dialog).getByText("—")).toBeTruthy();
    expect(dialog.textContent).not.toMatch(/[₹$]/);
    expect(dialog.textContent).not.toMatch(/\b(?:INR|USD)\b/);
    expect(
      within(dialog).getByText(
        /Return currency is currently unavailable\. Refresh Treasury status before requesting a return\./,
      ),
    ).toBeTruthy();
    expect(
      within(dialog)
        .getByLabelText("Return amount (currency unavailable)")
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(within(dialog).getByRole("checkbox").hasAttribute("disabled")).toBe(true);
    expect(
      within(dialog)
        .getByRole("button", { name: "Confirm Brand Return" })
        .hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm Brand Return" }));
    expect(mocks.brandReturn).not.toHaveBeenCalled();
  });

  it("uses only amount plus explicit confirmation and has no destination/source fields", () => {
    render(createElement(EscrowAccountCard));
    fireEvent.click(screen.getByRole("button", { name: "Return unused funds" }));
    expect(screen.getByLabelText("Return amount (INR)")).toBeTruthy();
    expect(screen.getByRole("checkbox")).toBeTruthy();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.queryByLabelText(/account number|ifsc|provider payment id/i)).toBeNull();
  });

  it("blocks an amount above the backend-confirmed returnable balance", () => {
    setState("BRAND_OWNER", {
      returnSummary: {
        available_balance: 7000,
        proven_source_available_balance: 1000,
        self_service_returnable_balance: 1000,
        active_return_commitment: 0,
        source_reconciliation_required_amount: 6000,
        currency: "INR",
      },
    });
    render(createElement(EscrowAccountCard));
    fireEvent.click(screen.getByRole("button", { name: "Return unused funds" }));
    fireEvent.change(screen.getByLabelText("Return amount (INR)"), {
      target: { value: "1000.01" },
    });
    expect(
      screen.getByText(/exceeds the current self-service returnable balance/i),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Confirm Brand Return" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("submits an eligible amount and presents PROCESSING, not completion", async () => {
    render(createElement(EscrowAccountCard));
    fireEvent.click(screen.getByRole("button", { name: "Return unused funds" }));
    fireEvent.change(screen.getByLabelText("Return amount (INR)"), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Brand Return" }));
    await waitFor(() =>
      expect(mocks.brandReturn).toHaveBeenCalledWith({
        amount: 1000,
        idempotencyIdentity: ids.identity,
      }),
    );
    expect(await screen.findByText(/Processing return\. Provider operations remain in progress/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/return completed.*1000/i);
  });

  it("fails closed when provider execution is unavailable", async () => {
    mocks.brandReturn.mockRejectedValue(
      new EscrowApiError(
        "adapter unavailable",
        503,
        "PROVIDER_SETUP_REQUIRED",
      ),
    );
    render(createElement(EscrowAccountCard));
    fireEvent.click(screen.getByRole("button", { name: "Return unused funds" }));
    fireEvent.change(screen.getByLabelText("Return amount (INR)"), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Brand Return" }));
    expect(await screen.findByText(/return provider is unavailable/i)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Return completed/);
  });

  it("renders every canonical lifecycle without collapsing PARTIAL or ACTION_REQUIRED", () => {
    const statuses: BrandReturnStatus[] = [
      "RETURN_REQUESTED",
      "ALLOCATING_SOURCES",
      "PROCESSING",
      "COMPLETED",
      "PARTIAL",
      "ACTION_REQUIRED",
      "FAILED",
    ];
    setState("BRAND_OWNER", {
      returnRequests: statuses.map((status, index) =>
        request(status, {
          brand_return_request_id: `${String(index + 1).padStart(8, "0")}-1111-4111-8111-111111111111`,
          successful_amount: status === "PARTIAL" ? 400 : status === "COMPLETED" ? 1000 : 0,
          unresolved_amount: status === "PARTIAL" ? 600 : status === "COMPLETED" ? 0 : 1000,
        }),
      ),
    });
    render(createElement(EscrowAccountCard));
    for (const label of [
      "Return requested",
      "Allocating original sources",
      "Processing return",
      "Return completed",
      "Partially completed",
      "Action required",
      "Return failed",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/Provider reconciliation is required/)).toBeTruthy();
  });
});
