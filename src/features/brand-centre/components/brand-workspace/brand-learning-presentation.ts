import type { BrandNode } from "../../adapters/brand-field-state";

// Visual grouping only: never infer activity from missing data or readiness.
export function isLearningGroup(nodes: BrandNode[]) {
  return (
    nodes.length > 0 &&
    nodes.every(
      (node) =>
        node.presentation === "LEARNING" &&
        (!node.field?.candidate || node.field.candidate.status === "NONE"),
    )
  );
}
