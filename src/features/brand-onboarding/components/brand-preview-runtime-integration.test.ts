import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { mapBrandPreviewRuntimeToViewState } from "../mappers/map-brand-preview-state";
import { parseBrandPreviewRuntimeProjection } from "../schemas/brand-preview-runtime-schema";
import { BrandPreviewView } from "./brand-preview-view";

const backendReadyPartialProjection = {
  runId: "run-runtime-integration-1",
  state: "PREVIEW_READY",
  phase: "PREPARING_PREVIEW",
  completeness: "PARTIAL",
  retryAllowed: false,
  preview: {
    identity: {
      brand_name: "Northstar Trail",
      logo_url: null,
      website_url: "https://northstartrail.example",
      display_domain: "northstartrail.example",
      confirmed_industry: "D2C",
    },
    brand_descriptor: null,
    brand_understanding_narrative:
      "Northstar Trail makes outdoor progress feel practical and attainable. Creator marketing can turn expert guidance into useful proof for people choosing their next step.",
    audience_groups: [
      {
        id: "audience-public-1",
        label: "Confidence-building explorers",
        why_it_matters:
          "They need credible, practical guidance before choosing new outdoor products.",
      },
    ],
    creator_marketing_opportunities: [
      {
        title: "Turn guidance into visible progress",
        why_it_matters:
          "Creators can demonstrate useful decisions in real outdoor contexts.",
      },
    ],
    creator_archetype_recommendations: [
      {
        archetype_id: "EDUCATOR",
        label: "Outdoor educators",
        rationale:
          "Clear explainers can make technical choices useful to newer explorers.",
      },
    ],
  },
  verificationContext: { brandProfileId: "brand-profile-stable-1" },
};

describe("Brand Preview backend projection to rendered Preview", () => {
  it("transitions from analysis to the existing Preview view model with a reachable verification CTA", () => {
    const analysis = mapBrandPreviewRuntimeToViewState(
      parseBrandPreviewRuntimeProjection({
        state: "ANALYSIS_ACTIVE",
        phase: "FINDING_CREATOR_OPPORTUNITIES",
      }),
    );
    const ready = mapBrandPreviewRuntimeToViewState(
      parseBrandPreviewRuntimeProjection(backendReadyPartialProjection),
    );

    expect(analysis).toEqual({
      state: "FAST_ANALYSIS_ACTIVE",
      phase: "FINDING_CREATOR_OPPORTUNITIES",
    });
    expect(ready.state).toBe("PREVIEW_READY");
    if (ready.state !== "PREVIEW_READY")
      throw new Error("Expected ready view.");
    expect(ready.brandProfileId).toBe("brand-profile-stable-1");

    const html = renderToStaticMarkup(
      createElement(BrandPreviewView, {
        preview: ready.preview,
        completeness: ready.completeness,
        startingVerification: false,
        onVerify: vi.fn(),
      }),
    );

    for (const heading of [
      "The brand we found",
      "How we understand your brand",
      "Who you need to influence",
      "Where creators can make the difference",
      "Creators we&#x27;d start with",
    ]) {
      expect(html).toContain(heading);
    }
    expect(html.match(/class="bp-audience-item"/g)).toHaveLength(1);
    expect(html.match(/class="bp-opportunity-card"/g)).toHaveLength(1);
    expect(html.match(/class="bp-archetype-card"/g)).toHaveLength(1);
    expect(html).toContain(">Verify &amp; claim this brand</button>");
    expect(html).not.toMatch(
      /<button[^>]*disabled[^>]*>Verify &amp; claim this brand/,
    );
  });
});
