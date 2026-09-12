import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  BRAND_CENTRE_WORKSPACES,
  resolveBrandCentreWorkspace,
} from "./brand-centre-workspaces";

describe("Brand Centre shared workspace registry", () => {
  it("defines the frozen six-workspace order and canonical routes once", () => {
    expect(BRAND_CENTRE_WORKSPACES.map(({ label }) => label)).toEqual([
      "Overview",
      "Brand",
      "Offerings",
      "Instagram",
      "Market",
      "Recommendations",
    ]);
    expect(BRAND_CENTRE_WORKSPACES.map(({ route }) => route)).toEqual([
      "/brand-centre/overview",
      "/brand-centre",
      "/brand-centre/offerings",
      "/brand-centre/instagram",
      "/brand-centre/market",
      "/brand-centre/recommendations",
    ]);
  });

  it.each([
    ["/brand-centre", "brand"],
    ["/brand-centre/offerings", "offerings"],
    ["/brand-centre/offerings/offering-1", "offerings"],
    ["/brand-centre/instagram", "instagram"],
    ["/brand-centre/instagram/media/post-1", "instagram"],
    ["/brand-centre/market/segment", "market"],
    ["/brand-centre/recommendations/quarterly", "recommendations"],
  ])("matches %s without ambiguous prefixes", (pathname, expected) => {
    expect(resolveBrandCentreWorkspace(pathname)?.id).toBe(expected);
  });

  it.each([
    "/brand-centre-offerings",
    "/brand-centre/offerings-old",
    "/brand-centre/instagrammed",
    "/brand-centre/marketplace",
  ])("rejects the near-prefix route %s", (pathname) => {
    expect(resolveBrandCentreWorkspace(pathname)).toBeUndefined();
  });

  it("drives both desktop links and the mobile selector from the same registry", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/brand-centre/components/workspace-shell/BrandCentreWorkspaceShell.tsx",
      ),
      "utf8",
    );
    expect(source.match(/BRAND_CENTRE_WORKSPACES\.map/gu)).toHaveLength(2);
    expect(source).toContain('aria-label="Brand Centre workspaces"');
    expect(source).toContain('aria-label="Brand Centre workspace selector"');
    expect(source).toContain('aria-current=');
    expect(source).not.toContain('role="tab"');
  });

  it("uses the exact 767/768 CSS boundary with mutually exclusive controls", () => {
    const css = readFileSync(
      join(
        process.cwd(),
        "src/features/brand-centre/components/workspace-shell/brand-centre-workspace-shell.css",
      ),
      "utf8",
    );
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain(".brand-centre-workspace-navigation__desktop");
    expect(css).toContain("display: none");
    expect(css).not.toContain("100vw");
    expect(css).not.toContain("overflow-x: auto");
  });

  it("keeps pending workspace truth explicit without importing legacy content", () => {
    expect(
      BRAND_CENTRE_WORKSPACES.filter(
        ({ availability }) => availability === "CONTENT_PENDING",
      ).map(({ id }) => id),
    ).toEqual(["overview", "market", "recommendations"]);
    const routes = readFileSync(
      join(process.cwd(), "src/routes/app-routes.tsx"),
      "utf8",
    );
    expect(routes).toContain('title="Overview"');
    expect(routes).toContain('title="Market"');
    expect(routes).toContain('title="Recommendations"');
    expect(routes).not.toContain("IntelligenceGaps");
    expect(routes).not.toContain("CampaignPlanner");
  });
});
