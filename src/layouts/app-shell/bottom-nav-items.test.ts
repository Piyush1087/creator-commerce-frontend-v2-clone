import { describe, expect, it } from "vitest";

import { AUTH_ROUTES } from "../../features/auth/constants";
import { creatorBottomNavItems } from "./bottom-nav-items";

describe("Creator mobile bottom navigation", () => {
  it("uses the frozen four-slot Creator navigation", () => {
    expect(creatorBottomNavItems.map((item) => item.label)).toEqual([
      "Home",
      "Campaigns",
      "Collaborations",
      "Creator Center",
    ]);
    expect(
      creatorBottomNavItems.find((item) => item.label === "Collaborations")
        ?.path,
    ).toBe(AUTH_ROUTES.creatorCollaborations);
    expect(
      creatorBottomNavItems.find((item) => item.label === "Creator Center")
        ?.path,
    ).toBe(AUTH_ROUTES.creatorCentre);
    expect(
      creatorBottomNavItems.some((item) => item.label === "Insights"),
    ).toBe(false);
    expect(
      creatorBottomNavItems.some((item) => item.label === "Marketplace"),
    ).toBe(false);
  });
});
