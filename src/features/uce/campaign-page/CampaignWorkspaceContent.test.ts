import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ApplicantsWorkspaceContent,
  CollaborationWorkspaceContent,
  DiscoveryWorkspaceContent,
} from "./CampaignWorkspaceContent";
import {
  canonicalAssetKindLabel,
  isTerminalApplicationStatus,
} from "./campaign-page-presentation";
import { ReportingUnavailableContent } from "./ReportingDrawer";
import type { ApplicantsWorkspaceView, DiscoveryWorkspaceView } from "./types";

const noop = () => undefined;

function discovery(
  state: DiscoveryWorkspaceView["state"],
): DiscoveryWorkspaceView {
  return {
    state,
    creators:
      state === "READY"
        ? [
            {
              campaignCreatorId: "creator-1",
              name: "Saved Creator",
              category: "Beauty",
              followers: "10K",
              engagement: "4%",
              avatarInitials: "SC",
              contextLabel: "Saved",
            },
          ]
        : [],
    provider: {
      availability: "UNAVAILABLE",
      message: "Current provider recommendations are unavailable.",
      results: [],
    },
  };
}

function renderDiscovery(view?: DiscoveryWorkspaceView, error?: string) {
  return renderToStaticMarkup(
    createElement(DiscoveryWorkspaceContent, {
      discovery: view,
      error,
      busy: false,
      onRetry: noop,
      onOpenProfile: noop,
      onOpenOutreach: noop,
    }),
  );
}

describe("Campaign workspace presentation authority", () => {
  it("separates saved creators from unavailable provider recommendations", () => {
    const html = renderDiscovery(discovery("READY"));

    expect(html).toContain("Recommendation provider unavailable");
    expect(html).toContain(
      "Saved Campaign creators — not current provider recommendations.",
    );
    expect(html).toContain("Saved Creator");
    expect(html).not.toContain("Connect Meta");
    expect(html).not.toContain("Discover Creators");
    expect(html).not.toContain("Add Creator");
    expect(html).not.toContain("Match score");
    expect(html).not.toContain("Recommended because");
  });

  it("keeps Discovery empty, unavailable, loading, and error states distinct", () => {
    const empty = renderDiscovery(discovery("EMPTY"));
    const unavailable = renderDiscovery(discovery("UNAVAILABLE"));
    const loading = renderDiscovery();
    const error = renderDiscovery(undefined, "Network unavailable");

    expect(empty).toContain("No saved Campaign prospects");
    expect(empty).not.toContain("Discovery unavailable; this is not an empty");
    expect(unavailable).toContain("Discovery unavailable");
    expect(unavailable).toContain("not an empty creator result");
    expect(loading).toContain("Loading Discovery");
    expect(error).toContain("Network unavailable");
    expect(error).toContain("Retry Discovery");
  });

  it("renders Applicants as a decision queue and removes terminal decisions", () => {
    const applicants: ApplicantsWorkspaceView = {
      state: "READY",
      applicants: [
        {
          applicationId: "application-pending",
          campaignCreatorId: "creator-pending",
          name: "Pending Creator",
          category: "Beauty",
          followers: "12K",
          engagement: "3%",
          avatarInitials: "PC",
          applicationStatus: "PENDING",
          intelligenceStatus: "READY",
          intelligenceLabel: "Audience review complete",
          referenceAuthority: "LEGACY_COMPATIBILITY",
        },
        {
          applicationId: "application-approved",
          campaignCreatorId: "creator-approved",
          name: "Approved Creator",
          category: "Lifestyle",
          followers: "20K",
          engagement: "5%",
          avatarInitials: "AC",
          applicationStatus: "APPROVED",
          intelligenceStatus: "UNAVAILABLE",
          intelligenceLabel: "Intelligence unavailable",
        },
      ],
    };
    const html = renderToStaticMarkup(
      createElement(ApplicantsWorkspaceContent, {
        applicants,
        busy: false,
        onRetry: noop,
        onApprove: noop,
        onReject: noop,
        onOpenProfile: noop,
      }),
    );

    expect(html.match(/>Approve<\/button>/g)).toHaveLength(1);
    expect(html.match(/>Reject<\/button>/g)).toHaveLength(1);
    expect(html.match(/>Profile<\/button>/g)).toHaveLength(2);
    expect(html).toContain("Audience review complete");
    expect(html).toContain("Intelligence unavailable");
    expect(html).toContain("Legacy Application references");
    expect(html).toContain("no canonical Campaign Asset or Brief lineage");
    expect(html).not.toContain("91 / 100");
    expect(isTerminalApplicationStatus("APPROVED")).toBe(true);
    expect(isTerminalApplicationStatus("PENDING")).toBe(false);
  });

  it("keeps Collaboration as a compact reference-only surface", () => {
    const html = renderToStaticMarkup(
      createElement(CollaborationWorkspaceContent, {
        state: "READY",
        count: 2,
      }),
    );

    expect(html).toContain("2 Collaboration references are available");
    expect(html).toContain("does not own Collaboration lifecycle");
    expect(html).not.toContain("New Collaboration");
    expect(html).not.toContain("Review");
    expect(html).not.toContain("Filters");
    expect(html).not.toContain("Sort");
  });

  it("uses the projected subtype for OFFERING selection labels", () => {
    expect(
      canonicalAssetKindLabel({ kind: "OFFERING", subtype: "PRODUCT" }),
    ).toBe("PRODUCT");
    expect(canonicalAssetKindLabel({ kind: "BRAND", subtype: null })).toBe(
      "BRAND",
    );
  });

  it("keeps Reporting unavailable even if an unexpected metric is supplied", () => {
    const html = renderToStaticMarkup(
      createElement(ReportingUnavailableContent, {
        campaignName: "Launch",
        performanceSummary: {
          state: "READY",
          metrics: [
            {
              metricId: "forbidden",
              label: "ROI",
              value: "10x",
              tone: "success",
            },
          ],
        },
      }),
    );

    expect(html).toContain("Canonical reporting unavailable");
    expect(html).not.toContain("ROI");
    expect(html).not.toContain("10x");
  });
});
