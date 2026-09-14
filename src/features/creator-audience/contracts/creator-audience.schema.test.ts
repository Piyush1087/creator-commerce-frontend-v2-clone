import { describe, expect, it } from "vitest";

import { creatorAudienceSchema } from "./creator-audience.schema";

const base = {
  contractVersion: "creator_audience_v0.1",
  generatedAt: "2026-09-14T10:00:00.000Z",
  status: "PARTIAL",
  context: { role: "ASSISTANT" },
  source: "INSTAGRAM",
  sourceStatus: "CONNECTED",
  snapshotBasis: {
    period: "lifetime",
    timeframe: "this_month",
    capturedAt: "2026-09-14T10:00:00.000Z",
  },
  defaultCohort: "FOLLOWERS",
  highlights: [],
  cohorts: [
    {
      id: "FOLLOWERS",
      availability: "PARTIAL",
      size: 10,
      dimensions: [
        {
          id: "AGE",
          state: "AVAILABLE",
          denominatorValid: false,
          buckets: [{ key: "18-24", count: 5, percentage: null }],
          limitations: ["NO_VALID_DENOMINATOR"],
        },
      ],
      limitations: ["NO_VALID_DENOMINATOR"],
    },
  ],
  freshness: { state: "CURRENT", staleAfterHours: 192 },
  processingState: "IDLE",
  currentPreserved: false,
  limitations: ["NO_VALID_DENOMINATOR"],
  settingsRecoveryRoute: "/creator/settings/instagram",
} as const;

describe("Creator Audience strict consumer contract", () => {
  it("accepts count-only truth", () =>
    expect(
      creatorAudienceSchema.parse(base).cohorts[0].dimensions[0].buckets[0]
        .percentage,
    ).toBeNull());
  it("rejects fabricated percentages without a valid denominator", () =>
    expect(() =>
      creatorAudienceSchema.parse({
        ...base,
        cohorts: [
          {
            ...base.cohorts[0],
            dimensions: [
              {
                ...base.cohorts[0].dimensions[0],
                buckets: [{ key: "18-24", count: 5, percentage: 50 }],
              },
            ],
          },
        ],
      }),
    ).toThrow());
  it("rejects unknown provider/internal fields", () =>
    expect(() =>
      creatorAudienceSchema.parse({ ...base, accessToken: "forbidden" }),
    ).toThrow());
});
