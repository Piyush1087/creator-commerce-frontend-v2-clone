import type { InstagramB4Response } from "../contracts/instagram-b4.schemas";

export function instagramB4Fixture(): InstagramB4Response {
  return {
    contractVersion: "b4-proof-1.0",
    connection: {
      state: "CONNECTED",
      account: {
        providerAccountId: "synthetic-account",
        handle: "fixture-handle",
      },
    },
    window: {
      start: "2026-08-12T10:00:01.000Z",
      end: "2026-09-11T10:00:01.000Z",
      days: 30,
    },
    contentBehavior: {
      semanticId: "instagram_content_behavior",
      objectContractVersion: "1.0",
      outputContractVersion: "1.0",
      objectState: "PARTIAL_CURRENT",
      readiness: "PARTIAL",
      freshness: "CURRENT",
      authority: "CREATOR_SHOP_DERIVED",
      sourceClass: "INSTAGRAM_OWNED",
      protection: "UNPROTECTED",
      generatedAt: new Date().toISOString(),
      currentPreserved: true,
      latestProcessing: {
        state: "DEGRADED",
        reasonCode: "B4_EVIDENCE_UNAVAILABLE",
      },
      observedImage: {
        format: "IMAGE",
        description: "A centered blue geometric composition.",
        visibleElements: ["blue rectangle"],
        dominantColors: ["blue"],
        composition: "Centered with an even margin.",
      },
      coverage: { eligibleCount: 1, observedCount: 1, deepInspectedCount: 1 },
      evidence: { count: 1, refs: ["bounded-evidence-reference"] },
      limitation: "Not enough posts to identify patterns or learnings",
    },
    latestProcessing: {
      state: "DEGRADED",
      reasonCode: "B4_EVIDENCE_UNAVAILABLE",
    },
    settingsRecoveryPath: "/brand/settings/integrations?tab=instagram",
  };
}
