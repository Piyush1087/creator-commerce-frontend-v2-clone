import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { AUTH_ROUTES } from "../../auth/constants";
import {
  getSidebarNavItemsForRole,
  resolveHeaderMeta,
} from "../../../layouts/app-shell/sidebar-items";
import { creatorBottomNavItems } from "../../../layouts/app-shell/bottom-nav-items";
describe("Commercial Setup shell", () => {
  it.each(["OWNER", "MANAGER", "ASSISTANT"] as const)(
    "uses explicit source-independent %s action",
    (actorRole) => {
      const item = getSidebarNavItemsForRole("CREATOR", {
        status: "READY",
        actorContext: {
          actorRole,
          actorUserId: "actor",
          actorMembershipId: "member",
          workspaceId: "workspace",
          organizationId: "organization",
          subjectCreatorProfileId: "owner",
          subjectOwnerUserId: "owner-user",
          allowedActions: ["COMMERCIAL_SETUP_READ"],
        },
      }).find((item) => item.path === AUTH_ROUTES.creatorCommercialSetup);
      expect(item).toMatchObject({
        availability: "AVAILABLE",
        requiredCreatorAction: "COMMERCIAL_SETUP_READ",
      });
    },
  );
  it("has no sixth bottom item and is outside the Instagram/platform gate", () => {
    expect(creatorBottomNavItems).toHaveLength(5);
    expect(
      resolveHeaderMeta(AUTH_ROUTES.creatorCommercialSetup, "CREATOR"),
    ).toEqual({ breadcrumb: "Commercial Setup", title: "Commercial Setup" });
    const routes = readFileSync(
      new URL("../../../routes/app-routes.tsx", import.meta.url),
      "utf8",
    );
    expect(
      routes.indexOf("path={AUTH_ROUTES.creatorCommercialSetup}"),
    ).toBeLessThan(
      routes.indexOf("<Route element={<RequireCreatorPlatformAccess />}>"),
    );
    expect(
      getSidebarNavItemsForRole("CREATOR", {
        status: "LOADING",
        actorContext: null,
      }).find((item) => item.path === AUTH_ROUTES.creatorCommercialSetup)
        ?.availability,
    ).toBe("UNAVAILABLE");
  });
});
