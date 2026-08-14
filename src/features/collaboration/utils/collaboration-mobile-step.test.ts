import { describe, expect, it } from "vitest";

import { mobileStepForResolvedDeepLink } from "./collaboration-mobile-step";

describe("Mobile deep-link step", () => {
  it("opens Chat after a successful owned deep-link resolution", () => {
    expect(mobileStepForResolvedDeepLink("collab-1", "collab-1", false)).toBe(2);
  });

  it("stays on Inbox when the requested collaboration is unavailable", () => {
    expect(mobileStepForResolvedDeepLink("collab-1", "collab-1", true)).toBe(1);
  });
});
