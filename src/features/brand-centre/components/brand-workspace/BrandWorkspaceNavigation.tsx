import { Link } from "react-router-dom";
import { Button } from "../../../../design-system/aurora";

const workspaces = [
  "Overview",
  "Brand",
  "Offerings",
  "Market",
  "Recommendations",
] as const;

function WorkspaceLinks() {
  return (
    <>
      {workspaces.map((workspace) =>
        workspace === "Brand" ? (
          <Link key={workspace} to="/brand-centre" aria-current="page">
            Brand
          </Link>
        ) : (
          <Button
            key={workspace}
            type="button"
            variant="ghost"
            disabled
            aria-label={`${workspace} — unavailable`}
          >
            {workspace}
          </Button>
        ),
      )}
    </>
  );
}

export function BrandWorkspaceNavigation() {
  return (
    <nav
      className="brand-workspace-navigation"
      aria-label="Brand Centre workspaces"
    >
      <div className="brand-workspace-navigation__desktop">
        <WorkspaceLinks />
      </div>
      <details
        className="brand-workspace-navigation__mobile"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}
      >
        <summary>Brand</summary>
        <div className="brand-workspace-navigation__options">
          <WorkspaceLinks />
          <p>Other workspaces are unavailable.</p>
        </div>
      </details>
    </nav>
  );
}
