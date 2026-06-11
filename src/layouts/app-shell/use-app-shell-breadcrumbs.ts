import { useLocation } from "react-router-dom";

import { AUTH_ROUTES } from "../../features/auth/constants";
import {
  resolveBrandCentreHeaderTitle,
  useBrandCentreShell,
} from "../../features/brand-centre/context/brand-centre-shell-context";
import { loadAuthSession } from "../../shared/auth/auth-session";
import { normalizeUserRole } from "../../shared/auth/user-role";
import { resolveHeaderMeta } from "./sidebar-items";

export type AppShellBreadcrumbMeta = {
  breadcrumb: string;
  title: string;
};

export function useAppShellBreadcrumbs(): AppShellBreadcrumbMeta {
  const location = useLocation();
  const role = normalizeUserRole(loadAuthSession()?.user.role);
  const brandCentreShell = useBrandCentreShell();
  const baseMeta = resolveHeaderMeta(location.pathname, role);

  const isBrandCentre =
    location.pathname === AUTH_ROUTES.brandCentre ||
    location.pathname.startsWith(`${AUTH_ROUTES.brandCentre}/`);

  if (isBrandCentre) {
    return {
      breadcrumb: "Brand Centre",
      title: resolveBrandCentreHeaderTitle(brandCentreShell?.activeTabId ?? "dna"),
    };
  }

  if (location.pathname === AUTH_ROUTES.brandUceCampaignCreate) {
    return {
      breadcrumb: "Campaigns",
      title: "Create Campaign",
    };
  }

  return baseMeta;
}
