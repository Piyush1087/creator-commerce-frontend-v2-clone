import { Link } from "react-router-dom";

import "./product-intelligence/product-intelligence.css";

export type BrandCentreWorkspace =
  | "Brand"
  | "Offerings"
  | "Market"
  | "Recommendations";

const WORKSPACES: ReadonlyArray<{
  id: BrandCentreWorkspace;
  href?: "/brand-centre" | "/brand-centre/offerings";
}> = [
  { id: "Brand", href: "/brand-centre" },
  { id: "Offerings", href: "/brand-centre/offerings" },
  { id: "Market" },
  { id: "Recommendations" },
];

type BrandCentreWorkspaceNavProps = {
  current?: BrandCentreWorkspace;
};

/**
 * Shared Brand Centre workspace tab strip (Offerings styling).
 * Used on Brand, Offerings, and future Market / Recommendations pages.
 */
export function BrandCentreWorkspaceNav({
  current = "Brand",
}: BrandCentreWorkspaceNavProps) {
  return (
    <nav className="product-nav" aria-label="Brand Centre workspaces">
      {WORKSPACES.map((workspace) =>
        workspace.href ? (
          <Link
            key={workspace.id}
            to={workspace.href}
            aria-current={current === workspace.id ? "page" : undefined}
          >
            {workspace.id}
          </Link>
        ) : (
          <span key={workspace.id} aria-disabled="true">
            {workspace.id}
          </span>
        ),
      )}
    </nav>
  );
}
