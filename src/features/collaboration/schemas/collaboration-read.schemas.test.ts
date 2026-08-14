import { describe, expect, it } from "vitest";

import {
  isCompatibilityDetail,
  parseCollaborationDetail,
  parseCollaborationMessages,
  parseCollaborationThreads,
} from "./collaboration-read.schemas";

const workflow = {
  stage: "PRODUCTION",
  status: "IN_PROGRESS",
  actionRequiredBy: "CREATOR",
  availableActions: ["SubmitDeliverable"],
  aggregateVersion: 1,
};

const identity = {
  id: "user-1",
  displayName: "Ada",
  handle: "ada",
  kind: "CREATOR",
};

const sourceContext = {
  campaign: { id: "campaign-1", name: "Spring" },
  campaignAsset: { id: "asset-1", name: "Lipstick", type: "PRODUCT" },
  brief: { id: "brief-1", title: "Launch film" },
};

const canonicalThread = {
  collaborationId: "collab-1",
  projectionSource: "CANONICAL",
  counterpart: identity,
  sourceContext,
  lifecycle: "ACTIVE",
  workflow,
  blocking: null,
  resolution: null,
  inbox: { unreadCount: 0, lastMessageSnippet: null, lastMessageAt: null },
  progress: { stageIndex: 4, stageCount: 5 },
  updatedAt: "2026-08-14T00:00:00.000Z",
  legacyCompatibility: null,
};

const canonicalDetail = {
  ...canonicalThread,
  identity: {
    collaborationId: "collab-1",
    sourceApplicationId: "app-1",
    campaignId: "campaign-1",
    campaignCreatorId: "cc-1",
    campaignAssetId: "asset-1",
    briefId: "brief-1",
    brand: { id: "brand-1", displayName: "Brand" },
    creator: identity,
  },
  lifecycle: {
    state: "ACTIVE",
    completedAt: null,
    endedFromStage: null,
    endedReason: null,
    endedByActorClass: null,
    endedByUserId: null,
    endedAt: null,
  },
  commercial: null,
  securement: null,
  fulfillment: null,
  deliverables: [
    {
      deliverableExecutionId: "del-1",
      sourceBriefDeliverableId: "brief-del-1",
      publishingRequired: true,
      availableActions: ["SubmitDeliverable"],
    },
  ],
  publishing: [],
  publishingComplete: false,
  settlement: {
    state: "NOT_ELIGIBLE",
    residualSettlementPending: false,
    actionRequiredBy: "NONE",
  },
};

const compatibilityDetail = {
  ...canonicalDetail,
  projectionSource: "LEGACY_COMPATIBILITY",
  identity: { ...canonicalDetail.identity, sourceApplicationId: null },
  deliverables: [],
  legacyCompatibility: {
    applied: true,
    reason: "MISSING_SOURCE_APPLICATION",
    fields: ["lifecycle", "workflow"],
  },
};

const message = {
  message_id: "msg-1",
  kind: "USER",
  body: "Hello",
  sender_user_id: "user-1",
  system_event_tag: null,
  created_at: "2026-08-14T00:00:00.000Z",
};

describe("Collaboration read validation", () => {
  it("accepts valid canonical list, detail and messages", () => {
    expect(parseCollaborationThreads({ rows: [canonicalThread] }).rows).toHaveLength(1);
    expect(parseCollaborationDetail(canonicalDetail).identity.collaborationId).toBe("collab-1");
    expect(parseCollaborationMessages({ messages: [message] }).messages).toHaveLength(1);
  });

  it("rejects malformed canonical reads", () => {
    expect(() => parseCollaborationThreads({ rows: [{ ...canonicalThread, lifecycle: "UNKNOWN" }] })).toThrow();
  });

  it("rejects missing publishingRequired on canonical details", () => {
    const deliverable = { ...canonicalDetail.deliverables[0] };
    delete (deliverable as { publishingRequired?: boolean }).publishingRequired;
    expect(() =>
      parseCollaborationDetail({
        ...canonicalDetail,
        deliverables: [deliverable],
      }),
    ).toThrow();
  });

  it("accepts documented compatibility fixtures without treating them as canonical execution", () => {
    const parsed = parseCollaborationDetail(compatibilityDetail);
    expect(isCompatibilityDetail(parsed)).toBe(true);
    expect(parsed.deliverables).toHaveLength(0);
  });
});
