import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CanonicalCampaignPage } from "./CanonicalCampaignPage";
import type { CampaignPageView, Capability } from "./types";

const enabled: Capability = { available: true, presentation: "ENABLED" };
const disabled: Capability = {
  available: false,
  presentation: "DISABLED",
  reasonCategory: "CAPABILITY_UNAVAILABLE",
};
const hidden: Capability = {
  available: false,
  presentation: "HIDDEN",
  reasonCategory: "CAPABILITY_UNAVAILABLE",
};

const legacyOnlyLive: CampaignPageView = {
  campaign: {
    id: "campaign-legacy",
    name: "Legacy Live Campaign",
    lifecycleStatus: "LIVE",
    creationSource: "MANUAL",
    assetCount: 0,
    canonicalBriefCount: 0,
    legacyProductCount: 1,
    legacyBriefCount: 1,
    capabilities: {
      view: enabled,
      edit: enabled,
      createBrief: disabled,
      publish: disabled,
      goLive: disabled,
      pause: enabled,
      resume: disabled,
      share: disabled,
    },
  },
  readiness: {
    ready: false,
    missingRequirements: ["campaign_asset", "canonical_brief"],
    remediation: [
      {
        requirement: "campaign_asset",
        message: "Link a canonical Campaign Asset from Brand Centre.",
      },
      {
        requirement: "canonical_brief",
        message: "Create a canonical Brief beneath an active Campaign Asset.",
      },
    ],
    activeAssetCount: 0,
    readyBriefCount: 0,
  },
  hydration: {
    outcome: "POST_LIVE_READINESS_BLOCKED",
    executionReady: false,
    primaryFocus: "RESTORE_CAMPAIGN_READINESS",
    postLiveReadinessBlocked: true,
  },
  assetsBriefsSummary: {
    state: "EMPTY",
    label: "Campaign Assets & Briefs",
    capability: enabled,
    assets: [],
  },
  productsBriefsSummary: {
    authority: "LEGACY_COMPATIBILITY",
    state: "READY",
    label: "Legacy Products & Briefs",
    capability: disabled,
    products: [
      {
        campaignAssetId: "legacy-product-1",
        name: "Legacy Product",
        briefs: [{ briefId: "legacy-brief-1", name: "Legacy Brief" }],
      },
    ],
  },
  copilotSummary: { state: "UNAVAILABLE", actions: [] },
  performanceSummary: {
    state: "UNAVAILABLE",
    capability: disabled,
    metrics: [],
    message: "Reporting is not available for this Campaign yet.",
  },
  workspaces: [
    {
      workspace: "discovery",
      state: "UNAVAILABLE",
      instantiated: false,
      visible: true,
      count: 0,
      expand: disabled,
    },
    {
      workspace: "applicants",
      state: "UNAVAILABLE",
      instantiated: true,
      visible: true,
      count: 1,
      pendingCount: 1,
      rejectedCount: 0,
      expand: disabled,
    },
    {
      workspace: "collaborations",
      state: "UNAVAILABLE",
      instantiated: false,
      visible: true,
      count: 0,
      expand: hidden,
    },
  ],
  share: { capability: disabled, supportedChannels: [] },
  details: {
    state: "READY",
    objective: null,
    platforms: null,
    visibilityScopes: [],
    compensationType: null,
    budgetPool: 1000,
    timelineType: null,
  },
};

function renderPage(view: CampaignPageView): string {
  return renderToStaticMarkup(
    createElement(CanonicalCampaignPage, {
      view,
      onReload: async () => undefined,
      onOpenLegacyProduct: () => undefined,
      onOpenLegacyBrief: () => undefined,
    }),
  );
}

describe("CanonicalCampaignPage legacy-only integration", () => {
  it("hydrates successfully while preserving lifecycle, compatibility, and unavailable truth", () => {
    const html = renderPage(legacyOnlyLive);

    expect(html).toContain("Legacy Live Campaign");
    expect(html).toContain("LIVE");
    expect(html).toContain("Readiness required");
    expect(html).toContain("Lifecycle remains LIVE");
    expect(html).toContain("No canonical Campaign Assets are linked");
    expect(html).toContain("Legacy compatibility data");
    expect(html).toContain("Legacy Product");
    expect(html).toContain("Applicants");
    expect(html).toContain("Collaborations");
    expect(html).toContain("Discovery unavailable");
    expect(html).toContain("Reporting is not available for this Campaign yet.");
    expect(html).not.toContain("ROI");
    expect(html).not.toContain("ACTIVE");
  });

  it("renders Collaboration references without Campaign Page workflow controls", () => {
    const view: CampaignPageView = {
      ...legacyOnlyLive,
      hydration: {
        ...legacyOnlyLive.hydration,
        primaryFocus: "COLLABORATIONS",
      },
      workspaces: legacyOnlyLive.workspaces.map((workspace) =>
        workspace.workspace === "collaborations"
          ? { ...workspace, state: "READY", count: 1, expand: enabled }
          : workspace,
      ),
    };
    const html = renderPage(view);

    expect(html).toContain("Collaboration reference is available.");
    expect(html).toContain("does not own Collaboration lifecycle");
    expect(html).not.toContain("Complete Collaboration");
    expect(html).not.toContain("Message creator");
    expect(html).not.toContain("Settle payment");
  });

  it("renders the feature hierarchy and exactly one active workspace body", () => {
    const html = renderPage(legacyOnlyLive);

    expect(html.indexOf("Legacy Live Campaign")).toBeLessThan(
      html.indexOf("Setup requires attention"),
    );
    expect(html.indexOf("Setup requires attention")).toBeLessThan(
      html.indexOf("Campaign Asset → Brief"),
    );
    expect(html.indexOf("Campaign Asset → Brief")).toBeLessThan(
      html.indexOf('aria-label="Campaign workspaces"'),
    );
    expect(html.match(/role="tab"/g)).toHaveLength(3);
    expect(html.match(/role="tabpanel"/g)).toHaveLength(1);
    expect(html.match(/data-workspace=/g)).toHaveLength(1);
    expect(html).toMatch(
      /campaign-workspace-tab-applicants[\s\S]*?aurora-badge--neutral[^>]*>1<\/span>/,
    );
    expect(html).toContain("UNAVAILABLE");
    expect(
      html.match(
        /<button[^>]*id="campaign-workspace-tab-discovery"[^>]*>/,
      )?.[0],
    ).not.toContain("disabled");
    expect(html).not.toContain("POST_LIVE_READINESS_BLOCKED");
  });

  it("keeps compatibility and Copilot truth discoverable behind compact disclosures", () => {
    const html = renderPage(legacyOnlyLive);

    expect(html).toContain("Legacy compatibility data");
    expect(html).toContain("Show 1 legacy Product · 1 legacy Brief");
    expect(html).toMatch(
      /<details class="canonical-campaign-page__legacy-disclosure">/,
    );
    expect(html).toMatch(
      /<details class="canonical-campaign-page__secondary-disclosure">/,
    );
    expect(html).toContain("Campaign Copilot");
    expect(html).toContain("UNAVAILABLE");
    expect(html).toContain('aria-label="Campaign workspaces"');
    expect(html).toContain('id="campaign-active-workspace"');
  });

  it("keeps lifecycle and readiness separate and shows one lifecycle action", () => {
    const html = renderPage({
      ...legacyOnlyLive,
      share: { capability: enabled, supportedChannels: ["COPY_LINK"] },
    });

    expect(html).toContain(">LIVE</span>");
    expect(html).toContain(">Readiness required</span>");
    expect(html.match(/>Pause<\/button>/g)).toHaveLength(1);
    expect(html).not.toContain(">Publish</button>");
    expect(html).not.toContain(">Go live</button>");
    expect(html).toContain(">View details</button>");
    expect(html).toContain(">Share</button>");
  });

  it("adds persistent read-only framing for terminal Campaigns", () => {
    const terminal: CampaignPageView = {
      ...legacyOnlyLive,
      campaign: {
        ...legacyOnlyLive.campaign,
        lifecycleStatus: "ARCHIVED",
        capabilities: {
          ...legacyOnlyLive.campaign.capabilities,
          pause: disabled,
        },
      },
      assetsBriefsSummary: {
        ...legacyOnlyLive.assetsBriefsSummary,
        capability: disabled,
      },
    };
    const html = renderPage(terminal);

    expect(html).toContain("Read-only Campaign");
    expect(html).toContain(">ARCHIVED</span>");
    expect(html).not.toContain(">Pause</button>");
    expect(html).not.toContain(">Link Campaign Asset</button>");
  });

  it("keeps canonical Reporting metric-free", () => {
    const html = renderPage(legacyOnlyLive);

    expect(html).toContain("Reporting is not available for this Campaign yet.");
    expect(html).not.toContain("ROI");
    expect(html).not.toContain("ROAS");
    expect(html).not.toContain("Impressions");
    expect(html).not.toContain("View report");
  });
});
