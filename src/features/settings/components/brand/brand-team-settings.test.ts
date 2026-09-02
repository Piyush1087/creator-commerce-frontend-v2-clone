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
import { BrandTeamSettings } from "./brand-team-settings";
import type {
  BrandGeneralResponse,
  BrandSettingsRole,
} from "../../contracts/brand-settings.contracts";

function data(role: BrandSettingsRole): BrandGeneralResponse {
  return {
    current_user_role: role,
    personal_profile: {
      first_name: null,
      last_name: null,
      email: "actor@example.test",
      avatar_url: null,
    },
    organization: {
      company_legal_name: "Brand",
      corporate_address: null,
      country_code: null,
      currency_code: null,
      tax_id: null,
    },
    brand_identity: {
      display_name: "Brand",
      website_url: null,
      logo_url: null,
      is_locked: true,
    },
    team: {
      members: ["BRAND_OWNER", "FINANCE_ADMIN", "CAMPAIGN_MANAGER"].map(
        (role, index) => ({
          membership_id: `member-${index}`,
          user_id: `user-${index}`,
          name: `Member ${index}`,
          email: `member${index}@example.test`,
          role: role as BrandSettingsRole,
          status: "ACTIVE",
          is_current_user: false,
        }),
      ),
      pending_invitations: ["BRAND_OWNER", "CAMPAIGN_MANAGER"].map(
        (role, index) => ({
          invitation_id: `invite-${index}`,
          email: `invite${index}@example.test`,
          role: role as BrandSettingsRole,
          status: "PENDING",
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        }),
      ),
      seat_usage: { active_members: 3, pending_invitations: 0, max_seats: 5 },
    },
  };
}
function setup(role: BrandSettingsRole = "BRAND_OWNER") {
  const props = {
    data: data(role),
    inviteMember: vi.fn().mockResolvedValue({ delivery_status: "DISPATCHED" }),
    revokeMember: vi.fn().mockResolvedValue(undefined),
    cancelInvitation: vi.fn().mockResolvedValue(undefined),
    changeRole: vi.fn().mockResolvedValue(undefined),
  };
  render(createElement(BrandTeamSettings, props));
  return props;
}
afterEach(cleanup);
describe("BS-02 Team actions", () => {
  it.each(["BRAND_OWNER", "FINANCE_ADMIN", "CAMPAIGN_MANAGER"] as const)(
    "shows permitted actions for %s",
    (role) => {
      setup(role);
      const owner = screen.getByText("Member 0").closest("tr")!;
      const ordinary = screen.getByText("Member 1").closest("tr")!;
      expect(
        within(owner).queryByRole("button", { name: "Revoke access" }),
      ).toBeNull();
      expect(
        within(owner).queryByRole("button", { name: "Change role" }),
      ).toBeNull();
      if (role === "CAMPAIGN_MANAGER") {
        expect(
          screen.queryByRole("button", { name: "Invite new member" }),
        ).toBeNull();
        expect(
          screen.queryByRole("button", { name: "Cancel invite" }),
        ).toBeNull();
        expect(
          within(ordinary).queryByRole("button", { name: "Change role" }),
        ).toBeNull();
      } else
        expect(
          within(ordinary).getByRole("button", { name: "Change role" }),
        ).toBeTruthy();
      expect(screen.queryByText("Resend invitation")).toBeNull();
    },
  );
  it("Finance cannot select Owner for invite or promotion and can change ordinary roles", async () => {
    const props = setup("FINANCE_ADMIN");
    fireEvent.click(screen.getByRole("button", { name: "Invite new member" }));
    expect(
      within(screen.getByLabelText("Workspace role")).queryByRole("option", {
        name: "Brand Owner",
      }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    const row = screen.getByText("Member 2").closest("tr")!;
    fireEvent.click(within(row).getByRole("button", { name: "Change role" }));
    fireEvent.change(screen.getByLabelText("Workspace role"), {
      target: { value: "FINANCE_ADMIN" },
    });
    fireEvent.submit(document.getElementById("brand-team-action")!);
    await waitFor(() =>
      expect(props.changeRole).toHaveBeenCalledWith({
        membershipId: "member-2",
        role: "FINANCE_ADMIN",
      }),
    );
    expect(await screen.findByText("Role updated.")).toBeTruthy();
  });
  it.each([true, false])(
    "invite dispatch success=%s is reported truthfully",
    async (succeeds) => {
      const props = setup();
      if (!succeeds)
        props.inviteMember.mockRejectedValueOnce(
          new Error("Mail dispatch failed"),
        );
      fireEvent.click(
        screen.getByRole("button", { name: "Invite new member" }),
      );
      expect(
        within(screen.getByLabelText("Workspace role")).getByRole("option", {
          name: "Brand Owner",
        }),
      ).toBeTruthy();
      fireEvent.change(screen.getByLabelText("Recipient email"), {
        target: { value: "new@example.test" },
      });
      fireEvent.submit(document.getElementById("brand-team-action")!);
      expect(
        await screen.findByText(
          succeeds ? "Invitation sent." : "Mail dispatch failed",
        ),
      ).toBeTruthy();
      if (!succeeds) expect(screen.queryByText("Invitation sent.")).toBeNull();
    },
  );
  it("Finance can cancel ordinary invitations but not Owner invitations", async () => {
    const props = setup("FINANCE_ADMIN");
    expect(
      screen.getAllByRole("button", { name: "Cancel invite" }),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Cancel invite" }));
    await waitFor(() =>
      expect(props.cancelInvitation).toHaveBeenCalledWith("invite-1"),
    );
    expect(await screen.findByText("Invitation cancelled.")).toBeTruthy();
  });
  it("disables invitation at five used seats and exposes the reason", () => {
    const props = {
      data: data("BRAND_OWNER"),
      inviteMember: vi.fn(),
      revokeMember: vi.fn(),
      cancelInvitation: vi.fn(),
      changeRole: vi.fn(),
    };
    props.data.team.seat_usage = {
      active_members: 3,
      pending_invitations: 2,
      max_seats: 5,
    };
    render(createElement(BrandTeamSettings, props));
    const invite = screen.getByRole("button", { name: "Invite new member" });
    expect((invite as HTMLButtonElement).disabled).toBe(true);
    expect(invite.getAttribute("aria-describedby")).toBe(
      "settings-team-capacity-reason",
    );
    expect(screen.getByText(/seat capacity fully exhausted/)).toBeTruthy();
  });
  it("Owner can manage another Owner when multiple Owners exist", () => {
    const props = {
      data: data("BRAND_OWNER"),
      inviteMember: vi.fn(),
      revokeMember: vi.fn(),
      cancelInvitation: vi.fn(),
      changeRole: vi.fn(),
    };
    props.data.team.members[1].role = "BRAND_OWNER";
    render(createElement(BrandTeamSettings, props));
    expect(
      within(screen.getByText("Member 0").closest("tr")!).getByRole("button", {
        name: "Change role",
      }),
    ).toBeTruthy();
  });
  it.each([
    [
      "TEAM_ANCHOR_OWNER_REQUIRED",
      "At least one Brand-domain employee Owner must remain.",
    ],
    [
      "TEAM_ANCHOR_AUTHORITY_UNRESOLVED",
      "Brand-domain Owner authority could not be resolved.",
    ],
  ])("shows backend anchor failure %s", async (_code, backendMessage) => {
    const props = setup();
    props.changeRole.mockRejectedValueOnce(new Error(backendMessage));
    fireEvent.click(
      within(screen.getByText("Member 1").closest("tr")!).getByRole("button", {
        name: "Change role",
      }),
    );
    fireEvent.submit(document.getElementById("brand-team-action")!);
    expect(await screen.findByText(backendMessage)).toBeTruthy();
  });
});
