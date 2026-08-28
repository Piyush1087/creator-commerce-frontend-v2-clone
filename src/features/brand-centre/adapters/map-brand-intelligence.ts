import type {
  BrandField,
  BrandRuntimeActivity,
  BrandWorkspaceProjection,
} from "../contracts/brand-centre-brand.contracts";
import {
  componentNode,
  createNode,
  fieldPath,
  itemPath,
  presentNodes,
  type BrandNode,
} from "./brand-field-state";
import type { BrandObjectRuntimeActivities } from "./brand-processor-runtime";

/** Render only named, contract-owned components; never generic JSON or diagnostic keys. */
export function intelligenceNodes(activity: BrandRuntimeActivity) {
  function scalar(
    parent: BrandField,
    path: string,
    value: string | number | boolean | null | undefined,
    label: string,
  ) {
    const node = componentNode(parent, path, value, label, activity);
    if (node && value != null) node.text = String(value);
    return node;
  }
  function list<T extends { semantic_id: string }>(
    parent: BrandField,
    path: string,
    items: T[] | null | undefined,
    label: string,
    render: (item: T, path: string) => BrandNode[],
  ) {
    const node = componentNode(parent, path, items, label, activity);
    if (node && items)
      node.children = items.flatMap((item) =>
        render(item, itemPath(path, item.semantic_id)),
      );
    return node;
  }
  function valueList(
    parent: BrandField,
    path: string,
    items: { semantic_id: string; value: string }[] | null | undefined,
    label: string,
  ) {
    return list(parent, path, items, label, (item, itemPath) =>
      presentNodes([scalar(parent, itemPath, item.value, "")]),
    );
  }
  function traitList(
    parent: BrandField,
    path: string,
    items: { semantic_id: string; trait: string }[] | null | undefined,
    label: string,
  ) {
    return list(parent, path, items, label, (item, itemPath) =>
      presentNodes([scalar(parent, itemPath, item.trait, "")]),
    );
  }
  function root<T>(
    field: BrandField<T>,
    label: string,
    render: (value: T) => Array<BrandNode | null>,
  ) {
    const node = createNode(field, label, activity);
    if (field.current.kind === "VALUE")
      node.children = presentNodes(render(field.current.value));
    return node;
  }
  return { scalar, list, valueList, traitList, root };
}

export function mapStory(
  data: BrandWorkspaceProjection,
  activities: BrandObjectRuntimeActivities,
) {
  const {
    description,
    positioning,
    valueProposition,
    values,
    personality,
    differentiation,
  } = data.brandIdentity;
  const text = (
    field: BrandField<string>,
    label: string,
    activity: BrandRuntimeActivity,
  ) => {
    const node = createNode(field, label, activity);
    if (field.current.kind === "VALUE") node.text = field.current.value;
    return node;
  };
  const differentiationNodes = intelligenceNodes(
    activities.differentiation_and_proof,
  );
  const valueNodes = intelligenceNodes(activities.brand_values);
  const personalityNodes = intelligenceNodes(activities.brand_personality);
  return [
    text(description, "Brand narrative", activities.brand_description),
    text(positioning, "Positioning", activities.positioning),
    text(valueProposition, "Value Proposition", activities.value_proposition),
    differentiationNodes.root(
      differentiation,
      "Differentiation / Proof",
      (items) =>
        items.map((item) => {
          const path = itemPath("$", item.semantic_id);
          const { scalar, list } = differentiationNodes;
          const node = componentNode(
            differentiation,
            path,
            item,
            "",
            activities.differentiation_and_proof,
          )!;
          node.children = presentNodes([
            scalar(
              differentiation,
              fieldPath(path, "differentiator"),
              item.differentiator,
              "What sets the Brand apart",
            ),
            list(
              differentiation,
              fieldPath(path, "proof_points"),
              item.proof_points,
              "What supports this",
              (proof, proofPath) =>
                presentNodes([
                  scalar(
                    differentiation,
                    fieldPath(proofPath, "statement"),
                    proof.statement,
                    "",
                  ),
                ]),
            ),
          ]);
          return node;
        }),
    ),
    valueNodes.root(values, "Values", (items) =>
      items.map((item) =>
        valueNodes.scalar(
          values,
          itemPath("$", item.semantic_id),
          item.value,
          "",
        ),
      ),
    ),
    personalityNodes.root(personality, "Personality", (items) =>
      items.map((item) =>
        personalityNodes.scalar(
          personality,
          itemPath("$", item.semantic_id),
          item.trait,
          "",
        ),
      ),
    ),
  ];
}

export function mapCommunication(
  data: BrandWorkspaceProjection,
  activities: BrandObjectRuntimeActivities,
) {
  const activity = activities.communication_profile;
  const field = data.brandIdentity.communication;
  const { scalar, list, traitList, root } = intelligenceNodes(activity);
  return root(field, "", (value) => [
    traitList(field, "$/f/tone_traits", value.tone_traits, "Tone"),
    scalar(
      field,
      "$/f/free_text_guidance",
      value.free_text_guidance,
      "Guidance",
    ),
    list(
      field,
      "$/f/communication_constraints",
      value.communication_constraints,
      "Communication boundaries",
      (item, path) => presentNodes([scalar(field, path, item.constraint, "")]),
    ),
    scalar(
      field,
      "$/f/primary_language",
      value.primary_language,
      "Primary language",
    ),
  ]);
}

export function mapAudience(
  data: BrandWorkspaceProjection,
  activities: BrandObjectRuntimeActivities,
) {
  const activity = activities.audience_personas;
  const field = data.audience.state;
  const { scalar, valueList, root } = intelligenceNodes(activity);
  const node = root(field, "", (personas) =>
    personas.map((persona) => {
      const path = itemPath("$", persona.semantic_id);
      const card = componentNode(field, path, persona, "", activity)!;
      // The durable Persona path keys the card; a label change cannot remount it.
      card.children = presentNodes([
        scalar(field, fieldPath(path, "label"), persona.label, "Persona"),
        scalar(field, fieldPath(path, "summary"), persona.summary, "Summary"),
        valueList(
          field,
          fieldPath(path, "key_characteristics"),
          persona.key_characteristics,
          "Key characteristics",
        ),
        valueList(
          field,
          fieldPath(path, "motivations"),
          persona.motivations,
          "Motivations",
        ),
        valueList(
          field,
          fieldPath(path, "barriers_or_concerns"),
          persona.barriers_or_concerns,
          "Barriers or concerns",
        ),
        valueList(
          field,
          fieldPath(path, "trust_credibility_needs"),
          persona.trust_credibility_needs,
          "Trust and credibility needs",
        ),
        valueList(
          field,
          fieldPath(path, "creator_communication_implications"),
          persona.creator_communication_implications,
          "Creator communication implications",
        ),
      ]).filter((child) => child.presentation !== "EXPLICIT_NULL");
      return card;
    }),
  );
  node.emptyText = "No active Audience Personas yet.";
  return node;
}

export function mapVisualStyle(
  data: BrandWorkspaceProjection,
  activities: BrandObjectRuntimeActivities,
) {
  const activity = activities.visual_style_profile;
  const field = data.visualIdentity.style;
  const { scalar, traitList, valueList, list, root } =
    intelligenceNodes(activity);
  return root(field, "How Creator Shop reads your visual style", (value) => [
    scalar(field, "$/f/summary", value.summary, "Summary"),
    traitList(field, "$/f/style_traits", value.style_traits, "Traits"),
    valueList(
      field,
      "$/f/imagery_style/f/photographic_tendencies",
      value.imagery_style?.photographic_tendencies,
      "Photography",
    ),
    valueList(
      field,
      "$/f/imagery_style/f/subject_tendencies",
      value.imagery_style?.subject_tendencies,
      "Subjects",
    ),
    valueList(
      field,
      "$/f/imagery_style/f/mood_or_treatment",
      value.imagery_style?.mood_or_treatment,
      "Mood and treatment",
    ),
    valueList(
      field,
      "$/f/graphic_treatment/f/traits",
      value.graphic_treatment?.traits,
      "Graphic treatment",
    ),
    list(
      field,
      "$/f/visual_constraints",
      value.visual_constraints,
      "Brand requirements",
      (item, path) => {
        const node = scalar(field, path, item.rule, "");
        // A derived trait must never be promoted into a hard Brand requirement.
        return node?.field.authority === "confirmed" ? [node] : [];
      },
    ),
  ]);
}

export function mapServiceability(
  data: BrandWorkspaceProjection,
  activities: BrandObjectRuntimeActivities,
) {
  const activity = activities.serviceability_profile;
  const field = data.serviceability.state;
  const { scalar, list, root } = intelligenceNodes(activity);
  const scopeLabels = {
    LOCAL: "Local",
    REGIONAL: "Regional",
    COUNTRY: "Country",
    MULTI_COUNTRY: "Multiple countries",
    MULTI_COUNTRY_MEMBER: "Country",
    GLOBAL: "Global",
  };
  const node = root(field, "", (value) => [
    scalar(
      field,
      "$/f/overall_scope",
      value.overall_scope
        ? scopeLabels[value.overall_scope]
        : value.overall_scope,
      "Overall scope",
    ),
    value.coverage_is_heterogeneous === true
      ? scalar(
          field,
          "$/f/coverage_is_heterogeneous",
          "Coverage varies. Not every Offering is available across this area.",
          "Coverage",
        )
      : null,
    list(
      field,
      "$/f/serviceable_markets",
      value.serviceable_markets,
      "Serviceable markets",
      (market, path) => {
        const node = componentNode(field, path, market, "", activity)!;
        node.children = presentNodes([
          scalar(field, fieldPath(path, "label"), market.label, ""),
          scalar(
            field,
            fieldPath(path, "scope"),
            scopeLabels[market.scope],
            "Scope",
          ),
          scalar(
            field,
            fieldPath(path, "country_code"),
            market.country_code,
            "Country",
          ),
          scalar(field, fieldPath(path, "region"), market.region, "Region"),
          scalar(
            field,
            fieldPath(path, "locality"),
            market.locality,
            "Locality",
          ),
          scalar(
            field,
            fieldPath(path, "radius_km"),
            market.radius_km === null ? null : `${market.radius_km} km`,
            "Radius",
          ),
        ]).filter((child) => child.presentation !== "EXPLICIT_NULL");
        return [node];
      },
    ),
    scalar(
      field,
      "$/f/mixed_coverage_note",
      value.mixed_coverage_note,
      "Coverage note",
    ),
  ]);
  if (field.readiness === "PARTIAL")
    node.note =
      "Creator Shop has established some of your serviceable coverage and is still learning the rest.";
  return node;
}
