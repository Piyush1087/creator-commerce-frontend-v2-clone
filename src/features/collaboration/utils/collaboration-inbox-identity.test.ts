import { describe, expect, it } from "vitest";

import type { CollaborationThreadRow } from "../contracts/collaboration.contracts";
import { collaborationInboxIdentity } from "./collaboration-inbox-identity";

const row = {
  collaborationId: "collab-1",
  projectionSource: "CANONICAL",
  counterpart: { id: "creator-1", displayName: "Ada", handle: "ada", kind: "CREATOR" },
  sourceContext: {
    campaign: { id: "campaign-1", name: "Spring" },
    campaignAsset: { id: "asset-1", name: "Lipstick", type: "PRODUCT" },
    brief: { id: "brief-1", title: "Launch film" },
  },
  lifecycle: "ACTIVE",
  workflow: {
    stage: "PRODUCTION",
    status: "IN_PROGRESS",
    actionRequiredBy: "CREATOR",
    availableActions: [],
    aggregateVersion: 1,
  },
  blocking: null,
  resolution: null,
  inbox: { unreadCount: 0, lastMessageSnippet: "hello", lastMessageAt: null },
  progress: { stageIndex: 4, stageCount: 5 },
  updatedAt: "2026-08-14T00:00:00.000Z",
  legacyCompatibility: null,
} as CollaborationThreadRow;

describe("Inbox identity", () => {
  it("distinguishes rows with counterpart, campaign, asset and brief", () => {
    expect(collaborationInboxIdentity(row)).toEqual({
      title: "Ada",
      handle: "ada",
      context: "Spring · Lipstick · PRODUCT · Launch film",
    });
  });
});
