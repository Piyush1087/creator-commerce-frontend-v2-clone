import { describe, expect, it } from "vitest";

import type { CollaborationDetailResponse } from "../contracts/collaboration.contracts";
import { collaborationCounterpartMvpFields } from "./collaboration-counterpart-context";
import {
  buildFulfillmentIssuePayload,
  FULFILLMENT_ISSUE_DESCRIPTION_MAX,
  FULFILLMENT_ISSUE_TRANSPORT_CODE,
  validateFulfillmentIssueDescription,
} from "./collaboration-fulfillment-issue";

function detailFixture(
  overrides: Partial<CollaborationDetailResponse> = {},
): CollaborationDetailResponse {
  return {
    projectionSource: "CANONICAL",
    identity: {
      collaborationId: "c1",
      sourceApplicationId: "app-1",
      campaignId: "camp",
      campaignCreatorId: null,
      campaignAssetId: "asset-1",
      briefId: "brief",
      brand: { id: "b1", displayName: "Acme Brand" },
      creator: { id: "cr1", displayName: "Creator One", handle: "@creatorone" },
    },
    sourceContext: {
      campaign: { id: "camp", name: "Summer Drop" },
      campaignAsset: { id: "asset-1", name: "Lipstick Kit", type: "PRODUCT" },
      brief: { id: "brief", title: "Hero reel", creativeGuidelines: "" },
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
      availableActions: ["ReportFulfillmentIssue"],
      aggregateVersion: 2,
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
    updatedAt: "2026-08-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("G1C fulfillment issue honesty", () => {
  it("requires description and keeps issueCode transport-only", () => {
    expect(validateFulfillmentIssueDescription("ab").ok).toBe(false);
    expect(validateFulfillmentIssueDescription("abc").ok).toBe(true);
    expect(validateFulfillmentIssueDescription("x".repeat(FULFILLMENT_ISSUE_DESCRIPTION_MAX + 1)).ok).toBe(
      false,
    );
    const built = buildFulfillmentIssuePayload("  Package arrived damaged  ", " evid-1 ");
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.payload.description).toBe("Package arrived damaged");
    expect(built.payload.evidenceRef).toBe("evid-1");
    expect(built.payload.issueCode).toBe(FULFILLMENT_ISSUE_TRANSPORT_CODE);
  });

  it("does not expose taxonomy category options in the payload helper", () => {
    const built = buildFulfillmentIssuePayload("Not received as described");
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(Object.keys(built.payload).sort()).toEqual(["description", "issueCode"].sort());
  });
});

describe("G1C counterpart MVP context", () => {
  it("Brand drawer fields include Creator name/handle + Campaign/Asset/Brief", () => {
    const fields = collaborationCounterpartMvpFields(detailFixture(), "BRAND");
    expect(fields.displayName).toBe("Creator One");
    expect(fields.handle).toBe("creatorone");
    expect(fields.campaignName).toBe("Summer Drop");
    expect(fields.campaignAssetName).toBe("Lipstick Kit");
    expect(fields.briefTitle).toBe("Hero reel");
  });

  it("Creator drawer fields include Brand + Campaign/Asset/Brief and omit handle", () => {
    const fields = collaborationCounterpartMvpFields(detailFixture(), "CREATOR");
    expect(fields.displayName).toBe("Acme Brand");
    expect(fields.handle).toBeNull();
    expect(fields.campaignName).toBe("Summer Drop");
    expect(fields.campaignAssetName).toBe("Lipstick Kit");
    expect(fields.briefTitle).toBe("Hero reel");
  });

  it("omits missing optional fields without fabricating content", () => {
    const detail = detailFixture({
      identity: {
        ...detailFixture().identity,
        creator: { id: "cr1", displayName: "Creator One", handle: null },
      },
      sourceContext: {
        campaign: { id: "camp", name: "Summer Drop" },
        campaignAsset: null,
        brief: { id: "brief", title: "", creativeGuidelines: "" },
        executionSnapshot: null,
      },
    });
    const fields = collaborationCounterpartMvpFields(detail, "BRAND");
    expect(fields.handle).toBeNull();
    expect(fields.campaignAssetName).toBeNull();
    expect(fields.briefTitle).toBeNull();
  });
});

describe("G1C bank ownership cutover invariants", () => {
  it("keeps securement payout management on Settings route constant", async () => {
    const { AUTH_ROUTES } = await import("../../auth/constants");
    expect(AUTH_ROUTES.creatorSettingsPayouts).toBe("/creator/settings/payouts");
  });
});
