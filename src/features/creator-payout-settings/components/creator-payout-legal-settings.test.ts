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
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CreatorPayoutSettingsResponse } from "../contracts/creator-payout-settings.contract";
import { CreatorPayoutLegalSettingsView } from "./creator-payout-legal-settings";

function response(
  country: "IN" | "US" = "IN",
  withDestination = true,
): CreatorPayoutSettingsResponse {
  return {
    actor_role: "OWNER",
    can_manage: true,
    supported_rails: [
      {
        country_code: "IN",
        currency_code: "INR",
        destination_type: "BANK_ACCOUNT",
      },
      { country_code: "IN", currency_code: "INR", destination_type: "UPI" },
      {
        country_code: "US",
        currency_code: "USD",
        destination_type: "BANK_ACCOUNT",
      },
      { country_code: "US", currency_code: "USD", destination_type: "PAYPAL" },
    ],
    legal_profile: {
      legal_profile_id: "legal-1",
      payee_type: "INDIVIDUAL",
      legal_name: "Canonical Creator",
      country_code: country,
      address_line1: "101 International Avenue",
      address_line2: "A long but valid address unit descriptor",
      city: country === "IN" ? "Mumbai" : "Austin",
      state_region: country === "IN" ? "Maharashtra" : "Texas",
      postal_code: country === "IN" ? "400001" : "78701",
      version: 2,
      updated_at: "2026-09-01T12:00:00.000Z",
    },
    destination: withDestination
      ? {
          destination_id: "cda5d5f0-d2d2-40e9-9a87-d0b51a8c0aad",
          payee_type: "INDIVIDUAL",
          beneficiary_name: "Canonical Creator",
          destination_type: "BANK_ACCOUNT",
          country_code: country,
          currency_code: country === "IN" ? "INR" : "USD",
          masked_display: "Bank account ••••9012 · routing ••••1234",
          is_primary: true,
          state: "CONFIGURED_UNVERIFIED",
          reason_code: null,
          version: 3,
          encryption_key_version: 1,
          disabled_at: null,
          updated_at: "2026-09-01T12:00:00.000Z",
        }
      : null,
    verification: {
      authority: "DEFERRED_TO_MVP_V2",
      provider_status: null,
    },
  };
}

function setup(data = response()) {
  const props = {
    data,
    saving: false,
    error: null,
    onReplaceDestination: vi.fn().mockResolvedValue(undefined),
    onDisableDestination: vi.fn().mockResolvedValue(undefined),
    onSaveLegalProfile: vi.fn().mockResolvedValue(undefined),
  };
  render(createElement(CreatorPayoutLegalSettingsView, props));
  return props;
}

afterEach(() => {
  cleanup();
  document.body.classList.remove("creator-payout-sheet-open");
});

describe("C-05 Creator payout and legal Settings UI", () => {
  it("renders only the masked destination with an explicitly unverified status", () => {
    setup();
    expect(
      screen.getByText("Bank account ••••9012 · routing ••••1234"),
    ).toBeTruthy();
    expect(screen.getByText("Configured — not verified")).toBeTruthy();
    expect(screen.queryByText("Verified active node")).toBeNull();
    expect(document.body.textContent).not.toContain("123456789012");
    expect(document.body.textContent).not.toContain("HDFC0001234");
  });

  it("denies the Assistant surface even if a response is mistakenly populated", () => {
    const data = response();
    data.actor_role = "ASSISTANT";
    data.can_manage = false;
    setup(data);
    expect(
      screen.getByText(/Only the workspace Owner or Manager can access/),
    ).toBeTruthy();
    expect(
      screen.queryByText("Bank account ••••9012 · routing ••••1234"),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Replace destination" }),
    ).toBeNull();
  });

  it("shows only India bank and UPI rails for an India legal profile", () => {
    setup(response("IN", false));
    fireEvent.click(screen.getByRole("button", { name: "Add destination" }));
    const method = screen.getByLabelText("Payout method");
    expect(
      within(method).getByRole("option", { name: "Bank account" }),
    ).toBeTruthy();
    expect(within(method).getByRole("option", { name: "UPI" })).toBeTruthy();
    expect(within(method).queryByRole("option", { name: "PayPal" })).toBeNull();
    expect(screen.getByText(/write-only/)).toBeTruthy();
  });

  it("shows only US bank and PayPal rails for a US legal profile", () => {
    setup(response("US", false));
    fireEvent.click(screen.getByRole("button", { name: "Add destination" }));
    const method = screen.getByLabelText("Payout method");
    expect(
      within(method).getByRole("option", { name: "Bank account" }),
    ).toBeTruthy();
    expect(within(method).getByRole("option", { name: "PayPal" })).toBeTruthy();
    expect(within(method).queryByRole("option", { name: "UPI" })).toBeNull();
  });

  it("clears secure values after Escape and restores focus to the trigger", async () => {
    setup(response("IN", false));
    const trigger = screen.getByRole("button", { name: "Add destination" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.change(screen.getByLabelText("Bank account number"), {
      target: { value: "123456789012" },
    });
    expect(
      (screen.getByLabelText("Bank account number") as HTMLInputElement).value,
    ).toBe("123456789012");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    expect(
      (screen.getByLabelText("Bank account number") as HTMLInputElement).value,
    ).toBe("");
  });

  it("submits a complete India bank write contract without displaying it afterward", async () => {
    const props = setup(response("IN", false));
    fireEvent.click(screen.getByRole("button", { name: "Add destination" }));
    fireEvent.change(screen.getByLabelText("Bank account number"), {
      target: { value: "123456789012" },
    });
    fireEvent.change(screen.getByLabelText("Confirm bank account number"), {
      target: { value: "123456789012" },
    });
    fireEvent.change(screen.getByLabelText("IFSC code"), {
      target: { value: "hdfc0001234" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save as configured — unverified" }),
    );
    await waitFor(() =>
      expect(props.onReplaceDestination).toHaveBeenCalledWith({
        payeeType: "INDIVIDUAL",
        beneficiaryName: "Canonical Creator",
        destinationType: "BANK_ACCOUNT",
        countryCode: "IN",
        currencyCode: "INR",
        accountNumber: "123456789012",
        confirmAccountNumber: "123456789012",
        routingCode: "HDFC0001234",
      }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.textContent).not.toContain("123456789012");
  });

  it("keeps tax identifiers, PAN, KYC, and verification controls outside the legal form", () => {
    setup(response("IN", false));
    fireEvent.click(screen.getByRole("button", { name: "Edit legal profile" }));
    expect(
      screen.getByRole("dialog", { name: "Edit legal profile" }),
    ).toBeTruthy();
    expect(screen.queryByLabelText(/PAN/i)).toBeNull();
    expect(screen.queryByLabelText(/tax identifier/i)).toBeNull();
    expect(screen.queryByLabelText(/KYC/i)).toBeNull();
    expect(screen.queryByLabelText(/verification/i)).toBeNull();
  });

  it("uses the accessible Aurora drawer as a mobile sheet seam", async () => {
    setup(response("IN", false));
    fireEvent.click(screen.getByRole("button", { name: "Add destination" }));
    const dialog = screen.getByRole("dialog", {
      name: "Add payout destination",
    });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.body.classList.contains("creator-payout-sheet-open")).toBe(
      true,
    );
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Close Add payout destination" }),
      ),
    );
  });

  it("requires the legal profile before enabling a destination", () => {
    const data = response("IN", false);
    data.legal_profile = null;
    setup(data);
    const button = screen.getByRole("button", { name: "Add destination" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute("aria-describedby")).toBe(
      "creator-payout-legal-required",
    );
  });
});
