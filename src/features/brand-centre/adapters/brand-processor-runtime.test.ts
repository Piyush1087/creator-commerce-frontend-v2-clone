import { describe, expect, it } from "vitest";
import {
  BRAND_OWNED_OBJECT_COUNT,
  mapBrandObjectRuntimeActivities,
  shouldPollProcessorRuntime,
} from "./brand-processor-runtime";
import { mapBrandWorkspace } from "./map-brand-workspace";
import {
  consumerFixture,
  field,
  missing,
  setProcessorActivity,
} from "../testing/brand-consumer-fixtures";
import { BRAND_PROCESSOR_OBJECT_OWNERSHIP } from "../schemas/brand-processor-runtime";
import type { BrandNode } from "./brand-field-state";

function allNodes(nodes: BrandNode[]): BrandNode[] {
  return nodes.flatMap((node) => [node, ...allNodes(node.children ?? [])]);
}

function nodes(projection = consumerFixture()) {
  return allNodes(
    mapBrandWorkspace(projection).sections.flatMap((section) => section.nodes),
  );
}

describe("accepted Brand processor runtime mapping", () => {
  it("encodes the accepted ten-Object ownership explicitly", () => {
    expect(BRAND_OWNED_OBJECT_COUNT).toBe(10);
    expect(BRAND_PROCESSOR_OBJECT_OWNERSHIP).toEqual({
      brand_communication: ["communication_profile"],
      brand_meaning: ["brand_description", "positioning", "value_proposition"],
      brand_character: ["brand_values", "brand_personality"],
      audience_persona_synthesis: ["audience_personas"],
      brand_differentiation: ["differentiation_and_proof"],
      visual_style_synthesis: ["visual_style_profile"],
      serviceability_synthesis: ["serviceability_profile"],
    });
  });

  it("brand_meaning REFRESHING affects only its three Objects", () => {
    const projection = consumerFixture();
    setProcessorActivity(
      projection.processorRuntime,
      "brand_meaning",
      "REFRESHING",
      true,
    );
    const activity = mapBrandObjectRuntimeActivities(
      projection.processorRuntime,
    );
    expect(activity).toMatchObject({
      brand_description: "REFRESHING",
      positioning: "REFRESHING",
      value_proposition: "REFRESHING",
      brand_values: "NONE",
      communication_profile: "NONE",
    });
    expect(
      nodes(projection).find((node) => node.id === "positioning"),
    ).toMatchObject({ text: "Protected current", presentation: "CONTENT" });
  });

  it("brand_character activity does not affect Communication", () => {
    const projection = consumerFixture();
    projection.brandIdentity.values = missing("brand_values");
    setProcessorActivity(
      projection.processorRuntime,
      "brand_character",
      "LEARNING",
      false,
    );
    const mapped = nodes(projection);
    expect(
      mapped.find((node) => node.id === "brand_values")?.presentation,
    ).toBe("LEARNING");
    expect(
      mapped.find((node) => node.id === "communication_profile")?.presentation,
    ).toBe("CONTENT");
  });

  it.each([
    ["WAITING_FOR_DEPENDENCY", "WAITING_FOR_DEPENDENCY"],
    ["WAITING_FOR_EVIDENCE", "WAITING_FOR_EVIDENCE"],
  ] as const)(
    "preserves Audience %s distinctly without inventing UI",
    (activity, readiness) => {
      const projection = consumerFixture(0);
      projection.audience.state = missing("audience_personas");
      projection.audience.personas = [];
      setProcessorActivity(
        projection.processorRuntime,
        "audience_persona_synthesis",
        activity,
        false,
      );
      projection.processorRuntime.audience_persona_synthesis.readiness =
        readiness;
      expect(
        mapBrandObjectRuntimeActivities(projection.processorRuntime)
          .audience_personas,
      ).toBe("NONE");
      expect(
        nodes(projection).find((node) => node.id === "audience_personas"),
      ).toMatchObject({ presentation: "NOT_ESTABLISHED" });
      expect(
        projection.processorRuntime.audience_persona_synthesis.readiness,
      ).toBe(readiness);
    },
  );

  it("TEMPORARILY_UNAVAILABLE preserves current Differentiation", () => {
    const projection = consumerFixture();
    setProcessorActivity(
      projection.processorRuntime,
      "brand_differentiation",
      "TEMPORARILY_UNAVAILABLE",
      true,
    );
    expect(
      nodes(projection).find((node) => node.id === "differentiation_and_proof"),
    ).toMatchObject({ presentation: "CONTENT" });
  });

  it("STALE Visual Style remains visible while its processor is IDLE", () => {
    const projection = consumerFixture();
    projection.visualIdentity.style.freshness = "STALE";
    expect(
      nodes(projection).find((node) => node.id === "visual_style_profile"),
    ).toMatchObject({ presentation: "CONTENT", field: { freshness: "STALE" } });
  });

  it("Serviceability NO_CURRENT activity remains section-local", () => {
    const projection = consumerFixture();
    projection.serviceability.state = missing("serviceability_profile");
    setProcessorActivity(
      projection.processorRuntime,
      "serviceability_synthesis",
      "LEARNING",
      false,
    );
    const view = mapBrandWorkspace(projection);
    expect(view.locations).toEqual(projection.locations);
    expect(view.sections[6].nodes[0].presentation).toBe("LEARNING");
    expect(
      view.sections[0].nodes.every((node) => node.presentation === "CONTENT"),
    ).toBe(true);
  });

  it("aggregate activity never globally overrides Object activity", () => {
    const projection = consumerFixture();
    projection.runtimeActivity = "LEARNING";
    expect(
      nodes(projection).find((node) => node.id === "value_proposition")
        ?.presentation,
    ).toBe("NOT_ESTABLISHED");
    expect(
      nodes(projection).find((node) => node.id === "brand_description")
        ?.presentation,
    ).toBe("CONTENT");
  });

  it("canonical Visual state is independent of visual_style_synthesis", () => {
    const projection = consumerFixture();
    projection.visualIdentity.canonical.primaryLogo = field("primary_logo", {
      id: "asset-1",
      authority: "confirmed",
      revision: 1,
      lifecycle: "ACTIVE",
      url: "https://assets.example/logo.svg",
      label: "Approved mark",
      role: "LOGO",
    });
    projection.visualIdentity.style = missing("visual_style_profile");
    setProcessorActivity(
      projection.processorRuntime,
      "visual_style_synthesis",
      "LEARNING",
      false,
    );
    const mapped = nodes(projection);
    expect(
      mapped.find((node) => node.id === "primary_logo")?.presentation,
    ).toBe("CONTENT");
    expect(
      mapped.find((node) => node.id === "visual_style_profile")?.presentation,
    ).toBe("LEARNING");
  });

  it("mixed processor state never collapses the workspace globally", () => {
    const projection = consumerFixture();
    projection.audience.state = missing("audience_personas");
    projection.audience.personas = [];
    setProcessorActivity(
      projection.processorRuntime,
      "brand_meaning",
      "REFRESHING",
      true,
    );
    setProcessorActivity(
      projection.processorRuntime,
      "audience_persona_synthesis",
      "LEARNING",
      false,
    );
    setProcessorActivity(
      projection.processorRuntime,
      "serviceability_synthesis",
      "TEMPORARILY_UNAVAILABLE",
      true,
    );
    const view = mapBrandWorkspace(projection);
    expect(view.sections.map((section) => section.id)).toEqual([
      "identity",
      "story",
      "communication",
      "audience",
      "visual",
      "locations",
      "serviceability",
    ]);
    expect(view.sections[1].nodes[1].presentation).toBe("CONTENT");
    expect(view.sections[3].nodes[0].presentation).toBe("LEARNING");
    expect(view.sections[6].nodes[0].presentation).toBe("CONTENT");
  });

  it.each([
    "LEARNING",
    "REFRESHING",
    "READY_TO_RUN",
    "RETRY_SCHEDULED",
  ] as const)("polls while a processor reports %s", (activity) => {
    const projection = consumerFixture();
    setProcessorActivity(
      projection.processorRuntime,
      "brand_communication",
      activity,
    );
    expect(shouldPollProcessorRuntime(projection.processorRuntime)).toBe(true);
  });

  it.each([
    "IDLE",
    "WAITING_FOR_EVIDENCE",
    "WAITING_FOR_DEPENDENCY",
    "TEMPORARILY_UNAVAILABLE",
  ] as const)("does not poll indefinitely for %s alone", (activity) => {
    const projection = consumerFixture();
    setProcessorActivity(
      projection.processorRuntime,
      "brand_communication",
      activity,
    );
    expect(shouldPollProcessorRuntime(projection.processorRuntime)).toBe(false);
  });
});
