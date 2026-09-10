import { describe, expect, it } from "vitest";

import { creatorHomeResponseSchema } from "./creator-home.schemas";

const at = "2026-09-07T00:00:00.000Z";
function fixture() {
  return {
    contractVersion: "1.0",
    generatedAt: at,
    status: "READY",
    creator: {
      id: "creator",
      workspaceId: "workspace",
      displayName: "Creator",
      workspaceDisplayName: "Studio",
      role: "OWNER",
    },
    kpis: [
      "AVAILABLE_CAMPAIGNS",
      "APPLICATIONS_IN_PROGRESS",
      "ACTIVE_COLLABORATIONS",
      "UNREAD_UPDATES",
    ].map((id) => ({
      id,
      state: "READY",
      value: 0,
      freshness: "CURRENT",
      observedAt: at,
    })),
    quickActions: [
      ["BROWSE_CAMPAIGNS", "CREATOR_CAMPAIGNS"],
      ["MY_APPLICATIONS", "CREATOR_APPLICATIONS"],
      ["COLLABORATIONS", "CREATOR_COLLABORATIONS"],
      ["SETTINGS", "CREATOR_SETTINGS"],
    ].map(([id, destinationId]) => ({
      id,
      label: id,
      action: {
        state: "AVAILABLE",
        destination: { destinationId },
        reasonCode: null,
      },
    })),
    sections: [
      "NEEDS_YOUR_ATTENTION",
      "YOUR_WORK",
      "CAMPAIGNS_AVAILABLE",
      "RECENT_ACTIVITY",
    ].map((id) => ({ id, state: "EMPTY", items: [] })),
    sourceStates: [
      "SETTINGS",
      "OPPORTUNITIES",
      "APPLICATIONS",
      "COLLABORATIONS",
      "NOTIFICATIONS",
    ].map((sourceDomain) => ({
      sourceDomain,
      state: "READY",
      freshness: "CURRENT",
      observedAt: at,
      truncated: false,
      limitations: [],
    })),
    truncated: false,
    limitations: [],
  };
}

describe("Creator Home runtime contract", () => {
  it("accepts V1 and rejects unknown API fields", () => {
    expect(creatorHomeResponseSchema.safeParse(fixture()).success).toBe(true);
    expect(
      creatorHomeResponseSchema.safeParse({
        ...fixture(),
        rawUrl: "https://unsafe.example",
      }).success,
    ).toBe(false);
  });
});
