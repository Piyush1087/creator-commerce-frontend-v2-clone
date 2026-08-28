import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  brandVisualFixture,
  type BrandVisualFamily,
} from "../../testing/brand-visual-fixtures";
import { mapBrandWorkspace } from "../../adapters/map-brand-workspace";
import { BrandWorkspaceView } from "./BrandWorkspaceView";
import { isLearningGroup } from "./brand-learning-presentation";

function render(family: BrandVisualFamily) {
  return renderToStaticMarkup(
    createElement(BrandWorkspaceView, {
      view: mapBrandWorkspace(brandVisualFixture(family)),
    }),
  );
}
describe("accepted Brand visual composition", () => {
  it("learning grouping never hides a current value or candidate notice", () => {
    const view = mapBrandWorkspace(brandVisualFixture("initial"));
    const story = view.sections.find((section) => section.id === "story")!;
    expect(isLearningGroup(story.nodes)).toBe(true);
    expect(
      isLearningGroup([
        { ...story.nodes[0], presentation: "CONTENT" },
        ...story.nodes.slice(1),
      ]),
    ).toBe(false);
    const field = story.nodes[0].field!;
    expect(
      isLearningGroup([
        {
          ...story.nodes[0],
          field: {
            ...field,
            candidate: {
              status: "AVAILABLE",
              count: 1,
              currentPreserved: false,
              summaryAvailable: false,
              rawCandidateVisible: false,
            },
          },
        },
      ]),
    ).toBe(false);
  });
  it.each(["initial", "progressive", "mature", "conflict"] as const)(
    "%s keeps seven semantic sections, canonical logo and no invented typefaces",
    (family) => {
      const html = render(family);
      expect([...html.matchAll(/data-brand-section=/gu)]).toHaveLength(7);
      expect(html).toContain("Canonical fixture mark");
      expect(html).toContain("Primary Brand Typeface");
      expect(html).not.toContain("Satoshi");
      expect(html).not.toContain("Source Sans 3");
    },
  );
  it("initial learning groups Story without five future loading cards", () => {
    const html = render("initial");
    expect(html).toContain('data-learning-area="story"');
    expect(html).not.toContain('data-semantic-id="positioning"');
    expect(html).not.toContain("progressbar");
  });
  it("progressive content retains narrative and localized learning", () => {
    const html = render("progressive");
    expect(html).toContain('data-semantic-id="positioning"');
    expect(html).toContain('data-learning-area="audience"');
    expect(html).not.toContain("building a deeper understanding");
  });
  it("mature Personas use durable cards and current labels as headings", () => {
    const html = render("mature");
    expect(html).toContain('data-persona-count="3"');
    expect(html).toContain(
      '<h3 class="brand-workspace-field__value">Early-stage treatment researchers</h3>',
    );
    expect(html).not.toContain("data-learning-area");
  });
  it("conflict is local and its notice follows protected current", () => {
    const html = render("conflict");
    expect([
      ...html.matchAll(/data-candidate-status="CONFLICT"/gu),
    ]).toHaveLength(1);
    expect(html.indexOf("Clinician-led fertility care")).toBeLessThan(
      html.indexOf("New information differs"),
    );
    expect(html).not.toContain("rawCandidate");
  });
});
