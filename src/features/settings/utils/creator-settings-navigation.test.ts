import { describe, expect, it } from "vitest";

import type { CreatorWorkspaceActorContext } from "../../../shared/creator/creator-workspace-actor.contract";
import { getCreatorSettingsNavigation } from "./creator-settings-navigation";

const owner: CreatorWorkspaceActorContext = {
  actorUserId: "owner-user",
  actorMembershipId: "owner-member",
  actorRole: "OWNER",
  workspaceId: "workspace-1",
  organizationId: "organization-1",
  subjectCreatorProfileId: "profile-1",
  subjectOwnerUserId: "owner-user",
  allowedActions: [
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
  ],
};

describe("Creator Settings navigation", () => {
  it("projects every frozen Owner settings section", () => {
    expect(
      getCreatorSettingsNavigation({
        status: "READY",
        actorContext: owner,
      }).map((item) => item.label),
    ).toEqual([
      "Account & Security",
      "Profile & Contact",
      "Team",
      "Instagram",
      "Payouts & Legal",
    ]);
  });

  it("shows an Assistant only personal Account & Security", () => {
    expect(
      getCreatorSettingsNavigation({
        status: "READY",
        actorContext: { ...owner, actorRole: "ASSISTANT", allowedActions: [] },
      }).map((item) => item.label),
    ).toEqual(["Account & Security"]);
  });

  it("keeps account security available and disables workspace settings in recovery", () => {
    const items = getCreatorSettingsNavigation({
      status: "RECOVERY",
      actorContext: null,
      reason: "Workspace unavailable.",
    });

    expect(items[0]).toMatchObject({
      label: "Account & Security",
      availability: "AVAILABLE",
    });
    expect(
      items.slice(1).every((item) => item.availability === "UNAVAILABLE"),
    ).toBe(true);
  });
});
