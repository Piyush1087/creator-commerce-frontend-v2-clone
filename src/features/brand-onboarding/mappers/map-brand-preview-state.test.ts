import { describe, expect, it } from "vitest";

import type {
  BrandPreviewPayload,
  BrandPreviewRuntimeProjection,
} from "../contracts/brand-preview.contracts";
import { mapBrandPreviewRuntimeToViewState } from "./map-brand-preview-state";

const preview: BrandPreviewPayload = {
  identity: {
    brandName: "Northstar Fertility Care",
    brandLogo: null,
    websiteUrl: "https://northstarfertility.example",
    displayDomain: "northstarfertility.example",
    confirmedIndustry: "HEALTHCARE",
    brandDescriptor: null,
  },
  understanding: {
    narrative:
      "Northstar Fertility Care presents treatment as a guided journey that people should be able to understand. Creator marketing can build informed confidence while respecting clinical boundaries.",
  },
  audiences: [
    {
      id: "audience-1",
      label: "Early-stage treatment researchers",
      whyItMatters: "People looking for clear context before they contact a clinic.",
    },
  ],
  opportunities: [
    {
      title: "Make the first step less intimidating",
      whyItMatters: "Clear educational creator content can reduce uncertainty before consultation.",
    },
  ],
  creatorStartingPoint: {
    archetypes: [
      {
        archetypeId: "doctor-led-explainers",
        label: "Doctor-led explainers",
        rationale: "Qualified clinicians can explain complex topics without weakening medical boundaries.",
      },
    ],
  },
};

describe("mapBrandPreviewRuntimeToViewState", () => {
  it("maps active analysis without inventing a phase", () => {
    const runtime: BrandPreviewRuntimeProjection = {
      state: "ANALYSIS_ACTIVE",
      phase: null,
      completeness: null,
      canRetry: false,
      preview: null,
      verificationContext: null,
    };

    expect(mapBrandPreviewRuntimeToViewState(runtime)).toEqual({
      state: "FAST_ANALYSIS_ACTIVE",
      phase: null,
    });
  });

  it("maps ready completeness and verification identity without changing payload density", () => {
    const runtime: BrandPreviewRuntimeProjection = {
      state: "PREVIEW_READY",
      phase: "PREPARING_PREVIEW",
      completeness: "PARTIAL",
      canRetry: false,
      preview,
      verificationContext: { brandProfileId: "brand-profile-1" },
    };

    const mapped = mapBrandPreviewRuntimeToViewState(runtime);
    expect(mapped.state).toBe("PREVIEW_READY");
    if (mapped.state !== "PREVIEW_READY") throw new Error("Expected PREVIEW_READY");
    expect(mapped.completeness).toBe("PARTIAL");
    expect(mapped.preview.audiences).toHaveLength(1);
    expect(mapped.preview.opportunities).toHaveLength(1);
    expect(mapped.preview.creatorStartingPoint.archetypes).toHaveLength(1);
    expect(mapped.brandProfileId).toBe("brand-profile-1");
  });

  it("keeps recoverable failure distinct from insufficient evidence", () => {
    const recoverable: BrandPreviewRuntimeProjection = {
      state: "PREVIEW_FAILED_RECOVERABLE",
      phase: null,
      completeness: null,
      canRetry: true,
      preview: null,
      verificationContext: null,
    };
    const notReady: BrandPreviewRuntimeProjection = {
      state: "PREVIEW_NOT_READY",
      phase: null,
      completeness: null,
      canRetry: false,
      preview: null,
      verificationContext: null,
    };

    expect(mapBrandPreviewRuntimeToViewState(recoverable)).toEqual({
      state: "ANALYSIS_RECOVERABLE_FAILURE",
      canRetry: true,
    });
    expect(mapBrandPreviewRuntimeToViewState(notReady)).toEqual({
      state: "PREVIEW_NOT_READY",
      canRetry: false,
    });
  });

  it("fails safe when a ready runtime result is structurally incomplete", () => {
    const runtime: BrandPreviewRuntimeProjection = {
      state: "PREVIEW_READY",
      phase: null,
      completeness: null,
      canRetry: false,
      preview: null,
      verificationContext: null,
    };

    expect(() => mapBrandPreviewRuntimeToViewState(runtime)).toThrow(
      /missing required data/i,
    );
  });
});
