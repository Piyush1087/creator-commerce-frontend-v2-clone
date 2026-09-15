import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AUTH_ROUTES } from "../../auth/constants";
import {
  getSidebarNavItemsForRole,
  isSidebarNavItemActive,
  resolveHeaderMeta,
} from "../../../layouts/app-shell/sidebar-items";
import { creatorBottomNavItems } from "../../../layouts/app-shell/bottom-nav-items";
import type { CreatorWorkspaceActorContext } from "../../../shared/creator/creator-workspace-actor.contract";
describe("Creator Brand source-independent navigation", () => {
  it.each(["OWNER", "MANAGER", "ASSISTANT"] as const)(
    "projects active %s READ without source context",
    (actorRole) => {
      const actorContext: CreatorWorkspaceActorContext = {
        actorUserId: "actor",
        actorMembershipId: "member",
        actorRole,
        workspaceId: "workspace",
        organizationId: "organization",
        subjectCreatorProfileId: "owner-profile",
        subjectOwnerUserId: "owner-user",
        allowedActions: ["CREATOR_BRAND_READ"],
      };
      const item = getSidebarNavItemsForRole("CREATOR", {
        status: "READY",
        actorContext,
      }).find((entry) => entry.path === AUTH_ROUTES.creatorBrand);
      expect(item).toMatchObject({
        availability: "AVAILABLE",
        requiredCreatorAction: "CREATOR_BRAND_READ",
      });
    },
  );
  it("fails closed during recovery and loading", () => {
    for (const state of [
      { status: "LOADING", actorContext: null } as const,
      {
        status: "RECOVERY",
        actorContext: null,
        reason: "Inactive membership",
      } as const,
    ])
      expect(
        getSidebarNavItemsForRole("CREATOR", state).find(
          (entry) => entry.path === AUTH_ROUTES.creatorBrand,
        )?.availability,
      ).toBe("UNAVAILABLE");
  });
  it("keeps exactly five bottom destinations and no active Insights", () => {
    expect(creatorBottomNavItems.map((entry) => entry.label)).toEqual([
      "Home",
      "Insights",
      "Campaigns",
      "Collaborations",
      "Settings",
    ]);
    expect(
      isSidebarNavItemActive(
        AUTH_ROUTES.creatorBrand,
        AUTH_ROUTES.creatorAudience,
      ),
    ).toBe(false);
    expect(
      isSidebarNavItemActive(
        AUTH_ROUTES.creatorBrand,
        AUTH_ROUTES.creatorBrand,
      ),
    ).toBe(true);
    expect(resolveHeaderMeta(AUTH_ROUTES.creatorBrand, "CREATOR")).toEqual({
      breadcrumb: "Creator Brand",
      title: "Creator Brand",
    });
  });
  it("places Brand outside the existing source-dependent guard", () => {
    const routes = readFileSync(
      new URL("../../../routes/app-routes.tsx", import.meta.url),
      "utf8",
    );
    const brand = routes.indexOf("path={AUTH_ROUTES.creatorBrand}");
    const platform = routes.indexOf(
      "<Route element={<RequireCreatorPlatformAccess />}>",
    );
    expect(brand).toBeGreaterThan(0);
    expect(brand).toBeLessThan(platform);
    expect(routes.slice(brand, platform)).toContain("<CreatorBrandRouteGuard>");
    expect(routes.slice(platform)).toContain("AUTH_ROUTES.creatorContent");
  });
});
