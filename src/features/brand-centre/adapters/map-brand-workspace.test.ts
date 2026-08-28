import { describe, expect, it } from "vitest";
import {
  consumerFixture,
  field,
  meta,
} from "../testing/brand-consumer-fixtures";
import {
  authorityCopy,
  componentField,
  fieldPresentation,
  type BrandNode,
} from "./brand-field-state";
import { BRAND_SECTION_ORDER, mapBrandWorkspace } from "./map-brand-workspace";

function allNodes(nodes: BrandNode[]): BrandNode[] {
  return nodes.flatMap((node) => [node, ...allNodes(node.children ?? [])]);
}
const nodes = (p = consumerFixture()) =>
  allNodes(mapBrandWorkspace(p).sections.flatMap((s) => s.nodes));

describe("Brand workspace semantic adapter", () => {
  it.each(["LEARNING", "REFRESHING", "TEMPORARILY_UNAVAILABLE"] as const)(
    "%s activity never replaces existing semantic values",
    (runtimeActivity) => {
      const p = consumerFixture();
      p.runtimeActivity = runtimeActivity;
      const view = mapBrandWorkspace(p);
      expect(view.runtimeActivity).toBe(runtimeActivity);
      expect(view.sections[1].nodes[1]).toMatchObject({
        text: "Protected current",
        presentation: "CONTENT",
        field: { freshness: "STALE", resultReadiness: "READY" },
      });
    },
  );
  it("preserves exact section order and independent scalar maturity", () => {
    const view = mapBrandWorkspace(consumerFixture());
    expect(view.sections.map((s) => s.id)).toEqual(BRAND_SECTION_ORDER);
    expect(nodes().find((n) => n.id === "brand_description")?.text).toBe(
      "Current Brand description",
    );
    expect(
      nodes().find((n) => n.id === "value_proposition")?.presentation,
    ).toBe("NOT_ESTABLISHED");
  });
  it.each([
    ["EXPLICIT_NULL", "EXPLICIT_NULL"],
    ["INTENTIONALLY_ABSENT", "OMITTED"],
    ["NO_CURRENT", "NOT_ESTABLISHED"],
    ["NOT_EVALUATED", "NOT_EVALUATED"],
    ["NOT_OWNED", "NOT_OWNED"],
  ] as const)("maps %s distinctly", (kind, presentation) => {
    expect(
      fieldPresentation({ ...meta("test"), current: { kind } }, "NONE"),
    ).toBe(presentation);
  });
  it("empty collection is evaluated, never a loading placeholder", () => {
    expect(fieldPresentation(field("values", []), "LEARNING")).toBe("EMPTY");
    expect(
      fieldPresentation(
        { ...meta("test"), current: { kind: "NO_CURRENT" } },
        "LEARNING",
      ),
    ).toBe("LEARNING");
    expect(
      fieldPresentation(
        { ...meta("test"), current: { kind: "NOT_EVALUATED" } },
        "TEMPORARILY_UNAVAILABLE",
      ),
    ).toBe("TEMPORARILY_UNAVAILABLE");
  });
  it.each([0, 1, 2, 3])(
    "renders exactly %i durable Personas without filler",
    (count) => {
      const p = consumerFixture(count);
      const audience = mapBrandWorkspace(p).sections.find(
        (s) => s.id === "audience",
      )!.nodes[0];
      expect(audience.children).toHaveLength(count);
      expect(audience.children?.map((n) => n.id)).toEqual(
        p.audience.personas.map(
          (p) => `audience_personas:$/i/${p.semantic_id}`,
        ),
      );
    },
  );
  it("Persona IDs survive label edits and reordering", () => {
    const p = consumerFixture(3);
    const before = nodes(p)
      .filter((n) => /^audience_personas:\$\/i\/[^/]+$/u.test(n.id))
      .map((n) => n.id);
    p.audience.personas.reverse();
    p.audience.personas[0].label = "New wording";
    if (p.audience.state.current.kind === "VALUE")
      p.audience.state.current.value = p.audience.personas;
    const after = nodes(p)
      .filter((n) => /^audience_personas:\$\/i\/[^/]+$/u.test(n.id))
      .map((n) => n.id);
    expect(after).toEqual(before.reverse());
  });
  it("retains confirmed current, candidate notice and stale freshness independently", () => {
    const positioning = nodes().find((n) => n.id === "positioning")!;
    expect(positioning.text).toBe("Protected current");
    expect(positioning.field).toMatchObject({
      resultReadiness: "READY",
      authority: "confirmed",
      freshness: "STALE",
      candidate: { status: "CONFLICT", rawCandidateVisible: false },
    });
    expect(positioning.presentation).toBe("CONTENT");
  });
  it("preserves distinct proof, differentiator and Communication metadata", () => {
    const all = nodes();
    expect(
      all.find((n) => n.id.endsWith("/f/differentiator"))?.field?.authority,
    ).toBe("creator_shop");
    expect(
      all.find((n) => n.id.endsWith("/i/credential/f/statement"))?.field,
    ).toMatchObject({ authority: "observed", freshness: "STALE" });
    expect(
      all.find((n) => n.id === "communication_profile:$/f/free_text_guidance")
        ?.field,
    ).toMatchObject({ authority: "confirmed", freshness: "STALE" });
    expect(
      all.find((n) => n.id === "communication_profile:$/f/primary_language")
        ?.field?.authority,
    ).toBe("observed");
    expect(
      all.find(
        (n) => n.id === "communication_profile:$/f/communication_constraints",
      )?.presentation,
    ).toBe("EXPLICIT_NULL");
    expect(
      componentField(
        { ...field("mixed", {}), authority: "mixed", mixedGeneration: true },
        "$/f/no_meta",
        "value",
      ).freshness,
    ).toBe("UNKNOWN");
    expect(authorityCopy.mixed).toBeNull();
    expect(authorityCopy.protected).toBe("Contact support to change");
  });
  it("missing canonical assets remain missing beside usable derived style", () => {
    const all = nodes();
    expect(all.find((n) => n.id === "primary_logo")?.presentation).toBe(
      "NOT_ESTABLISHED",
    );
    expect(all.find((n) => n.id === "approved_palette")?.presentation).toBe(
      "NOT_ESTABLISHED",
    );
    expect(
      all.find((n) => n.id === "visual_style_profile:$/f/summary")?.text,
    ).toBe("Derived minimal style");
    expect(all.some((n) => n.image)).toBe(false);
  });
  it("Locations retain durable identity and never fill Serviceability", () => {
    const p = consumerFixture();
    p.serviceability.state.current = { kind: "NO_CURRENT" };
    p.serviceability.state.readiness = "NOT_READY";
    const view = mapBrandWorkspace(p);
    expect(view.locations).toEqual(p.locations);
    expect(view.sections[6].nodes[0]).toMatchObject({
      presentation: "NOT_ESTABLISHED",
    });
    expect(view.sections[6].nodes[0].children).toBeUndefined();
  });
  it("partial Serviceability preserves heterogeneous coverage and market identity", () => {
    const all = nodes();
    expect(
      all.find((n) => n.id === "serviceability_profile:$/f/serviceable_markets")
        ?.children?.[0].id,
    ).toBe(
      "serviceability_profile:$/f/serviceable_markets/i/local-supported-town",
    );
    expect(
      all.find((n) => n.id.endsWith("/f/coverage_is_heterogeneous"))?.text,
    ).toContain("Not every Offering");
    expect(all.find((n) => n.id.endsWith("/f/mixed_coverage_note"))?.text).toBe(
      "Coverage differs by Offering.",
    );
  });
});
