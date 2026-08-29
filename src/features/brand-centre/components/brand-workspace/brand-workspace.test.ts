import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { consumerFixture } from "../../testing/brand-consumer-fixtures";
import {
  BRAND_SECTION_ORDER,
  mapBrandWorkspace,
} from "../../adapters/map-brand-workspace";
import { BrandWorkspaceView } from "./BrandWorkspaceView";
import { BrandWorkspaceNavigation } from "./BrandWorkspaceNavigation";

function render(p = consumerFixture()) {
  return renderToStaticMarkup(
    createElement(BrandWorkspaceView, { view: mapBrandWorkspace(p) }),
  );
}

describe("functional Brand workspace", () => {
  it("AVAILABLE is a quiet notice without mutation controls", () => {
    const p = consumerFixture();
    p.brandIdentity.positioning.candidate.status = "AVAILABLE";
    const html = render(p);
    expect(html).toContain("Protected current");
    expect(html).toContain("Creator Shop found something new to review.");
    expect(html).not.toContain("<button");
  });
  it("renders the canonical section order once", () => {
    expect(
      [...render().matchAll(/data-brand-section="([^"]+)"/gu)].map((m) => m[1]),
    ).toEqual(BRAND_SECTION_ORDER);
  });
  it("current Positioning precedes confirmation and localized conflict; candidate is absent from DOM", () => {
    const html = render();
    const current = html.indexOf("Protected current");
    const confirmed = html.indexOf("Confirmed by your team", current);
    const notice = html.indexOf("New information differs", current);
    expect(current).toBeGreaterThan(0);
    expect(confirmed).toBeGreaterThan(current);
    expect(notice).toBeGreaterThan(confirmed);
    for (const forbidden of [
      "rawCandidateVisible",
      "SECRET CANDIDATE",
      "Accept update",
      "Reject",
      "processor",
      "jobId",
      "mixedGeneration",
      "Mixed authority",
      "AI-generated",
    ])
      expect(html).not.toContain(forbidden);
  });
  it.each([0, 1, 2, 3])("renders %i Persona cards and no filler", (count) => {
    const html = render(consumerFixture(count));
    expect([
      ...html.matchAll(
        /data-semantic-id="audience_personas:\$\/i\/active-persona-\d+"/gu,
      ),
    ]).toHaveLength(count);
    expect(html.includes("No active Audience Personas yet.")).toBe(count === 0);
  });
  it("omits intentionally absent / NOT_OWNED and keeps evaluated empty distinct from no current", () => {
    const p = consumerFixture();
    p.brandIdentity.description.current = { kind: "INTENTIONALLY_ABSENT" };
    p.brandIdentity.valueProposition.current = { kind: "NOT_OWNED" };
    p.brandIdentity.values.current = { kind: "VALUE", value: [] };
    const html = render(p);
    expect(html).not.toContain("Brand narrative");
    expect(html).not.toContain("Value Proposition");
    expect(html).toContain("No current items.");
    expect(html).toContain("Not established yet");
  });
  it("separates canonical assets from interpretation and never fabricates approved typography", () => {
    const html = render();
    expect(html.indexOf("Your Brand assets")).toBeLessThan(
      html.indexOf("How Creator Shop reads your visual style"),
    );
    expect(html).toContain("Primary Brand Typeface");
    expect(html).toContain("Derived minimal style");
    expect(html).not.toContain("Satoshi");
    expect(html).not.toContain("Source Sans 3");
    expect(html).not.toContain("<img");
  });
  it("canonical items use UUIDs, not display wording", () => {
    const p = consumerFixture();
    p.visualIdentity.canonical.palette.current = {
      kind: "VALUE",
      value: [
        {
          id: "30000000-0000-4000-8000-000000000001",
          label: "Approved color",
          value: "#123456",
          usage: null,
          authority: "confirmed",
          lifecycle: "ACTIVE",
          revision: 2,
        },
      ],
    };
    const html = render(p);
    expect(html).toContain(
      'data-semantic-id="30000000-0000-4000-8000-000000000001"',
    );
    expect(html).toContain(
      'data-location-id="20000000-0000-4000-8000-000000000001"',
    );
  });
  it("Brand and canonical Offerings have destinations; unavailable workspaces are natively disabled", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(BrandWorkspaceNavigation),
      ),
    );
    expect([...html.matchAll(/href="([^"]+)"/gu)].map((m) => m[1])).toEqual([
      "/brand-centre", "/brand-centre/offerings",
      "/brand-centre", "/brand-centre/offerings",
    ]);
    expect([...html.matchAll(/disabled=""/gu)]).toHaveLength(6);
    for (const legacy of [
      "Brand DNA",
      "Intelligence &amp; Gaps",
      "Campaign Planner",
    ])
      expect(html).not.toContain(legacy);
  });
});
