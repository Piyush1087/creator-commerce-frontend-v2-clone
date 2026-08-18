import { describe, expect, it } from "vitest";

import { collaborationEmptyWorkspaceCopy } from "./collaboration-empty-workspace";

describe("Collaboration empty workspace copy", () => {
  it("keeps a populated Inbox no-selection state distinct from an Empty Inbox", () => {
    expect(collaborationEmptyWorkspaceCopy("no-selection")).toEqual({
      title: "Select a collaboration",
      body: "Choose a collaboration from the Inbox to view messages, execution progress and next actions.",
    });
    expect(collaborationEmptyWorkspaceCopy("empty-inbox")).toEqual({
      title: "No collaborations yet",
      body: "New collaboration conversations will appear in the Inbox when they are available.",
    });
  });
});
