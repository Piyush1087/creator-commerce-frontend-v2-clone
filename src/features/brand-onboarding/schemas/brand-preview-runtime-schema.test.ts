import { describe, expect, it } from "vitest";

import { parseBrandPreviewRuntimeProjection } from "./brand-preview-runtime-schema";

const baseIdentity = {
  brandName: "Northstar Fertility Care",
  brandLogo: null,
  websiteUrl: "https://northstarfertility.example",
  displayDomain: "northstarfertility.example",
  confirmedIndustry: "HEALTHCARE",
  brandDescriptor: null,
};

const oneAudience = {
  id: "audience-1",
  label: "Early-stage treatment researchers",
  whyItMatters:
    "People trying to understand when to seek specialist care before they are ready to contact a clinic.",
};

const oneOpportunity = {
  title: "Make the first step less intimidating",
  whyItMatters:
    "Credible educational voices can explain what typically happens before an initial consultation and reduce uncertainty.",
};

const oneArchetype = {
  archetypeId: "doctor-led-explainers",
  label: "Doctor-led explainers",
  rationale:
    "Qualified clinicians who communicate clearly can make complex fertility concepts easier to understand.",
};

// Sanitized from the backend's public PREVIEW_READY projection. The field
// names intentionally stay backend-native so this fixture guards the API seam.
function backendReadyProjection(
  completeness: "NORMAL" | "PARTIAL",
  options: { descriptor?: string | null; logo?: string | null } = {},
) {
  const repeatedCount = completeness === "NORMAL" ? 2 : 1;
  return {
    runId: "run-public-projection-1",
    state: "PREVIEW_READY",
    phase: "PREPARING_PREVIEW",
    completeness,
    retryAllowed: false,
    preview: {
      identity: {
        brand_name: "Northstar Trail",
        logo_url: options.logo ?? null,
        website_url: "https://northstartrail.example",
        display_domain: "northstartrail.example",
        confirmed_industry: "D2C",
      },
      brand_descriptor:
        options.descriptor === undefined
          ? "Practical trail guidance for people building confidence outdoors"
          : options.descriptor,
      brand_understanding_narrative:
        "Northstar Trail makes outdoor progress feel practical and attainable. Creator marketing can turn expert guidance into useful proof for people choosing their next step.",
      audience_groups: [
        {
          id: "audience-public-1",
          label: "Confidence-building explorers",
          why_it_matters:
            "They need credible, practical guidance before choosing new outdoor products.",
          evidence_refs: ["internal-ref-not-for-frontend"],
        },
        {
          id: "audience-public-2",
          label: "Experienced weekend hikers",
          why_it_matters:
            "They influence peers through grounded advice from repeat experience.",
        },
      ].slice(0, repeatedCount),
      creator_marketing_opportunities: [
        {
          title: "Turn guidance into visible progress",
          why_it_matters:
            "Creators can demonstrate useful decisions in real outdoor contexts.",
          confidence: 0.91,
        },
        {
          title: "Build trust through field-tested proof",
          why_it_matters:
            "Credible demonstrations can make product value easier to assess.",
        },
      ].slice(0, repeatedCount),
      creator_archetype_recommendations: [
        {
          archetype_id: "EDUCATOR",
          label: "Outdoor educators",
          rationale:
            "Clear explainers can make technical choices useful to newer explorers.",
          provider: "internal-provider-not-for-frontend",
        },
        {
          archetype_id: "PRACTITIONER",
          label: "Field-tested practitioners",
          rationale:
            "Experienced practitioners can show how advice holds up in real use.",
        },
      ].slice(0, repeatedCount),
    },
    verificationContext: { brandProfileId: "brand-profile-public-1" },
  };
}

function readyProjection(overrides: Record<string, unknown> = {}) {
  return {
    state: "PREVIEW_READY",
    phase: "PREPARING_PREVIEW",
    completeness: "PARTIAL",
    canRetry: false,
    preview: {
      identity: baseIdentity,
      understanding: {
        narrative:
          "Northstar Fertility Care positions the treatment journey as something patients should be able to understand, not simply endure. Creator marketing therefore needs to build informed confidence without reducing care decisions to promotional claims.",
      },
      audiences: [oneAudience],
      opportunities: [oneOpportunity],
      creatorStartingPoint: { archetypes: [oneArchetype] },
    },
    verificationContext: { brandProfileId: "brand-profile-1" },
    ...overrides,
  };
}

describe("parseBrandPreviewRuntimeProjection", () => {
  it("accepts an active projection with a truthful normalized phase", () => {
    const parsed = parseBrandPreviewRuntimeProjection({
      state: "ANALYSIS_ACTIVE",
      phase: "LEARNING_AUDIENCE",
    });

    expect(parsed.state).toBe("ANALYSIS_ACTIVE");
    expect(parsed.phase).toBe("LEARNING_AUDIENCE");
    expect(parsed.preview).toBeNull();
  });

  it("accepts generic active analysis when no fine-grained phase is available", () => {
    const parsed = parseBrandPreviewRuntimeProjection({
      state: "ANALYSIS_ACTIVE",
      phase: null,
    });

    expect(parsed.phase).toBeNull();
  });

  it("accepts PREVIEW_READY PARTIAL with the canonical 1/1/1 floor and no optional identity enrichment", () => {
    const parsed = parseBrandPreviewRuntimeProjection(readyProjection());

    expect(parsed.state).toBe("PREVIEW_READY");
    expect(parsed.completeness).toBe("PARTIAL");
    expect(parsed.preview?.identity.brandLogo).toBeNull();
    expect(parsed.preview?.identity.brandDescriptor).toBeNull();
    expect(parsed.preview?.audiences).toHaveLength(1);
    expect(parsed.preview?.opportunities).toHaveLength(1);
    expect(parsed.preview?.creatorStartingPoint.archetypes).toHaveLength(1);
    expect(parsed.verificationContext?.brandProfileId).toBe("brand-profile-1");
  });

  it("normalizes the exact backend PREVIEW_READY NORMAL public projection", () => {
    const parsed = parseBrandPreviewRuntimeProjection(
      backendReadyProjection("NORMAL"),
    );

    expect(parsed.state).toBe("PREVIEW_READY");
    expect(parsed.completeness).toBe("NORMAL");
    expect(parsed.preview?.identity.brandDescriptor).toBe(
      "Practical trail guidance for people building confidence outdoors",
    );
    expect(parsed.preview?.understanding.narrative).toMatch(/attainable/);
    expect(parsed.preview?.audiences).toHaveLength(2);
    expect(parsed.preview?.opportunities).toHaveLength(2);
    expect(parsed.preview?.creatorStartingPoint.archetypes).toHaveLength(2);
    expect(
      parsed.preview?.creatorStartingPoint.archetypes[0]?.archetypeId,
    ).toBe("EDUCATOR");
    expect(parsed.verificationContext?.brandProfileId).toBe(
      "brand-profile-public-1",
    );
    expect(parsed.preview?.audiences[0]).not.toHaveProperty("evidence_refs");
    expect(parsed.preview?.opportunities[0]).not.toHaveProperty("confidence");
    expect(
      parsed.preview?.creatorStartingPoint.archetypes[0],
    ).not.toHaveProperty("provider");
  });

  it("normalizes the exact backend PREVIEW_READY PARTIAL 1/1/1 projection with optional identity fields absent", () => {
    const parsed = parseBrandPreviewRuntimeProjection(
      backendReadyProjection("PARTIAL", { descriptor: null, logo: null }),
    );

    expect(parsed.completeness).toBe("PARTIAL");
    expect(parsed.preview?.identity.brandLogo).toBeNull();
    expect(parsed.preview?.identity.brandDescriptor).toBeNull();
    expect(parsed.preview?.audiences).toHaveLength(1);
    expect(parsed.preview?.opportunities).toHaveLength(1);
    expect(parsed.preview?.creatorStartingPoint.archetypes).toHaveLength(1);
    expect(parsed.verificationContext?.brandProfileId).toBe(
      "brand-profile-public-1",
    );
  });

  it("accepts snake-case bounded payload fields without changing semantics", () => {
    const parsed = parseBrandPreviewRuntimeProjection({
      state: "PREVIEW_READY",
      phase: null,
      completeness: "NORMAL",
      payload: {
        identity: {
          brand_name: "Relaydesk AI",
          brand_logo: null,
          website_url: "https://relaydesk.example",
          display_domain: "relaydesk.example",
          confirmed_industry: "SAAS_AI",
          brand_descriptor:
            "AI-assisted support workflows for growing customer-service teams",
        },
        understanding: {
          narrative:
            "Relaydesk AI helps support teams handle repetitive work while keeping people in control of complex conversations. Creator-led operator proof can make the workflow value believable in a noisy AI category.",
        },
        audiences: {
          groups: [oneAudience, { ...oneAudience, id: "audience-2" }],
        },
        opportunities: {
          items: [
            oneOpportunity,
            { ...oneOpportunity, title: "Create believable operator proof" },
          ],
        },
        creator_starting_point: {
          archetypes: [
            oneArchetype,
            {
              archetype_id: "operator-led-b2b",
              label: "Operator-led B2B creators",
              rationale:
                "Working operators can explain support workflow value in language buyers already use.",
            },
          ],
        },
      },
      verification_context: { brand_profile_id: "brand-profile-2" },
    });

    expect(parsed.completeness).toBe("NORMAL");
    expect(parsed.preview?.identity.confirmedIndustry).toBe("SAAS_AI");
    expect(parsed.preview?.audiences).toHaveLength(2);
    expect(parsed.verificationContext?.brandProfileId).toBe("brand-profile-2");
  });

  it("accepts a POST_PROFILE domain as website_url", () => {
    const domainOnly = backendReadyProjection("PARTIAL");
    (
      domainOnly.preview.identity as { website_url: string }
    ).website_url = "perniaspopupshop.com";

    const parsed = parseBrandPreviewRuntimeProjection(domainOnly);

    expect(parsed.preview?.identity.websiteUrl).toBe(
      "https://perniaspopupshop.com/",
    );
  });

  it("rejects PREVIEW_READY when a mandatory repeated block is empty", () => {
    const broken = readyProjection();
    (broken.preview as { audiences: unknown[] }).audiences = [];

    expect(() => parseBrandPreviewRuntimeProjection(broken)).toThrow();
  });

  it("requires explicit retry authority for recoverable failure", () => {
    expect(() =>
      parseBrandPreviewRuntimeProjection({
        state: "PREVIEW_FAILED_RECOVERABLE",
        phase: null,
        canRetry: false,
      }),
    ).toThrow(/authorize retry/i);

    expect(
      parseBrandPreviewRuntimeProjection({
        state: "PREVIEW_FAILED_RECOVERABLE",
        phase: null,
        canRetry: true,
      }).canRetry,
    ).toBe(true);
  });

  it("keeps PREVIEW_NOT_READY retry authority explicit", () => {
    const parsed = parseBrandPreviewRuntimeProjection({
      state: "PREVIEW_NOT_READY",
      phase: null,
      canRetry: false,
    });

    expect(parsed.state).toBe("PREVIEW_NOT_READY");
    expect(parsed.canRetry).toBe(false);
  });
});
