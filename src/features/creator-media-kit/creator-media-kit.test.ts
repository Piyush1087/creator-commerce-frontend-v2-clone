import { describe, expect, it } from "vitest";
import {
  creatorMediaKitSchema,
  callsToActionSchema,
  publicMediaKitSchema,
  verifiedMediaKitSchema,
  type MediaKitPdfSnapshot,
} from "./creator-media-kit.contracts";
import { mediaKitPdfText, renderMediaKitPdf } from "./creator-media-kit.pdf";

const identity = {
  name: "Ava Creator",
  avatarUrl: null,
  instagramHandle: "ava",
  headline: "Practical creator",
  bio: "Clear product stories.",
  niches: ["TECH"],
  visualStyle: ["CLEAN"],
};
const callsToAction = callsToActionSchema.parse([
  {
    action: "WORK_WITH_CREATOR",
    label: "Work with Creator",
    subtext: "Start a collaboration",
  },
  {
    action: "REVEAL_EMAIL_ID",
    label: "Reveal Email ID",
    subtext: "Agencies and email enquiries",
  },
]);
const composition = {
  state: "DRAFT" as const,
  identity,
  sections: {
    audience: {
      state: "PARTIAL",
      facts: [],
      observedAsOf: "2026-09-16T10:00:00.000Z",
    },
    content: {
      state: "READY",
      themes: [{ value: "Product education", postCount: 4 }],
      performance: [],
      representatives: [],
      observedAsOf: "2026-09-16T10:00:00.000Z",
    },
    portfolio: {
      state: "AVAILABLE",
      items: [
        {
          id: "portfolio-item:" + "a".repeat(64),
          title: "Launch story",
          kind: "UGC",
          sourceDestination: "https://example.com/work",
        },
      ],
      eligibleItems: [],
    },
    rateCard: {
      state: "CURRENT",
      currency: "INR",
      startingFrom: true,
      lines: [{ key: "REEL_VIDEO", amountMinor: 100000 }],
      standardConditions: true,
    },
    availability: {
      state: "AVAILABLE",
      basedIn: "IN",
      availability: "ACCEPTING_COLLABORATIONS",
      pausedUntil: null,
    },
  },
  callsToAction,
  viewer: { kind: "CREATOR" as const, role: "OWNER" as const },
};

describe("Creator Media Kit frontend contracts", () => {
  it("accepts canonical Creator data and rejects extra/private fields", () => {
    const creator = creatorMediaKitSchema.parse({
      contractVersion: "creator-media-kit-v3.1",
      actorRole: "OWNER",
      allowedActions: [
        "MEDIA_KIT_READ",
        "MEDIA_KIT_MANAGE",
        "MEDIA_KIT_PUBLISH",
        "MEDIA_KIT_PDF_DOWNLOAD",
      ],
      configuration: {
        lifecycle: "DRAFT",
        publicId: "a".repeat(32),
        publicPath: "/media-kit/" + "a".repeat(32),
        revision: 0,
        visibility: {
          audience: true,
          content: true,
          portfolio: true,
          rateCard: true,
        },
        publicVisuals: [],
        featuredPortfolioItemIds: [],
        publishedAt: null,
        unpublishedAt: null,
      },
      preview: composition,
    });
    expect(creator.configuration.lifecycle).toBe("DRAFT");
    expect(
      creatorMediaKitSchema.safeParse({ ...creator, token: "private" }).success,
    ).toBe(false);
  });

  it("keeps anonymous and verified projections structurally distinct", () => {
    const shell = publicMediaKitSchema.parse({
      contractVersion: "creator-media-kit-public-v3.1",
      publicId: "a".repeat(32),
      lifecycle: "LIVE",
      identity,
      visuals: [],
      callsToAction,
    });
    expect(shell).not.toHaveProperty("sections");
    expect(
      publicMediaKitSchema.safeParse({
        ...shell,
        sections: composition.sections,
      }).success,
    ).toBe(false);
    expect(
      verifiedMediaKitSchema.safeParse({
        ...composition,
        state: "LIVE",
        publicId: "a".repeat(32),
        viewer: { kind: "VERIFIED_BRAND", brandId: "brand-1" },
        contractVersion: "creator-media-kit-verified-v3.1",
      }).success,
    ).toBe(true);
  });

  it("renders a bounded point-in-time PDF with deterministic Unicode fallback", () => {
    const snapshot: MediaKitPdfSnapshot = {
      contractVersion: "creator-media-kit-pdf-v3.1",
      generatedOn: "2026-09-16T11:00:00.000Z",
      publicId: "a".repeat(32),
      projection: composition,
    };
    const rendered = renderMediaKitPdf(snapshot);
    expect(rendered.bytes.byteLength).toBeGreaterThan(500);
    expect(rendered.bytes.byteLength).toBeLessThanOrEqual(5 * 1024 * 1024);
    expect(rendered.pageCount).toBeGreaterThan(0);
    expect(mediaKitPdfText("₹100 — 🎥")).toBe("INR 100 - [unsupported]");
  });
});
