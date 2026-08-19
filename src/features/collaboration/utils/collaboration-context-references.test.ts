import { describe, expect, it } from "vitest";

import type { CollaborationDetailResponse } from "../contracts/collaboration.contracts";
import { collaborationCanonicalContextReferences } from "./collaboration-context-references";

function detail(): CollaborationDetailResponse {
  return {
    projectionSource: "CANONICAL",
    identity: {
      collaborationId: "collaboration",
      sourceApplicationId: null,
      campaignId: "campaign",
      campaignCreatorId: "creator",
      campaignAssetId: "asset",
      briefId: "brief",
      brand: { id: "brand", displayName: "Brand" },
      creator: { id: "creator", displayName: "Creator" },
    },
    sourceContext: {
      campaign: { id: "campaign", name: "Campaign" },
      campaignAsset: { name: "Product" },
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
      stage: "PRODUCTION",
      status: "IN_PROGRESS",
      actionRequiredBy: "BRAND",
      availableActions: [],
      aggregateVersion: 1,
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
    updatedAt: "2026-08-18T00:00:00.000Z",
  };
}

describe("Collaboration canonical context references", () => {
  it("returns the explicit canonical Campaign, Asset and Brief lineage", () => {
    expect(collaborationCanonicalContextReferences(detail())).toEqual({
      campaignId: "campaign",
      campaignAssetId: "asset",
      briefId: "brief",
    });
  });

  it("does not promote compatibility records into canonical context", () => {
    const value = detail();
    value.projectionSource = "LEGACY_COMPATIBILITY";
    value.legacyCompatibility = {
      applied: true,
      reason: "Legacy record",
      fields: ["campaignAsset"],
    };
    expect(collaborationCanonicalContextReferences(value)).toEqual({
      campaignId: null,
      campaignAssetId: null,
      briefId: null,
    });
  });

  it("stops Brief linkage when the projected lineage disagrees", () => {
    const value = detail();
    value.sourceContext.brief.id = "different-brief";
    expect(collaborationCanonicalContextReferences(value)).toEqual({
      campaignId: "campaign",
      campaignAssetId: "asset",
      briefId: null,
    });
  });
});
