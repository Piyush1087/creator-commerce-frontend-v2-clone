import type { BrandNode } from "../../adapters/brand-field-state";
import { BrandField } from "./BrandField";

function swatch(node: BrandNode): string | undefined {
  const current = node.field?.current;
  if (
    current?.kind !== "VALUE" ||
    typeof current.value !== "object" ||
    current.value === null ||
    !("value" in current.value)
  )
    return;
  const color = current.value.value;
  // Canonical value remains visible as text. Only safe, unambiguous hex gets a decorative swatch.
  return typeof color === "string" &&
    /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/iu.test(color)
    ? color
    : undefined;
}

export function BrandVisualAssets({ node }: { node: BrandNode }) {
  return (
    <BrandField node={node}>
      <div className="brand-workspace-field__children">
        {node.children?.map((asset) => (
          <BrandField key={asset.id} node={asset} level={4}>
            {asset.id === "approved_palette" && asset.children?.length ? (
              <div className="brand-palette">
                {asset.children.map((color) => (
                  <div key={color.id} className="brand-palette__item">
                    {swatch(color) ? (
                      <span
                        className="brand-palette__swatch"
                        aria-hidden="true"
                        style={{ backgroundColor: swatch(color) }}
                      />
                    ) : null}
                    <BrandField node={color} level={5} />
                  </div>
                ))}
              </div>
            ) : undefined}
          </BrandField>
        ))}
      </div>
    </BrandField>
  );
}
