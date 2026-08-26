import type {
  BrandField,
  BrandRuntimeActivity,
  BrandWorkspaceProjection,
} from "../contracts/brand-centre-brand.contracts";
import { createNode, type BrandNode } from "./brand-field-state";
import {
  mapAudience,
  mapCommunication,
  mapServiceability,
  mapStory,
  mapVisualStyle,
} from "./map-brand-intelligence";

export const BRAND_SECTION_ORDER = [
  "identity",
  "story",
  "communication",
  "audience",
  "visual",
  "locations",
  "serviceability",
] as const;
export type BrandSectionId = (typeof BRAND_SECTION_ORDER)[number];
export type BrandSection = {
  id: BrandSectionId;
  title: string;
  nodes: BrandNode[];
};
export type BrandWorkspaceView = {
  brandId: string;
  readiness: BrandWorkspaceProjection["workspaceReadiness"];
  runtimeActivity: BrandRuntimeActivity;
  sections: BrandSection[];
  locations: BrandWorkspaceProjection["locations"];
};

function mapCanonicalVisual(data: BrandWorkspaceProjection): BrandNode[] {
  const visual = data.visualIdentity.canonical;
  // Canonical missing assets are not Intelligence learning and have no legacy fallback.
  const activity = "NONE";
  const logo = (field: typeof visual.primaryLogo, label: string) => {
    const node = createNode(field, label, activity);
    if (field.current.kind === "VALUE") {
      node.image = field.current.value.url;
      node.text = field.current.value.label ?? label;
    }
    return node;
  };
  const collection = <
    T extends {
      id: string;
      authority: BrandField["authority"];
      lifecycle: string;
    },
  >(
    field: BrandField<T[]>,
    label: string,
    render: (item: T) => { text: string; image?: string },
  ) => {
    const node = createNode(field, label, activity);
    if (field.current.kind === "VALUE")
      node.children = field.current.value.map((item) => ({
        ...createNode(
          {
            ...field,
            semanticId: item.id,
            current: { kind: "VALUE", value: item },
            authority: item.authority,
          },
          "",
          activity,
        ),
        ...render(item),
        note: item.lifecycle === "INACTIVE" ? "Inactive" : undefined,
      }));
    return node;
  };
  const font = (field: typeof visual.headingFont, label: string) => {
    const node = createNode(field, label, activity);
    if (field.current.kind === "VALUE") node.text = field.current.value.family;
    return node;
  };
  const typography = collection(
    visual.typography,
    "Approved typography",
    (item) => ({ text: [item.family, item.usage].filter(Boolean).join(" — ") }),
  );
  return [
    logo(visual.primaryLogo, "Primary logo"),
    collection(visual.secondaryMarks, "Alternate marks", (item) => ({
      text: item.label ?? "Alternate mark",
      image: item.url,
    })),
    collection(visual.palette, "Approved palette", (item) => ({
      text: [item.label, item.value, item.usage].filter(Boolean).join(" — "),
    })),
    font(visual.headingFont, "Primary Brand Typeface"),
    font(visual.bodyFont, "Supporting Brand Typeface"),
    typography,
    collection(visual.referenceImages, "Approved reference images", (item) => ({
      text: item.label ?? "Reference image",
      image: item.url,
    })),
  ];
}

export function mapBrandWorkspace(
  data: BrandWorkspaceProjection,
): BrandWorkspaceView {
  const activity = data.runtimeActivity;
  const anchor = (field: BrandField<string>, label: string) => {
    const node = createNode(field, label, "NONE");
    if (field.current.kind === "VALUE") node.text = field.current.value;
    return node;
  };
  const website = createNode(data.identity.website, "Website", "NONE");
  if (data.identity.website.current.kind === "VALUE") {
    website.href = data.identity.website.current.value.url;
    website.text = data.identity.website.current.value.displayDomain;
  }
  return {
    brandId: data.brandId,
    readiness: data.workspaceReadiness,
    runtimeActivity: activity,
    locations: data.locations,
    sections: [
      {
        id: "identity",
        title: "Brand identity",
        nodes: [
          anchor(data.identity.brandName, "Brand name"),
          website,
          anchor(data.details.industry, "Industry"),
          anchor(data.details.category, "Category"),
          anchor(data.details.primaryGeography, "Primary geography"),
          anchor(data.details.currency, "Currency"),
          ...data.identity.socialHandles.map((social) =>
            anchor(social.field, social.platform),
          ),
        ],
      },
      {
        id: "story",
        title: "Brand Story & Strategy",
        nodes: mapStory(data, activity),
      },
      {
        id: "communication",
        title: "How your Brand communicates",
        nodes: [mapCommunication(data, activity)],
      },
      {
        id: "audience",
        title: "Audience",
        nodes: [mapAudience(data, activity)],
      },
      {
        id: "visual",
        title: "Visual Identity",
        nodes: [
          {
            id: "canonical-brand-assets",
            label: "Your Brand assets",
            presentation: "CONTENT",
            children: mapCanonicalVisual(data),
          },
          mapVisualStyle(data, activity),
        ],
      },
      { id: "locations", title: "Locations", nodes: [] },
      {
        id: "serviceability",
        title: "Where you can serve customers",
        nodes: [mapServiceability(data, activity)],
      },
    ],
  };
}
