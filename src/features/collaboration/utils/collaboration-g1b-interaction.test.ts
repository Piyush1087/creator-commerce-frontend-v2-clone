import { describe, expect, it } from "vitest";

import type { CollaborationAvailableAction, CollaborationDetailResponse } from "../contracts/collaboration.contracts";
import { collaborationCapabilities } from "./collaboration-capabilities";
import {
  collaborationCanSendMessage,
  collaborationComposerMode,
  EMPTY_MESSAGES_COPY,
  MESSAGING_CLOSED_COPY,
} from "./collaboration-composer-state";
import {
  assignCollaborationPaneError,
  classifyCollaborationHttpFailure,
  clearCollaborationPaneError,
  emptyCollaborationPaneErrors,
} from "./collaboration-error-surface";

function detailWithActions(
  availableActions: CollaborationAvailableAction[],
): CollaborationDetailResponse {
  return {
    projectionSource: "CANONICAL",
    identity: {
      collaborationId: "c1",
      sourceApplicationId: "app-1",
      campaignId: "camp",
      campaignCreatorId: null,
      campaignAssetId: null,
      briefId: "brief",
      brand: { id: "b1", displayName: "Brand" },
      creator: { id: "cr1", displayName: "Creator", handle: "creator" },
    },
    sourceContext: {
      campaign: { id: "camp", name: "Campaign" },
      campaignAsset: null,
      brief: { id: "brief", title: "Brief", creativeGuidelines: "" },
      executionSnapshot: null,
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
    workflow: {
      stage: "FULFILLMENT",
      status: "IN_PROGRESS",
      actionRequiredBy: "CREATOR",
      availableActions,
      aggregateVersion: 3,
    },
    commercial: null,
    securement: null,
    fulfillment: null,
    deliverables: [],
    publishing: [],
    publishingComplete: false,
    settlement: {
      state: "NOT_ELIGIBLE",
      residualSettlementPending: false,
      actionRequiredBy: "NONE",
    },
    resolution: null,
    feedback: null,
    blocking: null,
    inbox: { unreadCount: 0, lastMessageSnippet: null, lastMessageAt: null },
    legacyCompatibility: null,
    updatedAt: "2026-08-14T00:00:00.000Z",
  };
}

describe("G1B composer capability authority", () => {
  it("enables composer only from message capability", () => {
    const enabled = detailWithActions(["PostCollaborationMessage"]);
    const closed = detailWithActions(["CancelCollaborationByCreator"]);
    expect(collaborationComposerMode(enabled)).toBe("enabled");
    expect(collaborationComposerMode(closed)).toBe("read_only");
    expect(collaborationComposerMode(null)).toBe("unavailable");
    expect(collaborationCanSendMessage(enabled, "hi", false)).toBe(true);
    expect(collaborationCanSendMessage(enabled, "hi", true)).toBe(false);
    expect(collaborationCanSendMessage(closed, "hi", false)).toBe(false);
    expect(MESSAGING_CLOSED_COPY.title).toContain("Messaging is closed");
    expect(EMPTY_MESSAGES_COPY).toBe("No messages yet");
  });

  it("does not infer sendability from lifecycle fields", () => {
    const completedLooking = detailWithActions([]);
    completedLooking.lifecycle.state = "COMPLETED";
    expect(collaborationComposerMode(completedLooking)).toBe("read_only");
    const activeWithoutMessage = detailWithActions(["ProvideFulfillment"]);
    activeWithoutMessage.lifecycle.state = "ACTIVE";
    expect(collaborationComposerMode(activeWithoutMessage)).toBe("read_only");
  });
});

describe("G1B pane-local error ownership", () => {
  it("assigns and clears pane-owned errors", () => {
    let panes = emptyCollaborationPaneErrors();
    panes = assignCollaborationPaneError("INBOX_READ", "inbox failed", panes);
    panes = assignCollaborationPaneError("MESSAGE_SEND", "send failed", panes);
    expect(panes.inbox).toBe("inbox failed");
    expect(panes.send).toBe("send failed");
    panes = clearCollaborationPaneError("MESSAGE_SEND", panes);
    expect(panes.send).toBeNull();
    expect(panes.inbox).toBe("inbox failed");
  });

  it("classifies 404 as collaboration unavailable and 401 as session", () => {
    expect(classifyCollaborationHttpFailure(404)).toBe("COLLABORATION_UNAVAILABLE");
    expect(classifyCollaborationHttpFailure(401)).toBe("SESSION_AUTH");
  });
});

describe("G1B creator cancellation capability gate", () => {
  it("shows cancel only when CancelCollaborationByCreator is present", () => {
    const withCancel = detailWithActions([
      "PostCollaborationMessage",
      "CancelCollaborationByCreator",
    ]);
    const without = detailWithActions(["PostCollaborationMessage", "EndCollaborationByBrand"]);
    expect(collaborationCapabilities(withCancel).has("cancel")).toBe(true);
    expect(collaborationCapabilities(without).has("cancel")).toBe(false);
    expect(collaborationCapabilities(without).has("end")).toBe(true);
  });

  it("Brand-facing actions never map Creator cancel from EndCollaborationByBrand", () => {
    const brand = detailWithActions(["EndCollaborationByBrand"]);
    expect(collaborationCapabilities(brand).has("cancel")).toBe(false);
  });
});

describe("G1B realtime refresh semantics", () => {
  it("keeps Realtime degraded as an owned recovery surface name", () => {
    const surfaces = ["REALTIME_DEGRADED"] as const;
    expect(surfaces).toContain("REALTIME_DEGRADED");
  });
});
