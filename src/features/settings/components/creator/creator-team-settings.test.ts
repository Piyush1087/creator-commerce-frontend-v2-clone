// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

import type {
  CreatorTeamResponse,
  CreatorTeamRole,
} from "../../contracts/creator-team.contracts";
import { CreatorTeamSettings } from "./creator-team-settings";

const managementActions = [
  "WORKSPACE_PROFILE_READ",
  "WORKSPACE_PROFILE_MANAGE",
  "CONTACT_READ",
  "CONTACT_MANAGE",
  "TEAM_READ",
  "TEAM_MANAGE",
  "INSTAGRAM_SETTINGS_READ",
  "INSTAGRAM_SETTINGS_MANAGE",
  "PAYOUT_SETTINGS_READ",
  "PAYOUT_SETTINGS_MANAGE",
  "LEGAL_PROFILE_READ",
  "LEGAL_PROFILE_MANAGE",
] as const;

function data(actorRole: CreatorTeamRole = "OWNER"): CreatorTeamResponse {
  return {
    actor: {
      user_id: `${actorRole.toLowerCase()}-user`,
      membership_id: `${actorRole.toLowerCase()}-member`,
      role: actorRole,
      allowed_actions: actorRole === "ASSISTANT" ? [] : [...managementActions],
    },
    workspace: {
      workspace_id: "workspace-id",
      organization_name: "Canonical Creator Studio",
      subject_creator_profile_id: "owner-profile",
    },
    team: {
      members: [
        {
          membership_id: "owner-member",
          user_id: "owner-user",
          name: "Owner Creator",
          email: "owner@example.test",
          role: "OWNER",
          status: "ACTIVE",
          is_current_actor: actorRole === "OWNER",
          is_owner: true,
          can_change_role: false,
          can_remove: false,
        },
        {
          membership_id: "manager-member",
          user_id: "manager-user",
          name: "Manager With An Extremely Long International Display Name",
          email: "manager.with.a.very.long.international.identity@example.test",
          role: "MANAGER",
          status: "ACTIVE",
          is_current_actor: actorRole === "MANAGER",
          is_owner: false,
          can_change_role: actorRole !== "MANAGER",
          can_remove: actorRole !== "MANAGER",
        },
        {
          membership_id: "unresolved-member",
          user_id: null,
          name: null,
          email: "historical.metadata@example.test",
          role: "ASSISTANT",
          status: "UNRESOLVED",
          is_current_actor: false,
          is_owner: false,
          can_change_role: true,
          can_remove: true,
        },
      ],
      pending_invitations: [
        {
          invitation_id: "pending-invite",
          email: "pending@example.test",
          role: "ASSISTANT",
          status: "PENDING",
          expires_at: "2026-09-08T12:00:00.000Z",
          can_cancel: true,
        },
      ],
      seat_usage: {
        active_members: 3,
        pending_invitations: 1,
        max_seats: 5,
        is_at_capacity: false,
      },
    },
  };
}

function setup(actorRole: CreatorTeamRole = "OWNER") {
  const props = {
    data: data(actorRole),
    inviteMember: vi.fn().mockResolvedValue(undefined),
    changeRole: vi.fn().mockResolvedValue(undefined),
    removeMember: vi.fn().mockResolvedValue(undefined),
    cancelInvitation: vi.fn().mockResolvedValue(undefined),
  };
  render(createElement(CreatorTeamSettings, props));
  return props;
}

afterEach(cleanup);

describe("C05 Creator Team Settings", () => {
  it.each(["OWNER", "MANAGER"] as const)(
    "allows %s to manage non-Owner membership but protects Owner controls",
    (actorRole) => {
      setup(actorRole);
      expect(
        screen.getByRole("button", { name: "Invite team member" }),
      ).toBeTruthy();
      const ownerRow = screen
        .getByText("Owner Creator")
        .closest('[role="row"]') as HTMLElement;
      expect(within(ownerRow).getByText("Owner protected")).toBeTruthy();
      expect(
        within(ownerRow).queryByRole("button", { name: "Change role" }),
      ).toBeNull();
    },
  );

  it("keeps Assistant Team membership and identity data inaccessible", () => {
    setup("ASSISTANT");
    expect(screen.getByText("Team settings unavailable")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("owner@example.test")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Invite team member" }),
    ).toBeNull();
  });

  it("labels unresolved email-only rows as non-authorizing", () => {
    setup();
    expect(screen.getByText("Unresolved — no User access")).toBeTruthy();
    expect(screen.getByText("historical.metadata@example.test")).toBeTruthy();
  });

  it("never offers Owner as an invite or role-change option", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Invite team member" }));
    const select = screen.getByLabelText("Workspace role");
    const options = within(select).getAllByRole(
      "option",
    ) as HTMLOptionElement[];
    expect(options).toHaveLength(2);
    expect(options.map((option) => option.value)).toEqual([
      "MANAGER",
      "ASSISTANT",
    ]);
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
  });

  it("submits normalized invite and role actions through bounded callbacks", async () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: "Invite team member" }));
    fireEvent.change(screen.getByRole("textbox", { name: /^Recipient email/ }), {
      target: { value: "  person@example.test  " },
    });
    fireEvent.change(screen.getByLabelText("Workspace role"), {
      target: { value: "MANAGER" },
    });
    fireEvent.submit(document.getElementById("creator-team-action-form")!);
    await waitFor(() =>
      expect(props.inviteMember).toHaveBeenCalledWith({
        recipientEmail: "person@example.test",
        allocatedRole: "MANAGER",
      }),
    );
    expect(await screen.findByText("Invitation sent.")).toBeTruthy();

    const managerRow = screen
      .getByText(/Manager With An Extremely Long/)
      .closest('[role="row"]') as HTMLElement;
    fireEvent.click(
      within(managerRow).getByRole("button", { name: "Change role" }),
    );
    fireEvent.change(screen.getByLabelText("Workspace role"), {
      target: { value: "ASSISTANT" },
    });
    fireEvent.submit(document.getElementById("creator-team-action-form")!);
    await waitFor(() =>
      expect(props.changeRole).toHaveBeenCalledWith(
        "manager-member",
        "ASSISTANT",
      ),
    );
  });

  it("disables admission at five seats and exposes an accessible reason", () => {
    const props = {
      data: data(),
      inviteMember: vi.fn(),
      changeRole: vi.fn(),
      removeMember: vi.fn(),
      cancelInvitation: vi.fn(),
    };
    props.data.team.seat_usage = {
      active_members: 4,
      pending_invitations: 1,
      max_seats: 5,
      is_at_capacity: true,
    };
    render(createElement(CreatorTeamSettings, props));
    const invite = screen.getByRole("button", { name: "Invite team member" });
    expect((invite as HTMLButtonElement).disabled).toBe(true);
    expect(invite.getAttribute("aria-describedby")).toBe(
      "creator-team-capacity-warning",
    );
    expect(screen.getByText("Workspace is at capacity")).toBeTruthy();
  });

  it("supports Escape dismissal and focus-safe Aurora drawer semantics", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Invite team member" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ships table-to-card, bottom-sheet, long-value, and full-width mobile seams", () => {
    const css = readFileSync(
      join(
        process.cwd(),
        "src/features/settings/components/creator/creator-team-settings.css",
      ),
      "utf8",
    );
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toMatch(/creator-team-roster__row\s*{[\s\S]*display: block/);
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toContain(":has(.creator-team-drawer__form)");
    expect(css).toContain("height: min(92vh, 48rem)");
    expect(css).toMatch(/creator-team-drawer__footer[\s\S]*width: 100%/);
  });
});
