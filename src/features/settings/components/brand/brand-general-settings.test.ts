// @vitest-environment jsdom
import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrandGeneralSettings } from "./brand-general-settings";
import type {
  BrandGeneralResponse,
  UpdateBrandGeneralPayload,
} from "../../contracts/brand-settings.contracts";

vi.mock("../../../../shared/auth/auth-session", () => ({
  authAuthorizationHeader: () => ({}),
}));
vi.mock("../../../../shared/config/env", () => ({
  env: { apiUrl: "http://localhost:3000" },
}));

let data: BrandGeneralResponse;
let failSave = false;
const fetchMock = vi.fn();
const response = (body: unknown, ok = true) => ({
  ok,
  text: async () => JSON.stringify(body),
});
const input = (label: string) =>
  screen.getByLabelText(label, { exact: false }) as HTMLInputElement;
const patches = () =>
  fetchMock.mock.calls.filter(
    ([, init]) => (init as RequestInit).method === "PATCH",
  );

beforeEach(() => {
  failSave = false;
  data = {
    current_user_role: "BRAND_OWNER",
    personal_profile: {
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.test",
      avatar_url: null,
    },
    organization: {
      company_legal_name: "Legal Ltd",
      corporate_address: null,
      country_code: "IN",
      currency_code: "INR",
      tax_id: null,
    },
    brand_identity: {
      display_name: "Protected Brand",
      website_url: "brand.example.test",
      logo_url: null,
      is_locked: true,
    },
    team: {
      members: [
        {
          membership_id: "owner",
          user_id: "ada",
          name: "Ada Lovelace",
          email: "ada@example.test",
          role: "BRAND_OWNER",
          status: "ACTIVE",
          is_current_user: true,
        },
      ],
      pending_invitations: [],
      seat_usage: { active_members: 1, pending_invitations: 0, max_seats: 5 },
    },
  };
  fetchMock
    .mockReset()
    .mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith("/general") && init.method === "PATCH") {
        if (failSave) return response({ message: "Save rejected" }, false);
        const patch = JSON.parse(
          init.body as string,
        ) as UpdateBrandGeneralPayload;
        data = {
          ...data,
          personal_profile: {
            ...data.personal_profile,
            first_name: patch.firstName ?? data.personal_profile.first_name,
            last_name: patch.lastName ?? data.personal_profile.last_name,
          },
          organization: {
            ...data.organization,
            company_legal_name:
              patch.organizationLegalName ??
              data.organization.company_legal_name,
          },
        };
        return response(data);
      }
      if (url.endsWith("/general") && init.method === "GET")
        return response(data);
      if (url.endsWith("/team/invite") && init.method === "POST")
        return response({ delivery_status: "DISPATCHED" });
      throw new Error(`Unexpected request: ${init.method} ${url}`);
    });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function mount() {
  const rendered = render(createElement(BrandGeneralSettings));
  await screen.findByLabelText("First name");
  return rendered;
}

describe("BS-01 General Settings", () => {
  it("loads authoritative values and keeps email, country, currency and Brand identity read-only", async () => {
    await mount();
    expect(input("First name").value).toBe("Ada");
    expect(input("Last name").value).toBe("Lovelace");
    expect(input("First name").disabled).toBe(false);
    expect(input("Last name").disabled).toBe(false);
    expect(input("Company legal name").value).toBe("Legal Ltd");
    for (const [label, value] of [
      ["Account email address", "ada@example.test"],
      ["Country location (ISO)", "IN"],
      ["Default operating currency (ISO)", "INR"],
      ["Display brand name", "Protected Brand"],
      ["Parent website URL", "brand.example.test"],
    ]) {
      expect(input(label).value).toBe(value);
      expect(input(label).readOnly).toBe(true);
      expect(input(label).disabled).toBe(true);
    }
  });
  it("has no editable address/tax, fake avatar upload, or password-change affordance", async () => {
    const { container } = await mount();
    expect(
      screen.queryByLabelText(/corporate address|tax id|vat number/i),
    ).toBeNull();
    expect(screen.queryByLabelText(/profile image upload/i)).toBeNull();
    expect(
      screen.queryByText(
        /drag.*drop|click to browse|update password|login security/i,
      ),
    ).toBeNull();
    expect(
      container.querySelector(
        'input[type="file"], input[type="password"], .settings-avatar-upload',
      ),
    ).toBeNull();
    expect(
      screen.getByText(
        /Billing address and tax details belong to the Billing profile/,
      ),
    ).toBeTruthy();
  });
  it.each(["BRAND_OWNER", "FINANCE_ADMIN"] as const)(
    "%s saves only the three allowed fields and leaves Brand identity unchanged",
    async (role) => {
      data.current_user_role = role;
      await mount();
      expect(input("Company legal name").disabled).toBe(false);
      fireEvent.change(input("First name"), { target: { value: "Grace" } });
      fireEvent.change(input("Last name"), { target: { value: "Hopper" } });
      fireEvent.change(input("Company legal name"), {
        target: { value: "New Legal Ltd" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Save workspace changes" }),
      );
      await waitFor(() => expect(patches()).toHaveLength(1));
      expect(
        JSON.parse((patches()[0][1] as RequestInit).body as string),
      ).toEqual({
        firstName: "Grace",
        lastName: "Hopper",
        organizationLegalName: "New Legal Ltd",
      });
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: "Save workspace changes" }),
        ).toBeNull(),
      );
      expect(input("Display brand name").value).toBe("Protected Brand");
      expect(input("Country location (ISO)").value).toBe("IN");
      expect(input("Default operating currency (ISO)").value).toBe("INR");
      expect(screen.getByText("Team management")).toBeTruthy();
    },
  );
  it("preserves the existing Campaign Manager save policy", async () => {
    data.current_user_role = "CAMPAIGN_MANAGER";
    await mount();
    expect(input("Company legal name").disabled).toBe(true);
    fireEvent.change(input("First name"), { target: { value: "Changed" } });
    expect(
      (
        screen.getByRole("button", {
          name: "Save workspace changes",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(patches()).toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: "Invite new member" }),
    ).toBeNull();
  });
  it("discards edits without a mutation", async () => {
    await mount();
    fireEvent.change(input("First name"), { target: { value: "Changed" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel & discard changes" }),
    );
    expect(input("First name").value).toBe("Ada");
    expect(patches()).toHaveLength(0);
  });
  it("shows save failure and retains unsaved values", async () => {
    failSave = true;
    await mount();
    fireEvent.change(input("Company legal name"), {
      target: { value: "Unsaved Ltd" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save workspace changes" }),
    );
    expect(await screen.findByText("Save rejected")).toBeTruthy();
    expect(input("Company legal name").value).toBe("Unsaved Ltd");
    expect(
      screen.getByRole("button", { name: "Save workspace changes" }),
    ).toBeTruthy();
  });
  it("keeps the real Team component and invitation action functional on General", async () => {
    await mount();
    expect(screen.getByText("Team management")).toBeTruthy();
    expect(screen.getAllByText("Ada Lovelace").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Invite new member" }));
    fireEvent.change(screen.getByLabelText("Recipient email"), {
      target: { value: "new@example.test" },
    });
    fireEvent.submit(document.getElementById("brand-team-action")!);
    expect(
      await screen.findByText("Invitation email dispatched."),
    ).toBeTruthy();
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          String(url).endsWith("/team/invite") &&
          (init as RequestInit).method === "POST",
      ),
    ).toBe(true);
    expect(patches()).toHaveLength(0);
  });
});
