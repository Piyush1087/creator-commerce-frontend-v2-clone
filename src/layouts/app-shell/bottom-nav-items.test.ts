import { describe, expect, it } from "vitest";

import { AUTH_ROUTES } from "../../features/auth/constants";
import { creatorBottomNavItems } from "./bottom-nav-items";

describe("Creator mobile bottom navigation", () => {
  it("uses the accepted Creator navigation with Audience Insights", () => {
    expect(creatorBottomNavItems.map((item) => item.label)).toEqual([
      "Home",
      "Insights",
      "Campaigns",
      "Collaborations",
      "Settings",
    ]);
    expect(
      creatorBottomNavItems.find((item) => item.label === "Collaborations")
        ?.path,
    ).toBe(AUTH_ROUTES.creatorCollaborations);
    expect(
      creatorBottomNavItems.find((item) => item.label === "Settings")?.path,
    ).toBe(AUTH_ROUTES.creatorSettings);
    expect(
      creatorBottomNavItems.find((item) => item.label === "Insights")?.path,
    ).toBe(AUTH_ROUTES.creatorAudience);
    expect(
      creatorBottomNavItems.some((item) => item.label === "Marketplace"),
    ).toBe(false);
  });
});
