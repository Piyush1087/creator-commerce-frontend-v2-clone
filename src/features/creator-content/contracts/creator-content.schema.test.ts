import { describe, expect, it } from "vitest";
import { creatorContentSchema } from "./creator-content.schema";

export const contentFixture = {
  contractVersion: "creator_content_v0.1",
  generatedAt: "2026-09-15T10:00:00.000Z",
  status: "READY",
  context: { role: "OWNER" },
  source: "INSTAGRAM",
  sourceStatus: "CONNECTED",
  snapshot: {
    windowDays: 90,
    windowStart: "2026-06-17T10:00:00.000Z",
    windowEnd: "2026-09-15T10:00:00.000Z",
    eligibleCount: 2,
    providerRowsReturned: 2,
    cap: 24,
    coverage: 1,
    media: [
      {
        providerMediaId: "media-1",
        publishedAt: "2026-09-10T10:00:00.000Z",
        mediaType: "REEL",
        permalink: "https://www.instagram.com/p/example/",
        semanticState: "AVAILABLE",
        themes: ["Cooking"],
        captionPatterns: ["Question opening"],
        creativeStructures: ["Demonstration"],
        visualExecution: ["Close-up"],
        metrics: { REACH: 120 },
        evidenceRefs: ["evidence-1"],
      },
    ],
  },
  highlights: [
    {
      id: "highlight-1",
      kind: "RECURRENCE",
      text: "Cooking appeared in two posts.",
      confidence: "MEDIUM",
      evidenceRefs: ["evidence-1"],
    },
  ],
  whatYouCreate: {
    themes: [{ value: "Cooking", postCount: 2, evidenceRefs: ["evidence-1"] }],
    formats: [{ value: "REEL", postCount: 2, evidenceRefs: ["evidence-1"] }],
  },
  performance: {
    comparisonProfile: "v0.1",
    claims: [
      {
        id: "claim-1",
        cohort: "Cooking posts",
        metric: "REACH",
        direction: "HIGHER",
        cohortMedian: 120,
        complementMedian: 80,
        absolutePercentagePointDelta: null,
        relativeDelta: 0.5,
        cohortSample: 2,
        complementSample: 2,
        cohortCoverage: 1,
        complementCoverage: 1,
        confidence: "MEDIUM",
        evidenceRefs: ["evidence-1"],
      },
    ],
  },
  representatives: [
    {
      providerMediaId: "media-1",
      publishedAt: "2026-09-10T10:00:00.000Z",
      reason: "Represents Cooking posts.",
      permalink: "https://www.instagram.com/p/example/",
      evidenceRefs: ["evidence-1"],
    },
  ],
  freshness: {
    state: "CURRENT",
    staleAfterHours: 48,
    capturedAt: "2026-09-15T10:00:00.000Z",
  },
  processingState: "IDLE",
  currentPreserved: false,
  limitations: [],
  settingsRecoveryRoute: "/creator/settings/instagram",
} as const;

describe("Creator Content strict consumer contract", () => {
  it("accepts the bounded contract and rejects unknown/provider-sensitive fields", () => {
    expect(
      creatorContentSchema.parse(contentFixture).snapshot.media,
    ).toHaveLength(1);
    expect(() =>
      creatorContentSchema.parse({
        ...contentFixture,
        accessToken: "forbidden",
      }),
    ).toThrow();
  });
  it("rejects invalid bounds and unsafe representative links", () => {
    expect(() =>
      creatorContentSchema.parse({
        ...contentFixture,
        highlights: Array(4).fill(contentFixture.highlights[0]),
      }),
    ).toThrow();
    expect(() =>
      creatorContentSchema.parse({
        ...contentFixture,
        representatives: [
          {
            ...contentFixture.representatives[0],
            permalink: "javascript:alert(1)",
          },
        ],
      }),
    ).toThrow();
  });
});
