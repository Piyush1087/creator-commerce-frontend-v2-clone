import { describe, expect, it } from "vitest";

import { creatorAudienceSchema } from "./creator-audience.schema";

const base = {
  contractVersion: "creator_audience_v1.1",
  overview: { accountFollowerCount: 10, facts: [] },
  profiles: [],
  contentContext: [],
  change: { state: "NOT_PROCESSED", observations: [] },
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
  it("rejects cross-cohort, unsupported, or fabricated facts and account counts", () => {
    const fact = {
      cohort: "ENGAGED",
      dimension: "AGE",
      bucket: "18-24",
      count: 5,
      percentage: null,
      evidenceRefs: ["source"],
    };
    expect(
      creatorAudienceSchema.safeParse({
        ...base,
        overview: { accountFollowerCount: 11, facts: [] },
      }).success,
    ).toBe(false);
    expect(
      creatorAudienceSchema.safeParse({
        ...base,
        overview: { accountFollowerCount: 10, facts: [fact] },
      }).success,
    ).toBe(false);
    expect(
      creatorAudienceSchema.safeParse({
        ...base,
        profiles: [
          {
            cohort: "FOLLOWERS",
            cohortSize: null,
            facts: [fact],
            coverage: { availableDimensions: 1, requiredDimensions: 4 },
            limitations: [],
          },
        ],
      }).success,
    ).toBe(false);
  });
  it("rejects unsupported history, stale Content context, and wrong version", () => {
    expect(
      creatorAudienceSchema.safeParse({
        ...base,
        contractVersion: "creator_audience_v0.1",
      }).success,
    ).toBe(false);
    const audienceFact = {
      cohort: "FOLLOWERS",
      dimension: "AGE",
      bucket: "18-24",
      count: 5,
      percentage: null,
      evidenceRefs: ["source"],
    };
    expect(
      creatorAudienceSchema.safeParse({
        ...base,
        freshness: { state: "STALE", staleAfterHours: 192 },
        contentContext: [
          {
            audienceFact,
            contentFact: {
              text: "Supported separate Content fact.",
              capturedAt: base.generatedAt,
              evidenceRefs: ["content"],
            },
            interpretation: "SEPARATE_SOURCE_FACTS_NOT_AUDIENCE_PREFERENCE",
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      creatorAudienceSchema.safeParse({
        ...base,
        change: {
          state: "AVAILABLE",
          observations: [
            {
              cohort: "FOLLOWERS",
              dimension: "AGE",
              bucket: "18-24",
              priorPercentage: 40,
              latestPercentage: 50,
              percentagePointDelta: 10,
              snapshotCount: 2,
              elapsedDays: 14,
              priorCapturedAt: "2026-08-31T10:00:00.000Z",
              latestCapturedAt: base.generatedAt,
              evidenceRefs: ["a", "b"],
            },
          ],
        },
      }).success,
    ).toBe(false);
  });
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
