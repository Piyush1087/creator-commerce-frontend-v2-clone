import type { InstagramB4Response } from "../contracts/instagram-b4.schemas";

const ids = [
  "instagram_content_behavior",
  "instagram_audience_profile",
  "instagram_organic_performance_profile",
] as const;

export function instagramB4Fixture(): InstagramB4Response {
  const window = {
    start: "2026-08-13T09:00:00.000Z",
    end: "2026-09-12T09:00:00.000Z",
    days: 30 as const,
  };
  const unavailable = {
    state: "UNAVAILABLE" as const,
    eligibleCount: 0,
    observedCount: 0,
    coveragePercent: null,
    reasonCodes: ["INSUFFICIENT_EVIDENCE"],
  };
  return {
    contractVersion: "1.0",
    connection: {
      state: "CONNECTED",
      providerAccountId: "synthetic-account",
      handle: "fixture-handle",
      reasonCodes: [],
    },
    window,
    accountFacts: [],
    accountPerformance: [],
    objects: ids.map((semanticId) => ({
      semanticId,
      objectContractVersion: "1.0",
      outputContractVersion: "1.0",
      sourceScope: "INSTAGRAM_OWNED",
      state:
        semanticId === "instagram_content_behavior"
          ? "PARTIAL_CURRENT"
          : "NO_CURRENT",
      readiness:
        semanticId === "instagram_content_behavior" ? "PARTIAL" : "NOT_READY",
      freshness:
        semanticId === "instagram_content_behavior" ? "CURRENT" : "UNKNOWN",
      currentPreserved: semanticId === "instagram_content_behavior",
      generatedAt:
        semanticId === "instagram_content_behavior" ? window.end : null,
      window,
      results: [],
      signals: [],
      learnings: [],
      components: {
        coverage: { state: "UNKNOWN", reasonCode: "INSUFFICIENT_EVIDENCE" },
      },
      coverage: unavailable,
      evidenceRefs:
        semanticId === "instagram_content_behavior"
          ? ["bounded-evidence-reference"]
          : [],
    })),
    representativeMedia: [],
    coverage: {
      inventory: unavailable,
      metrics: unavailable,
      lightSemantic: unavailable,
      deepMultimodal: unavailable,
      audience: unavailable,
    },
    sync: {
      state: "BLOCKED",
      lastAttemptAt: window.end,
      lastSuccessAt: window.end,
      nextDueAt: null,
      currentPreserved: true,
      reasonCodes: ["CURRENT_PRESERVED_AFTER_FAILURE"],
    },
    actions: {
      manualRefresh: { state: "ALLOWED", cooldownEndsAt: null },
      settingsRecoveryPath: "/brand/settings/integrations?tab=instagram",
    },
  };
}
