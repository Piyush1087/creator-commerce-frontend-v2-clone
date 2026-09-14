import {
  InstagramB4ResponseSchema,
  InstagramMediaDetailSchema,
  type InstagramB4Response,
  type InstagramMediaDetail,
} from "../contracts/instagram-b4.schemas";

const window = {
  start: "2026-08-13T09:00:00.000Z",
  end: "2026-09-12T09:00:00.000Z",
  days: 30 as const,
};
const available = (value: unknown) => ({ state: "AVAILABLE" as const, value });
const unknown = {
  state: "UNKNOWN" as const,
  reasonCode: "INSUFFICIENT_EVIDENCE" as const,
};
const partialCoverage = {
  state: "PARTIAL" as const,
  eligibleCount: 8,
  observedCount: 6,
  coveragePercent: 75,
  reasonCodes: ["MEDIA_NOT_SELECTED_FOR_DEEP_ANALYSIS" as const],
};

export function instagramB4Fixture(): InstagramB4Response {
  return InstagramB4ResponseSchema.parse({
    contractVersion: "1.0",
    connection: {
      state: "CONNECTED",
      providerAccountId: "synthetic-account",
      handle: "fixture-handle",
      reasonCodes: [],
    },
    window,
    accountFacts: [
      {
        semanticId: "follower_count",
        value: available(12400),
        observedAt: window.end,
        evidenceRefs: ["evidence:account:1"],
      },
    ],
    accountPerformance: [
      {
        kind: "RESULT",
        semanticId: "observed_reach",
        value: 4310,
        unit: "COUNT",
        sampleSize: 6,
        evidenceRefs: ["evidence:performance:1"],
      },
      {
        kind: "RESULT",
        semanticId: "total_interactions",
        value: 802,
        unit: "COUNT",
        sampleSize: 6,
        evidenceRefs: ["evidence:performance:2"],
      },
    ],
    objects: [
      {
        semanticId: "instagram_content_behavior",
        objectContractVersion: "1.0",
        outputContractVersion: "1.0",
        sourceScope: "INSTAGRAM_OWNED",
        state: "PARTIAL_CURRENT",
        readiness: "PARTIAL",
        freshness: "CURRENT",
        currentPreserved: false,
        generatedAt: window.end,
        window,
        results: [],
        signals: [
          {
            kind: "SIGNAL",
            semanticId: "reels_response",
            statement:
              "Short product demonstrations repeatedly received stronger response.",
            confidence: "MEDIUM",
            sampleSize: 6,
            comparisonCohortSizes: [3, 3],
            metricCoveragePercent: 75,
            publicationDateCount: 3,
            evidenceRefs: ["evidence:signal:1"],
          },
        ],
        learnings: [
          {
            kind: "LEARNING",
            semanticId: "demo_learning",
            statement:
              "Concise demonstrations appear to help audiences understand the offering.",
            confidence: "MEDIUM",
            supportingSignalIds: ["reels_response"],
            evidenceRefs: ["evidence:signal:1"],
          },
        ],
        components: {
          window: available(window),
          corpus_summary: available({
            eligiblePostCount: 8,
            observedPostCount: 6,
          }),
          posting_cadence: available(
            "Posts appeared across three publication dates",
          ),
          format_mix: available("Images and Reels were both observed"),
          theme_patterns: available(["Product education", "Use cases"]),
          caption_patterns: available(
            "Captions commonly led with a practical benefit",
          ),
          creative_structure_patterns: unknown,
          offering_presence_patterns: available(
            "Offerings appeared in several inspected posts",
          ),
          creator_presence_patterns: unknown,
          representative_media_refs: available([]),
          bounded_learnings: available(["demo_learning"]),
          coverage: available(75),
        },
        coverage: partialCoverage,
        evidenceRefs: ["evidence:content:1"],
      },
      {
        semanticId: "instagram_audience_profile",
        objectContractVersion: "1.0",
        outputContractVersion: "1.0",
        sourceScope: "INSTAGRAM_OWNED",
        state: "PARTIAL_CURRENT",
        readiness: "PARTIAL",
        freshness: "CURRENT",
        currentPreserved: false,
        generatedAt: window.end,
        window,
        results: [],
        signals: [],
        learnings: [],
        components: {
          window: available(window),
          follower_audience: available("Follower audience data is available"),
          engaged_audience: {
            state: "INTENTIONALLY_ABSENT",
            reasonCode: "AUDIENCE_PRIVACY_SUPPRESSED",
          },
          distribution_concentration: unknown,
          material_differences: unknown,
          limitations: available([
            "Some audience dimensions are privacy limited",
          ]),
          coverage: available(60),
          summary: available("Available audience evidence is partial"),
        },
        coverage: {
          ...partialCoverage,
          reasonCodes: ["AUDIENCE_PRIVACY_SUPPRESSED"],
        },
        evidenceRefs: ["evidence:audience:1"],
      },
      {
        semanticId: "instagram_organic_performance_profile",
        objectContractVersion: "1.0",
        outputContractVersion: "1.0",
        sourceScope: "INSTAGRAM_OWNED",
        state: "PARTIAL_CURRENT",
        readiness: "PARTIAL",
        freshness: "CURRENT",
        currentPreserved: false,
        generatedAt: window.end,
        window,
        results: [
          {
            kind: "RESULT",
            semanticId: "observed_reach",
            value: 4310,
            unit: "COUNT",
            sampleSize: 6,
            evidenceRefs: ["evidence:performance:1"],
          },
        ],
        signals: [],
        learnings: [],
        components: {
          window: available(window),
          account_results: available({ observedReach: 4310 }),
          metric_coverage: available(75),
          format_baselines: unknown,
          response_distribution: unknown,
          high_response_cohorts: {
            state: "INTENTIONALLY_ABSENT",
            reasonCode: "INSUFFICIENT_COMPARABLE_SAMPLE",
          },
          low_response_cohorts: {
            state: "INTENTIONALLY_ABSENT",
            reasonCode: "INSUFFICIENT_COMPARABLE_SAMPLE",
          },
          content_performance_signals: unknown,
          snapshot_change: {
            state: "INTENTIONALLY_ABSENT",
            reasonCode: "INSUFFICIENT_EVIDENCE",
          },
          representative_media_refs: available([]),
          bounded_learnings: unknown,
          coverage: available(75),
        },
        coverage: partialCoverage,
        evidenceRefs: ["evidence:performance:1"],
      },
    ],
    representativeMedia: [
      {
        mediaId: "synthetic-media-1",
        mediaType: "REELS",
        publishedAt: available("2026-09-09T09:00:00.000Z"),
        permalink: {
          state: "INTENTIONALLY_ABSENT",
          reasonCode: "INTENTIONAL_ABSENCE",
        },
        likelyCollab: {
          state: "POSSIBLE_COLLAB",
          confidence: "LOW",
          signalClasses: ["MENTION_ONLY"],
          canonicalCreatorId: null,
          canonicalCreatorMatch: "NONE",
          canonicalCollaborationId: null,
          canonicalCollaborationMatch: "NONE",
          reasonCodes: [],
          evidenceRefs: ["evidence:media:1"],
          negativeEvidence: {
            captionInspected: true,
            requiredSelectedMediaInspected: true,
          },
        },
        metricHighlights: [
          {
            availability: "OBSERVED",
            metricId: "reach",
            value: 980,
            unit: "COUNT",
            denominator: {
              state: "EXPLICIT_NULL",
              reasonCode: "INTENTIONAL_ABSENCE",
            },
            evidenceRefs: ["evidence:media:1"],
          },
        ],
        evidenceRefs: ["evidence:media:1"],
      },
    ],
    coverage: {
      inventory: {
        state: "COMPLETE",
        eligibleCount: 8,
        observedCount: 8,
        coveragePercent: 100,
        reasonCodes: [],
      },
      metrics: partialCoverage,
      lightSemantic: partialCoverage,
      deepMultimodal: {
        state: "PARTIAL",
        eligibleCount: 8,
        observedCount: 3,
        coveragePercent: 37.5,
        reasonCodes: ["MEDIA_NOT_SELECTED_FOR_DEEP_ANALYSIS"],
      },
      audience: {
        state: "PARTIAL",
        eligibleCount: 2,
        observedCount: 1,
        coveragePercent: 50,
        reasonCodes: ["AUDIENCE_PRIVACY_SUPPRESSED"],
      },
    },
    sync: {
      state: "IDLE",
      lastAttemptAt: window.end,
      lastSuccessAt: window.end,
      nextDueAt: null,
      currentPreserved: false,
      reasonCodes: [],
    },
    actions: {
      manualRefresh: { state: "ALLOWED", cooldownEndsAt: null },
      settingsRecoveryPath: "/brand/settings/integrations?tab=instagram",
    },
  });
}

export function instagramMediaDetailFixture(): InstagramMediaDetail {
  return InstagramMediaDetailSchema.parse({
    contractVersion: "1.0",
    mediaId: "synthetic-media-1",
    mediaType: "CAROUSEL_ALBUM",
    publishedAt: available("2026-09-09T09:00:00.000Z"),
    permalink: available("https://www.instagram.com/p/synthetic-post/"),
    caption: available(
      "A practical product demonstration <script>alert(1)</script>",
    ),
    hashtags: ["#PracticalDemo"],
    mentions: ["@example_creator"],
    themes: [
      {
        semanticId: "theme-1",
        label: "Product education",
        confidence: "MEDIUM",
        evidenceRefs: ["synthetic-support-1"],
      },
    ],
    captionPatterns: [
      {
        semanticId: "caption-1",
        label: "Benefit-led opening",
        confidence: "LOW",
        evidenceRefs: ["synthetic-support-1"],
      },
    ],
    creativeStructures: [
      {
        semanticId: "structure-1",
        label: "Demonstration",
        confidence: "MEDIUM",
        evidenceRefs: ["synthetic-support-1"],
      },
    ],
    visualExecutions: [
      {
        semanticId: "visual-1",
        label: "Product close-up",
        confidence: "LOW",
        evidenceRefs: ["synthetic-support-1"],
      },
    ],
    creatorPresence: {
      state: "POSSIBLE",
      reasonCodes: [],
      evidenceRefs: ["synthetic-support-1"],
    },
    offeringPresence: {
      state: "PRESENT",
      canonicalOfferingId: "11111111-1111-4111-8111-111111111111",
      canonicalOfferingMatch: "EXACT_PREEXISTING",
      reasonCodes: [],
      evidenceRefs: ["synthetic-support-1"],
    },
    likelyCollab: {
      state: "POSSIBLE_COLLAB",
      confidence: "LOW",
      signalClasses: ["MENTION_ONLY"],
      canonicalCreatorId: null,
      canonicalCreatorMatch: "NONE",
      canonicalCollaborationId: null,
      canonicalCollaborationMatch: "NONE",
      reasonCodes: [],
      evidenceRefs: ["synthetic-support-1"],
      negativeEvidence: {
        captionInspected: true,
        requiredSelectedMediaInspected: true,
      },
    },
    metrics: [
      {
        availability: "OBSERVED_ZERO",
        metricId: "comments",
        value: 0,
        unit: "COUNT",
        denominator: {
          state: "EXPLICIT_NULL",
          reasonCode: "INTENTIONAL_ABSENCE",
        },
        evidenceRefs: ["synthetic-support-1"],
      },
      {
        availability: "UNAVAILABLE",
        metricId: "shares",
        reasonCode: "METRIC_NOT_RETURNED",
        evidenceRefs: [],
      },
    ],
    inspection: {
      depth: "PARTIAL_DEEP",
      selectedForDeepAnalysis: true,
      selectionReasons: ["LIKELY_CREATOR_CUE"],
      inspectedChildCount: 2,
      availableChildCount: 3,
      inspectedFrameCount: 0,
      reasonCodes: ["CAROUSEL_CHILD_UNAVAILABLE"],
    },
    coverage: {
      sourceEvidenceCount: 1,
      limitations: ["CAROUSEL_CHILD_UNAVAILABLE"],
    },
    evidence: {
      refs: ["synthetic-support-1"],
      capturedAt: "2026-09-10T09:00:00.000Z",
    },
  });
}
