import { Card } from "../../../../design-system/aurora";
import type { BrandNode } from "../../adapters/brand-field-state";
import { BrandField } from "./BrandField";

export function BrandIdentity({
  nodes,
  logo,
}: {
  nodes: BrandNode[];
  logo?: BrandNode;
}) {
  return (
    <Card className="brand-identity">
      <h2 className="brand-workspace-sr-only">Brand identity</h2>
      {logo?.image && logo.presentation === "CONTENT" ? (
        <img
          className="brand-identity__logo"
          src={logo.image}
          alt=""
          referrerPolicy="no-referrer"
        />
      ) : null}
      <div className="brand-identity__details">
        {nodes
          .filter((node) => node.id === "brand_name")
          .map((node) => (
            <BrandField key={node.id} node={node} valueHeading />
          ))}
        <div className="brand-identity__anchors">
          {nodes
            .filter((node) => node.id !== "brand_name")
            .map((node) => (
              <BrandField key={node.id} node={node} />
            ))}
        </div>
      </div>
    </Card>
  );
}
