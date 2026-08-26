import type {
  BrandField,
  BrandFieldMeta,
  BrandRuntimeActivity,
} from "../contracts/brand-centre-brand.contracts";
import { encodeComponentSegment } from "../contracts/brand-component-path";

export type FieldPresentation =
  | "CONTENT"
  | "EMPTY"
  | "EXPLICIT_NULL"
  | "OMITTED"
  | "NOT_OWNED"
  | "LEARNING"
  | "NOT_ESTABLISHED"
  | "NOT_EVALUATED"
  | "TEMPORARILY_UNAVAILABLE";
export type BrandNode = {
  id: string;
  label: string;
  field?: BrandField;
  presentation: FieldPresentation;
  text?: string;
  href?: string;
  image?: string;
  children?: BrandNode[];
  note?: string;
  emptyText?: string;
};

export function fieldPresentation(
  field: BrandField,
  activity: BrandRuntimeActivity,
): FieldPresentation {
  switch (field.current.kind) {
    case "VALUE":
      return Array.isArray(field.current.value) &&
        field.current.value.length === 0
        ? "EMPTY"
        : "CONTENT";
    case "EXPLICIT_NULL":
      return "EXPLICIT_NULL";
    case "INTENTIONALLY_ABSENT":
      return "OMITTED";
    case "NOT_OWNED":
      return "NOT_OWNED";
    case "NO_CURRENT":
    case "NOT_EVALUATED":
      if (activity === "LEARNING") return "LEARNING";
      if (activity === "TEMPORARILY_UNAVAILABLE")
        return "TEMPORARILY_UNAVAILABLE";
      return field.current.kind === "NOT_EVALUATED"
        ? "NOT_EVALUATED"
        : "NOT_ESTABLISHED";
  }
}

export const authorityCopy: Record<BrandFieldMeta["authority"], string | null> =
  {
    observed: null,
    creator_shop: null,
    confirmed: "Confirmed by your team",
    protected: "Contact support to change",
    system_managed: null,
    mixed: null,
  };

/** Typed paths match the backend codec. Identity is never derived from display wording. */
export const fieldPath = (path: string, field: string) =>
  `${path}/f/${encodeComponentSegment(field)}`;
export const itemPath = (path: string, id: string) =>
  `${path}/i/${encodeComponentSegment(id)}`;

export function componentField<T>(
  parent: BrandField,
  path: string,
  value: T | null,
): BrandField<T> {
  let ancestor = path;
  let meta: BrandFieldMeta | undefined;
  while (!meta) {
    meta = parent.componentMeta?.[ancestor];
    if (ancestor === "$") break;
    ancestor = ancestor.slice(
      0,
      ancestor.lastIndexOf("/", ancestor.lastIndexOf("/") - 1),
    );
  }
  // Never invent uniform child authority/freshness from a mixed Object summary.
  const resolved = meta ?? {
    ...parent,
    authority: parent.authority,
    freshness:
      parent.mixedGeneration || parent.authority === "mixed"
        ? "UNKNOWN"
        : parent.freshness,
  };
  return {
    semanticId: path,
    readiness: resolved.readiness,
    resultReadiness: resolved.resultReadiness,
    authority: resolved.authority,
    freshness: resolved.freshness,
    editability: resolved.editability,
    candidate: ancestor === path && meta ? meta.candidate : undefined,
    current:
      value === null ? { kind: "EXPLICIT_NULL" } : { kind: "VALUE", value },
  };
}

export function createNode<T>(
  field: BrandField<T>,
  label: string,
  activity: BrandRuntimeActivity,
  id = field.semanticId,
): BrandNode & { field: BrandField<T> } {
  return { id, label, field, presentation: fieldPresentation(field, activity) };
}

export function componentNode<T>(
  parent: BrandField,
  path: string,
  value: T | null | undefined,
  label: string,
  activity: BrandRuntimeActivity,
): (BrandNode & { field: BrandField<T> }) | null {
  if (value === undefined) return null; // Assembled omission is not a fabricated NO_CURRENT subfield.
  return createNode(
    componentField(parent, path, value),
    label,
    activity,
    `${parent.semanticId}:${path}`,
  );
}

export function presentNodes(nodes: Array<BrandNode | null>): BrandNode[] {
  return nodes.filter((node): node is BrandNode => node !== null);
}
