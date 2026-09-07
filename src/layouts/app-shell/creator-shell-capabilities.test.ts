import { describe, expect, it } from "vitest";

import type { CreatorWorkspaceActorContext } from "../../shared/creator/creator-workspace-actor.contract";
import {
  creatorBottomNavItems,
  getBottomNavItemsForRole,
} from "./bottom-nav-items";
import {
  projectCreatorShellItems,
  type CreatorShellState,
} from "./creator-shell-capabilities";
import { getSidebarNavItemsForRole, resolveHeaderMeta } from "./sidebar-items";

const manager: CreatorWorkspaceActorContext = {
  actorUserId: "manager-user",
  actorMembershipId: "manager-member",
  actorRole: "MANAGER",
  workspaceId: "workspace-1",
  organizationId: "organization-1",
  subjectCreatorProfileId: "creator-profile-1",
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

describe("Creator shell capability projection", () => {
  it("treats an unresolved integrated shell as loading and non-actionable", () => {
    const items = getSidebarNavItemsForRole("CREATOR");
    expect(items.find((item) => item.label === "Payouts")).toMatchObject({
      availability: "UNAVAILABLE",
      unavailableReason: "Loading creator workspace access…",
    });
    expect(
      getBottomNavItemsForRole("CREATOR").every(
        (item) => item.availability === "UNAVAILABLE",
      ),
    ).toBe(true);
  });

  it("exposes the exact expanded MVP navigation and no Marketplace", () => {
    const labels = getSidebarNavItemsForRole("CREATOR", {
      status: "READY",
      actorContext: manager,
    }).map((item) => item.label);

    expect(labels).toEqual([
      "Home",
      "Campaigns",
      "Collaborations",
      "Creator Center",
      "Payouts",
      "Settings",
    ]);
    expect(labels).not.toContain("Marketplace");
    expect(labels).not.toContain("Insights");
  });

  it("keeps the exact four mobile destinations", () => {
    expect(
      getBottomNavItemsForRole("CREATOR", {
        status: "READY",
        actorContext: manager,
      }).map((item) => item.label),
    ).toEqual(["Home", "Campaigns", "Collaborations", "Creator Center"]);
  });

  it("hides payout navigation when the actor lacks payout read authority", () => {
    const assistant: CreatorWorkspaceActorContext = {
      ...manager,
      actorRole: "ASSISTANT",
      allowedActions: [],
    };
    const labels = getSidebarNavItemsForRole("CREATOR", {
      status: "READY",
      actorContext: assistant,
    }).map((item) => item.label);

    expect(labels).not.toContain("Payouts");
    expect(labels).toContain("Settings");
  });

  it("fails closed while direct actor context is loading", () => {
    const items = getSidebarNavItemsForRole("CREATOR", {
      status: "LOADING",
      actorContext: null,
    });

    expect(items.find((item) => item.label === "Payouts")).toMatchObject({
      availability: "UNAVAILABLE",
      unavailableReason: "Loading creator workspace access…",
    });
    expect(items.find((item) => item.label === "Settings")?.availability).toBe(
      "AVAILABLE",
    );
  });

  it("preserves Settings and truthfully disables workspace routes in recovery", () => {
    const recovery: CreatorShellState = {
      status: "RECOVERY",
      actorContext: null,
      reason: "Creator workspace provisioning is incomplete.",
    };
    const items = getSidebarNavItemsForRole("CREATOR", recovery);

    expect(items.find((item) => item.label === "Settings")?.availability).toBe(
      "AVAILABLE",
    );
    expect(items.find((item) => item.label === "Home")).toMatchObject({
      availability: "UNAVAILABLE",
      unavailableReason: "Creator workspace provisioning is incomplete.",
    });
    expect(
      getBottomNavItemsForRole("CREATOR", recovery).every(
        (item) => item.availability === "UNAVAILABLE",
      ),
    ).toBe(true);
  });

  it("does not mutate the frozen navigation definitions", () => {
    projectCreatorShellItems(creatorBottomNavItems, {
      status: "RECOVERY",
      actorContext: null,
      reason: "Unavailable",
    });
    expect(creatorBottomNavItems.every((item) => !item.availability)).toBe(
      true,
    );
  });

  it("uses shared Settings and Creator Center header language", () => {
    expect(resolveHeaderMeta("/creator/centre", "CREATOR")).toEqual({
      breadcrumb: "Creator Center",
      title: "Creator Center",
    });
    expect(resolveHeaderMeta("/creator/settings/account", "CREATOR")).toEqual({
      breadcrumb: "Settings",
      title: "Account & Security",
    });
    expect(resolveHeaderMeta("/creator/settings", "CREATOR")).toEqual({
      breadcrumb: "Settings",
      title: "Account & Security",
    });
    expect(resolveHeaderMeta("/creator/settings/profile", "CREATOR")).toEqual({
      breadcrumb: "Settings",
      title: "Profile & Contact",
    });
    expect(resolveHeaderMeta("/creator/settings/instagram", "CREATOR")).toEqual(
      {
        breadcrumb: "Settings",
        title: "Instagram",
      },
    );
  });
});
