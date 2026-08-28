import type {
  BrandField,
  BrandFieldMeta,
  BrandWorkspaceProjection,
} from "../contracts/brand-centre-brand.contracts";
import { parseBrandCentreBrand } from "../schemas/brand-centre-brand-schema";
import type {
  BrandProcessorId,
  BrandProcessorRuntime,
  BrandProcessorRuntimeEntry,
} from "../schemas/brand-processor-runtime";

/** Test-only fixtures: backend 884eed0 consumer/service and PostgreSQL fixture shapes.
 * No fixture is imported by a production entrypoint or used as a data fallback.
 */
export function meta(semanticId: string): BrandFieldMeta {
  return {
    semanticId,
    readiness: "READY",
    resultReadiness: "READY",
    freshness: "CURRENT",
    authority: "creator_shop",
    editability: "POLICY_PENDING",
  };
}
export function field<T>(semanticId: string, value: T): BrandField<T> {
  return { ...meta(semanticId), current: { kind: "VALUE", value } };
}
export function intelligence<T>(semanticId: string, value: T) {
  return {
    ...field(semanticId, value),
    candidate: {
      status: "NONE" as const,
      count: 0,
      currentPreserved: true,
      summaryAvailable: false,
      rawCandidateVisible: false as const,
    },
    mixedGeneration: false as const,
    componentMeta: {},
  };
}
export function missing(semanticId: string) {
  return {
    ...intelligence(semanticId, "unused"),
    current: { kind: "NO_CURRENT" as const },
    readiness: "NOT_READY" as const,
    resultReadiness: "NOT_READY" as const,
    freshness: "UNKNOWN" as const,
  };
}

function processorEntry<Id extends BrandProcessorId>(processorId: Id) {
  return {
    processorId,
    activity: "IDLE" as const,
    readiness: "UNKNOWN" as const,
    latestExecutionStatus: null,
    reasonCode: null,
    hasCurrent: true,
    refreshing: false,
    failure: null,
  };
}

export function processorRuntimeFixture(): BrandProcessorRuntime {
  return {
    brand_communication: processorEntry("brand_communication"),
    brand_meaning: processorEntry("brand_meaning"),
    brand_character: processorEntry("brand_character"),
    audience_persona_synthesis: processorEntry("audience_persona_synthesis"),
    brand_differentiation: processorEntry("brand_differentiation"),
    visual_style_synthesis: processorEntry("visual_style_synthesis"),
    serviceability_synthesis: processorEntry("serviceability_synthesis"),
  };
}

export function setProcessorActivity(
  runtime: BrandProcessorRuntime,
  processorId: BrandProcessorId,
  activity: BrandProcessorRuntimeEntry["activity"],
  hasCurrent = activity !== "LEARNING",
) {
  const entry = runtime[processorId];
  entry.activity = activity;
  entry.hasCurrent = hasCurrent;
  entry.refreshing = activity === "REFRESHING";
  entry.latestExecutionStatus =
    activity === "LEARNING" || activity === "REFRESHING" ? "RUNNING" : null;
}
function applicationMissing(semanticId: string) {
  return {
    ...meta(semanticId),
    current: { kind: "NO_CURRENT" },
    readiness: "NOT_READY",
    resultReadiness: "NOT_READY",
    freshness: "UNKNOWN",
    authority: "observed",
    editability: "READ_ONLY",
  };
}
export function consumerFixture(personaCount = 1): BrandWorkspaceProjection {
  const details = {
    industry: field("industry", "D2C"),
    category: field("sub_industry", "Consumer goods"),
    primaryGeography: field("country", "US"),
    currency: field("reporting_currency", "USD"),
  };
  const personas = Array.from({ length: personaCount }, (_, number) => ({
    semantic_id: `active-persona-${number + 1}`,
    lifecycle: "ACTIVE",
    label: `Active Persona ${number + 1}`,
    summary: number === 0 ? "Grounded current audience context." : undefined,
    motivations:
      number === 0
        ? [{ semantic_id: "practical-guidance", value: "Practical guidance" }]
        : null,
  }));
  return parseBrandCentreBrand({
    brandId: "10000000-0000-4000-8000-000000000001",
    workspaceReadiness: "READY",
    runtimeActivity: "NONE",
    processorRuntime: processorRuntimeFixture(),
    identity: {
      ...details,
      brandName: field("brand_name", "Consumer test"),
      website: field("website_url", {
        url: "https://consumer.example/",
        displayDomain: "consumer.example",
      }),
      socialHandles: [],
    },
    details,
    visualIdentity: {
      canonical: {
        primaryLogo: applicationMissing("primary_logo"),
        secondaryMarks: applicationMissing("alternate_marks"),
        palette: applicationMissing("approved_palette"),
        headingFont: applicationMissing("heading_font"),
        bodyFont: applicationMissing("body_font"),
        typography: applicationMissing("approved_typography"),
        referenceImages: applicationMissing("reference_images"),
      },
      style: intelligence("visual_style_profile", {
        summary: "Derived minimal style",
        style_traits: [],
      }),
    },
    brandIdentity: {
      description: intelligence(
        "brand_description",
        "Current Brand description",
      ),
      positioning: {
        ...intelligence("positioning", "Protected current"),
        authority: "confirmed",
        freshness: "STALE",
        candidate: {
          status: "CONFLICT",
          count: 1,
          currentPreserved: true,
          summaryAvailable: false,
          rawCandidateVisible: false,
        },
      },
      valueProposition: missing("value_proposition"),
      values: intelligence("brand_values", [
        { semantic_id: "care", value: "Care" },
      ]),
      personality: intelligence("brand_personality", [
        { semantic_id: "practical", trait: "Practical" },
      ]),
      differentiation: {
        ...intelligence("differentiation_and_proof", [
          {
            semantic_id: "expertise",
            differentiator: "Specialist expertise",
            proof_points: [
              { semantic_id: "credential", statement: "Current credential" },
            ],
          },
        ]),
        authority: "mixed",
        mixedGeneration: true,
        componentMeta: {
          "$/i/expertise/f/differentiator": {
            ...meta("$/i/expertise/f/differentiator"),
            authority: "creator_shop",
          },
          "$/i/expertise/f/proof_points/i/credential": {
            ...meta("$/i/expertise/f/proof_points/i/credential"),
            authority: "observed",
            freshness: "STALE",
          },
        },
      },
      communication: {
        ...intelligence("communication_profile", {
          tone_traits: [{ semantic_id: "clear", trait: "Clear" }],
          free_text_guidance: "Use practical explanations.",
          communication_constraints: null,
          primary_language: "en",
        }),
        readiness: "PARTIAL",
        authority: "mixed",
        mixedGeneration: true,
        componentMeta: {
          "$/f/tone_traits/i/clear": {
            ...meta("$/f/tone_traits/i/clear"),
            authority: "creator_shop",
          },
          "$/f/free_text_guidance": {
            ...meta("$/f/free_text_guidance"),
            authority: "confirmed",
            freshness: "STALE",
          },
          "$/f/primary_language": {
            ...meta("$/f/primary_language"),
            authority: "observed",
          },
        },
      },
    },
    audience: { state: intelligence("audience_personas", personas), personas },
    locations: [
      {
        locationId: "20000000-0000-4000-8000-000000000001",
        lifecycle: "ACTIVE",
        authority: "observed",
        observationFreshness: "POSSIBLY_STALE",
        reconciliationState: "MATCHED",
        lastObservedAt: "2026-08-26T00:00:00.000Z",
        name: null,
        address: "10 Main",
        city: "Town",
        zip: "123",
        latitude: null,
        longitude: null,
        contactDetails: null,
        editability: "POLICY_PENDING",
      },
    ],
    serviceability: {
      state: {
        ...intelligence("serviceability_profile", {
          overall_scope: null,
          coverage_is_heterogeneous: true,
          serviceable_markets: [
            {
              semantic_id: "local-supported-town",
              scope: "LOCAL",
              label: "Supported town",
              country_code: "US",
              locality: "Supported town",
              region: null,
              radius_km: null,
            },
          ],
          mixed_coverage_note: "Coverage differs by Offering.",
        }),
        readiness: "PARTIAL",
      },
    },
  });
}
