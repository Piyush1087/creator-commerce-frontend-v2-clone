// @vitest-environment jsdom
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
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

vi.mock("../../../../shared/auth/auth-session", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../../../shared/auth/auth-session")
  >()),
  getAccessToken: () => "settings-test-token",
  getAuthSessionSnapshot: () => ({ status: "AUTHENTICATED" }),
  refreshAuthSession: vi.fn(),
}));
vi.mock("../../../../shared/config/env", () => ({
  env: { apiUrl: "http://localhost:3000" },
}));

let data: BrandGeneralResponse;
let failSave = false;
let failLoadStatus: number | null = null;
const fetchMock = vi.fn();
const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
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
  failLoadStatus = null;
  data = {
    current_user_role: "BRAND_OWNER",
    personal_profile: {
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.test",
      avatar_url: null,
    },
    organization: {
      company_legal_name: "Workspace Organization",
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
        if (failSave) return response({ message: "Save rejected" }, 500);
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
      if (url.endsWith("/general") && init.method === "GET") {
        if (failLoadStatus)
          return response(
            { message: "Active Brand team membership required." },
            failLoadStatus,
          );
        return response(data);
      }
      if (url.endsWith("/auth/me") && init.method === "GET")
        return response({
          id: "ada",
          email: "ada@example.test",
          name: "Ada Lovelace",
          role: "BRAND",
          authState: "ACTIVE",
          authMethods: [
            { type: "PASSWORD", verifiedAt: "2026-08-30T00:00:00.000Z" },
          ],
          brandMemberships: [
            {
              brandProfileId: "brand",
              role: data.current_user_role,
              isActive: true,
            },
          ],
        });
      if (url.endsWith("/team/invite") && init.method === "POST")
        return response({ delivery_status: "DISPATCHED" });
      if (url.includes("/team/invitations/") && init.method === "DELETE") {
        data = {
          ...data,
          team: {
            ...data.team,
            pending_invitations: [],
            seat_usage: {
              ...data.team.seat_usage,
              pending_invitations: 0,
            },
          },
        };
        return response({ status: "CANCELLED" });
      }
      throw new Error(`Unexpected request: ${init.method} ${url}`);
    });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function mount() {
  const rendered = render(
    createElement(MemoryRouter, null, createElement(BrandGeneralSettings)),
  );
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
    expect(input("Organization name").value).toBe("Workspace Organization");
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
  it("keeps unrelated identity fields out while composing Account security", async () => {
    const { container } = await mount();
    expect(
      screen.queryByLabelText(/corporate address|tax id|vat number/i),
    ).toBeNull();
    expect(screen.queryByLabelText(/profile image upload/i)).toBeNull();
    expect(screen.queryByText(/drag.*drop|click to browse/i)).toBeNull();
    expect(
      container.querySelector('input[type="file"], .settings-avatar-upload'),
    ).toBeNull();
    expect(screen.getByText("Account security")).toBeTruthy();
    expect(
      await screen.findByRole("button", { name: "Change password" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Registered legal entity, billing address, and tax details belong to Billing/,
      ),
    ).toBeTruthy();
  });
  it.each(["BRAND_OWNER", "FINANCE_ADMIN"] as const)(
    "%s saves only the three allowed fields and leaves Brand identity unchanged",
    async (role) => {
      data.current_user_role = role;
      await mount();
      expect(input("Organization name").disabled).toBe(false);
      fireEvent.change(input("First name"), { target: { value: "Grace" } });
      fireEvent.change(input("Last name"), { target: { value: "Hopper" } });
      fireEvent.change(input("Organization name"), {
        target: { value: "New Workspace Name" },
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
        organizationLegalName: "New Workspace Name",
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
  it("allows Campaign Manager personal save without an Organization mutation", async () => {
    data.current_user_role = "CAMPAIGN_MANAGER";
    await mount();
    expect(input("First name").disabled).toBe(false);
    expect(input("Last name").disabled).toBe(false);
    expect(input("Organization name").disabled).toBe(true);
    expect(input("Organization name").readOnly).toBe(true);
    fireEvent.change(input("First name"), { target: { value: "Changed" } });
    const save = screen.getByRole("button", { name: "Save workspace changes" });
    expect((save as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(save);
    await waitFor(() => expect(patches()).toHaveLength(1));
    const payload = JSON.parse(
      (patches()[0][1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    expect(payload).toEqual({ firstName: "Changed", lastName: "Lovelace" });
    expect(payload).not.toHaveProperty("organizationLegalName");
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
    fireEvent.change(input("Organization name"), {
      target: { value: "Unsaved Ltd" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save workspace changes" }),
    );
    expect(await screen.findByText("Save rejected")).toBeTruthy();
    expect(input("Organization name").value).toBe("Unsaved Ltd");
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
    expect(await screen.findByText("Invitation sent.")).toBeTruthy();
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          String(url).endsWith("/team/invite") &&
          (init as RequestInit).method === "POST",
      ),
    ).toBe(true);
    expect(patches()).toHaveLength(0);
  });
  it("returns invitation capacity after cancelling a pending seat and refetching", async () => {
    data.team.pending_invitations = [
      {
        invitation_id: "pending-1",
        email: "pending@example.test",
        role: "CAMPAIGN_MANAGER",
        status: "PENDING",
        expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      },
    ];
    data.team.seat_usage = {
      active_members: 4,
      pending_invitations: 1,
      max_seats: 5,
    };
    await mount();
    const invite = screen.getByRole("button", { name: "Invite new member" });
    expect((invite as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Cancel invite" }));
    expect(await screen.findByText("Invitation cancelled.")).toBeTruthy();
    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Invite new member",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
    expect(
      fetchMock.mock.calls.filter(
        ([url, init]) =>
          String(url).endsWith("/general") &&
          (init as RequestInit).method === "GET",
      ),
    ).toHaveLength(2);
  });
  it("shows workspace denial on 403 without converting it into an auth redirect", async () => {
    failLoadStatus = 403;
    render(
      createElement(MemoryRouter, null, createElement(BrandGeneralSettings)),
    );
    expect(
      await screen.findByText("Workspace access unavailable"),
    ).toBeTruthy();
    expect(
      screen.getByText(/Active Brand team membership required/),
    ).toBeTruthy();
    expect(screen.queryByText(/sign in again/i)).toBeNull();
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/general")),
    ).toHaveLength(1);
  });
});
