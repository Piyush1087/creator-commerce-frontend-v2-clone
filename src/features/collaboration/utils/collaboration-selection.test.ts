import { describe, expect, it } from "vitest";

import {
  collaborationThreadParams,
  readCollaborationQuerySelection,
  resolveInboxSelection,
} from "./collaboration-selection";

describe("Collaboration deep-link selection", () => {
  it("keeps an owned requested id even when it is outside inbox rows", () => {
    expect(resolveInboxSelection(["first"], null, "owned-outside-page")).toBe(
      "owned-outside-page",
    );
  });

  it("never falls back to the first row for a requested id", () => {
    expect(resolveInboxSelection(["first"], null, "missing-or-no-access")).toBe(
      "missing-or-no-access",
    );
  });

  it("accepts thread before the legacy collaboration query parameter", () => {
    expect(
      readCollaborationQuerySelection(
        new URLSearchParams("thread=current&collaboration=legacy"),
      ),
    ).toEqual({ requestedId: "current", source: "thread" });
    expect(
      readCollaborationQuerySelection(new URLSearchParams("collaboration=legacy")),
    ).toEqual({ requestedId: "legacy", source: "collaboration" });
  });

  it("generates new links with the canonical thread parameter", () => {
    expect(collaborationThreadParams("abc").toString()).toBe("thread=abc");
  });
});
