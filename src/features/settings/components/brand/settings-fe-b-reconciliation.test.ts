// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  BrandBillingProfileResponse,
  BrandNotificationsResponse,
} from "../../contracts/brand-settings.contracts";
import { BrandBillingProfileSection } from "./brand-billing-profile-section";
import { BrandNotificationsSection } from "./brand-notifications-section";

const completeBilling: BrandBillingProfileResponse = {
  is_read_only: false,
  profile_state: "CONFIGURED",
  is_complete_for_paid_conversion: true,
  missing_required_fields: [],
  billing_profile: {
    legal_entity_name: "Acme Private Limited",
    legal_entity_type: "Private Limited Company",
    billing_country_code: "IN",
    billing_address: "1 Billing Street, Bengaluru 560001",
    gstin: "27ABCDE1234F1Z5",
    profile_state: "CONFIGURED",
    configured_at: "2026-08-28T00:00:00.000Z",
    updated_at: "2026-08-28T00:00:00.000Z",
  },
};

const notifications: BrandNotificationsResponse = {
  settings: [
    ["BILLING_SUBSCRIPTION", "Billing & Subscription"],
    ["ESCROW_PAYOUTS", "Escrow & Payouts"],
    ["CAMPAIGNS_APPLICATIONS", "Campaigns & Applications"],
    ["COLLABORATIONS", "Collaborations"],
    ["BRAND_INTELLIGENCE", "Brand Intelligence"],
    ["TEAM_ACCOUNT_INTEGRATIONS", "Team, Account & Integrations"],
  ].map(([category, label]) => ({
    category: category as BrandNotificationsResponse["settings"][number]["category"],
    label,
    optional_email_enabled: true,
  })),
  mandatory_system_email_unaffected: true,
};

afterEach(cleanup);

describe("FE-B canonical billing profile", () => {
  it("renders only canonical fields, readiness, and the backend lifecycle", () => {
    const { container } = render(
      createElement(BrandBillingProfileSection, {
        data: completeBilling,
        loading: false,
        saving: false,
        error: null,
        onSave: vi.fn(),
      }),
    );
    expect(screen.getByText("Ready for paid conversion")).toBeTruthy();
    expect(screen.getByText("CONFIGURED")).toBeTruthy();
    expect(container.textContent).not.toMatch(/\bPAN\b|TDS|Currency preference/i);
  });

  it("submits the canonical payload and solicits GSTIN only for India", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      createElement(BrandBillingProfileSection, {
        data: { ...completeBilling, billing_profile: null, profile_state: "NOT_CONFIGURED", is_complete_for_paid_conversion: false, missing_required_fields: ["legal_entity_name", "legal_entity_type", "billing_country_code", "billing_address"] },
        loading: false,
        saving: false,
        error: null,
        onSave,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add billing profile" }));
    expect(screen.queryByLabelText(/^GSTIN/)).toBeNull();
    fireEvent.change(screen.getByLabelText("Legal entity name"), { target: { value: "Acme Private Limited" } });
    fireEvent.change(screen.getByLabelText("Legal entity type"), { target: { value: "Private Limited Company" } });
    fireEvent.change(screen.getByLabelText(/^Billing country/), { target: { value: "IN" } });
    fireEvent.change(screen.getByLabelText("Billing address"), { target: { value: "1 Billing Street, Bengaluru 560001" } });
    expect(screen.getByLabelText(/^GSTIN/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^GSTIN/), { target: { value: "27abcde1234f1z5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save billing profile" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        legalEntityName: "Acme Private Limited",
        legalEntityType: "Private Limited Company",
        billingCountryCode: "IN",
        billingAddress: "1 Billing Street, Bengaluru 560001",
        gstin: "27ABCDE1234F1Z5",
      }),
    );
    const payload = onSave.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("pan");
    expect(payload).not.toHaveProperty("defaultTdsPercentage");
    expect(payload).not.toHaveProperty("currencyPreference");
  });

  it("keeps Campaign Manager billing read-only while showing masked data", () => {
    render(
      createElement(BrandBillingProfileSection, {
        data: {
          ...completeBilling,
          is_read_only: true,
          billing_profile: { ...completeBilling.billing_profile!, gstin: "27•••••••••1Z5" },
        },
        loading: false,
        saving: false,
        error: null,
        onSave: vi.fn(),
      }),
    );
    expect(screen.getByText("27•••••••••1Z5")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Update billing profile" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/Campaign Managers can view masked billing data/i)).toBeTruthy();
  });

  it("renders UPDATED as the only post-configuration lifecycle", () => {
    render(
      createElement(BrandBillingProfileSection, {
        data: {
          ...completeBilling,
          profile_state: "UPDATED",
          billing_profile: { ...completeBilling.billing_profile!, profile_state: "UPDATED" },
        },
        loading: false,
        saving: false,
        error: null,
        onSave: vi.fn(),
      }),
    );
    expect(screen.getByText("UPDATED")).toBeTruthy();
    expect(screen.queryByText(/verified|pending verification/i)).toBeNull();
  });
});

describe("FE-B personal notification preferences", () => {
  it.each(["Brand Owner", "Finance Admin", "Campaign Manager"])(
    "%s can edit their own six optional-email preferences",
    async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { container } = render(
        createElement(BrandNotificationsSection, {
          data: notifications,
          loading: false,
          saving: false,
          error: null,
          onSave,
        }),
      );
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(6);
      expect(checkboxes.every((checkbox) => !checkbox.hasAttribute("disabled"))).toBe(true);
      expect(screen.getByText(/Required service, security, legal, and account emails remain enabled/i)).toBeTruthy();
      expect(container.textContent).not.toMatch(/Slack|In-app|Escrow low balance|TDS|budget overrun/i);

      fireEvent.click(checkboxes[0]);
      fireEvent.click(screen.getByRole("button", { name: "Save email preferences" }));
      await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
      expect(onSave.mock.calls[0]?.[0]).toEqual({
        settings: [
          { category: "BILLING_SUBSCRIPTION", optionalEmailEnabled: false },
          { category: "ESCROW_PAYOUTS", optionalEmailEnabled: true },
          { category: "CAMPAIGNS_APPLICATIONS", optionalEmailEnabled: true },
          { category: "COLLABORATIONS", optionalEmailEnabled: true },
          { category: "BRAND_INTELLIGENCE", optionalEmailEnabled: true },
          { category: "TEAM_ACCOUNT_INTEGRATIONS", optionalEmailEnabled: true },
        ],
      });
    },
  );
});
