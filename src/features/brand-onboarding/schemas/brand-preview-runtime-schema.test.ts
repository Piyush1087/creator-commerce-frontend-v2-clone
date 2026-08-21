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
          brand_descriptor: "AI-assisted support workflows for growing customer-service teams",
        },
        understanding: {
          narrative:
            "Relaydesk AI helps support teams handle repetitive work while keeping people in control of complex conversations. Creator-led operator proof can make the workflow value believable in a noisy AI category.",
        },
        audiences: { groups: [oneAudience, { ...oneAudience, id: "audience-2" }] },
        opportunities: { items: [oneOpportunity, { ...oneOpportunity, title: "Create believable operator proof" }] },
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
