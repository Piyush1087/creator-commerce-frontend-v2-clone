import type { BrandNode } from "../../adapters/brand-field-state";
import { BrandField } from "./BrandField";

export function BrandAudience({ node }: { node: BrandNode }) {
  return (
    <BrandField node={node}>
      {node.children?.length ? (
        <div
          className="brand-personas"
          data-persona-count={node.children.length}
        >
          {node.children.map((persona) => (
            <BrandField key={persona.id} node={persona}>
              <div className="brand-persona__content">
                {persona.children?.map((child) => (
                  <BrandField
                    key={child.id}
                    node={child}
                    valueHeading={child.id.endsWith("/f/label")}
                    level={child.id.endsWith("/f/label") ? 3 : 4}
                  />
                ))}
              </div>
            </BrandField>
          ))}
        </div>
      ) : undefined}
    </BrandField>
  );
}
