import type { BrandNode } from "../../adapters/brand-field-state";
import { Card } from "../../../../design-system/aurora";
import { BrandField } from "./BrandField";

export function BrandStory({ nodes }: { nodes: BrandNode[] }) {
  // The semantic adapter owns ordering and values; these wrappers only pair related reading regions.
  const visible = nodes.filter(
    (node) => !["OMITTED", "NOT_OWNED"].includes(node.presentation),
  );
  if (visible.length === 0) return null;
  const fields = (ids: string[]) =>
    visible.filter((node) => ids.includes(node.id));
  const render = (items: BrandNode[]) =>
    items.map((node) => <BrandField key={node.id} node={node} />);
  const core = fields(["positioning", "value_proposition"]);
  const traits = fields(["brand_values", "brand_personality"]);
  return (
    <Card className="brand-story">
      {render(fields(["brand_description"]))}
      <div className="brand-story__strategy">
        {core.length ? <div>{render(core)}</div> : null}
        {render(fields(["differentiation_and_proof"]))}
      </div>
      {traits.length ? (
        <div className="brand-story__traits">{render(traits)}</div>
      ) : null}
    </Card>
  );
}
