import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CampaignAttentionPanel } from "./CampaignAttentionPanel";
import { CampaignAssetsBriefsPanel } from "./CampaignAssetsBriefsPanel";
import {
  canDismissCanonicalWrite,
  canCreateCanonicalBrief,
  canEditCanonicalBrief,
  canLinkCanonicalAsset,
  discoveryCreatorContextLabel,
  resolveInitialWorkspace,
  surfaceStateMessage,
} from "./campaign-page-model";
import type { CampaignPageView, Capability } from "./types";

const enabled: Capability = { available: true, presentation: "ENABLED" };
const disabled: Capability = {
  available: false,
  presentation: "DISABLED",
  reasonCategory: "CAPABILITY_UNAVAILABLE",
};

function page(overrides?: Partial<CampaignPageView>): CampaignPageView {
  return {
    campaign: {
      id: "campaign-1",
      name: "Launch Campaign",
      lifecycleStatus: "PUBLISHED",
      creationSource: "MANUAL",
      assetCount: 1,
      canonicalBriefCount: 1,
      legacyProductCount: 0,
      legacyBriefCount: 0,
      capabilities: {
        view: enabled,
        edit: enabled,
        createBrief: enabled,
        publish: disabled,
        goLive: enabled,
      },
    },
    readiness: {
      ready: true,
      missingRequirements: [],
      remediation: [],
      activeAssetCount: 1,
      readyBriefCount: 1,
    },
    hydration: {
      outcome: "READY",
      executionReady: true,
      primaryFocus: "DISCOVERY",
      postLiveReadinessBlocked: false,
    },
    assetsBriefsSummary: {
      state: "READY",
      label: "Campaign Assets & Briefs",
      capability: enabled,
      assets: [
        {
          campaignAssetId: "asset-1",
          kind: "OFFERING",
          status: "ACTIVE",
          entityId: "offering-1",
          name: "Vitamin C Serum",
          subtype: "PRODUCT",
          imageUrl: null,
          briefs: [
            {
              briefId: "brief-1",
              name: "Morning routine",
              status: "PUBLISHED",
              creativeRequirements: "Show application in natural light.",
              deliverables: [
                {
                  deliverableId: "deliverable-1",
                  format: "REEL",
                  quantity: 2,
                  creativeRequirements: "Two vertical videos.",
                  publishingRequired: true,
                },
              ],
            },
          ],
        },
      ],
    },
    productsBriefsSummary: {
      authority: "LEGACY_COMPATIBILITY",
      state: "EMPTY",
      label: "Legacy Products & Briefs",
      capability: disabled,
      products: [],
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
        state: "READY",
        instantiated: true,
        visible: true,
        count: 1,
        expand: enabled,
      },
      {
        workspace: "applicants",
        state: "EMPTY",
        instantiated: false,
        visible: true,
        count: 0,
        expand: enabled,
      },
      {
        workspace: "collaborations",
        state: "EMPTY",
        instantiated: false,
        visible: true,
        count: 0,
        expand: enabled,
      },
    ],
    share: { capability: enabled, supportedChannels: ["COPY_LINK"] },
    details: {
      state: "READY",
      objective: null,
      platforms: null,
      visibilityScopes: [],
      compensationType: null,
      budgetPool: 1000,
      timelineType: null,
    },
    ...overrides,
  };
}

function renderPanel(view: CampaignPageView): string {
  return renderToStaticMarkup(
    createElement(CampaignAssetsBriefsPanel, {
      view,
      onLinkAsset: () => undefined,
      onCreateBrief: () => undefined,
      onEditBrief: () => undefined,
    }),
  );
}

function renderAttention(view: CampaignPageView): string {
  return renderToStaticMarkup(
    createElement(CampaignAttentionPanel, {
      view,
      onLinkAsset: () => undefined,
      onCreateBrief: () => undefined,
      onSelectWorkspace: () => undefined,
    }),
  );
}

describe("Campaign Page canonical presentation model", () => {
  it("renders the canonical Asset → Brief → Deliverable hierarchy", () => {
    const html = renderPanel(page());

    expect(html).toContain("Vitamin C Serum");
    expect(html).toContain("Morning routine");
    expect(html).toContain("REEL");
    expect(html).toContain("Quantity 2");
    expect(html).toContain("PRODUCT");
    expect(html).not.toContain(">OFFERING<");
    expect(html.indexOf("Vitamin C Serum")).toBeLessThan(
      html.indexOf("Morning routine"),
    );
    expect(html.indexOf("Morning routine")).toBeLessThan(
      html.indexOf("Quantity 2"),
    );
  });

  it("hydrates the accepted LIVE legacy-only state without inferring canonical IDs", () => {
    const view = page({
      campaign: {
        ...page().campaign,
        lifecycleStatus: "LIVE",
        assetCount: 0,
        canonicalBriefCount: 0,
        legacyProductCount: 1,
        legacyBriefCount: 1,
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
            message:
              "Create a canonical Brief beneath an active Campaign Asset.",
          },
        ],
        activeAssetCount: 0,
        readyBriefCount: 0,
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
            name: "Legacy Serum",
            briefs: [{ briefId: "legacy-brief-1", name: "Legacy Brief" }],
          },
        ],
      },
    });
    const html = renderPanel(view);

    expect(html).toContain("No canonical Campaign Assets are linked");
    expect(renderAttention(view)).toContain(
      "Link a canonical Campaign Asset from Brand Centre.",
    );
    expect(html).toContain("Legacy compatibility data");
    expect(html).toContain("Legacy Serum");
    expect(view.assetsBriefsSummary.assets).toEqual([]);
    expect(view.productsBriefsSummary.products[0].campaignAssetId).toBe(
      "legacy-product-1",
    );
  });

  it("keeps LIVE lifecycle distinct from readiness and follows projected remediation", () => {
    const view = page({
      campaign: { ...page().campaign, lifecycleStatus: "LIVE" },
      readiness: {
        ready: false,
        missingRequirements: ["canonical_brief"],
        remediation: [
          {
            requirement: "canonical_brief",
            message:
              "Create a canonical Brief beneath an active Campaign Asset.",
          },
        ],
        activeAssetCount: 1,
        readyBriefCount: 0,
      },
    });

    expect(renderAttention(view)).toContain("Lifecycle remains LIVE");
    expect(renderAttention(view)).toContain(">Create Brief</button>");
    expect(view.campaign.lifecycleStatus).toBe("LIVE");
  });

  it("hides canonical write affordances for terminal/read-only Campaigns", () => {
    const view = page({
      campaign: {
        ...page().campaign,
        lifecycleStatus: "ARCHIVED",
        capabilities: {
          ...page().campaign.capabilities,
          edit: disabled,
          createBrief: disabled,
        },
      },
      assetsBriefsSummary: {
        ...page().assetsBriefsSummary,
        capability: disabled,
      },
    });
    const html = renderPanel(view);

    expect(canLinkCanonicalAsset(view)).toBe(false);
    expect(canCreateCanonicalBrief(view)).toBe(false);
    expect(canEditCanonicalBrief(view)).toBe(false);
    expect(html).not.toContain(">Link Campaign Asset</button>");
    expect(html).not.toContain(">Create Brief</button>");
    expect(html).not.toContain(">Edit Brief</button>");
  });

  it("distinguishes unavailable surfaces from successful empty surfaces", () => {
    expect(surfaceStateMessage("UNAVAILABLE", "Discovery")).toBe(
      "Discovery is unavailable for this Campaign.",
    );
    expect(surfaceStateMessage("EMPTY", "Discovery")).toBe("No discovery yet.");
    expect(surfaceStateMessage("UNAVAILABLE", "Discovery")).not.toBe(
      surfaceStateMessage("EMPTY", "Discovery"),
    );
  });

  it("uses the backend workspace focus and exact lowercase workspace IDs", () => {
    const view = page({
      hydration: {
        outcome: "READY",
        executionReady: true,
        primaryFocus: "APPLICANTS",
        postLiveReadinessBlocked: false,
      },
    });

    expect(resolveInitialWorkspace(view)).toBe("applicants");
  });

  it("keeps canonical reporting unavailable without zero or translated metrics", () => {
    const view = page();

    expect(view.performanceSummary.state).toBe("UNAVAILABLE");
    expect(view.performanceSummary.metrics).toEqual([]);
    expect(JSON.stringify(view.performanceSummary)).not.toContain("roi");
    expect(JSON.stringify(view.performanceSummary)).not.toContain(
      "impressions",
    );
  });

  it("labels saved Campaign creators separately from provider recommendations", () => {
    expect(
      discoveryCreatorContextLabel({
        state: "READY",
        creators: [
          {
            campaignCreatorId: "creator-1",
            name: "Creator",
            category: "Beauty",
            followers: "10K",
            engagement: "4%",
            avatarInitials: "CR",
          },
        ],
        provider: {
          availability: "UNAVAILABLE",
          message: "Provider recommendations are unavailable.",
          results: [],
        },
      }),
    ).toBe("Saved Campaign creators — not current provider recommendations.");
  });

  it("prevents dismissing a canonical write while it is in flight", () => {
    expect(canDismissCanonicalWrite(false)).toBe(true);
    expect(canDismissCanonicalWrite(true)).toBe(false);
  });
});
