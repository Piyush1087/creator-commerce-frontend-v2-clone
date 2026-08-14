import { describe, expect, it } from "vitest";

import { AUTH_ROUTES } from "../../features/auth/constants";
import { creatorBottomNavItems } from "./bottom-nav-items";

describe("Creator mobile bottom navigation", () => {
  it("exposes Collaborations and removes Insights from the four-slot nav", () => {
    expect(creatorBottomNavItems.map((item) => item.label)).toEqual([
      "Home",
      "Campaigns",
      "Collaborations",
      "Profile",
    ]);
    expect(
      creatorBottomNavItems.find((item) => item.label === "Collaborations")?.path,
    ).toBe(AUTH_ROUTES.creatorCollaborations);
    expect(creatorBottomNavItems.some((item) => item.label === "Insights")).toBe(
      false,
    );
  });
});
