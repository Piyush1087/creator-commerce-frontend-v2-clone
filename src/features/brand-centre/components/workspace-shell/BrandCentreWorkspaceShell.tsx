import { useEffect, useRef } from "react";
import {
  Navigate,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuthSession } from "../../../../shared/auth/use-auth-session";
import { normalizeUserRole } from "../../../../shared/auth/user-role";
import { getHomeRouteForRole } from "../../../auth/constants";
import {
  BRAND_CENTRE_WORKSPACES,
  resolveBrandCentreWorkspace,
} from "../../navigation/brand-centre-workspaces";
import "./brand-centre-workspace-shell.css";

export function BrandCentreWorkspaceShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthSession();
  const contentRef = useRef<HTMLDivElement>(null);
  const activeWorkspace = resolveBrandCentreWorkspace(location.pathname);

  useEffect(() => {
    const heading = contentRef.current?.querySelector<HTMLElement>("h1");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }, [location.pathname]);

  const role = normalizeUserRole(session.currentUser?.role);
  if (role !== "BRAND") {
    return <Navigate to={getHomeRouteForRole(role)} replace />;
  }

  return (
    <section className="brand-centre-workspace-shell" aria-label="Brand Centre">
      <nav
        className="brand-centre-workspace-navigation"
        aria-label="Brand Centre workspaces"
      >
        <div className="brand-centre-workspace-navigation__desktop">
          {BRAND_CENTRE_WORKSPACES.map((workspace) => (
            <Link
              key={workspace.id}
              to={workspace.route}
              aria-current={
                workspace.id === activeWorkspace?.id ? "page" : undefined
              }
              className={
                workspace.id === activeWorkspace?.id
                  ? "brand-centre-workspace-navigation__link brand-centre-workspace-navigation__link--active"
                  : "brand-centre-workspace-navigation__link"
              }
            >
              {workspace.label}
            </Link>
          ))}
        </div>

        <label className="brand-centre-workspace-navigation__mobile">
          <span>Brand Centre workspace</span>
          <select
            aria-label="Brand Centre workspace selector"
            value={activeWorkspace?.id ?? "brand"}
            onChange={(event) => {
              const destination = BRAND_CENTRE_WORKSPACES.find(
                (workspace) => workspace.id === event.target.value,
              );
              if (destination && destination.id !== activeWorkspace?.id) {
                navigate(destination.route);
              }
            }}
          >
            {BRAND_CENTRE_WORKSPACES.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.label}
              </option>
            ))}
          </select>
        </label>
      </nav>

      <div ref={contentRef} className="brand-centre-workspace-shell__content">
        <Outlet />
      </div>
    </section>
  );
}
