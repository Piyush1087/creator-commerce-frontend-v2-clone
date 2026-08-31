import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { AUTH_ROUTES } from "../../features/auth/constants";
import { useAuthSession } from "../../shared/auth/use-auth-session";
import { normalizeUserRole } from "../../shared/auth/user-role";
import { resolveHeaderMeta } from "./sidebar-items";

export const UCE_BRIEF_WIZARD_HEADER_EVENT = "uce-brief-wizard-header";

export type AppShellBreadcrumbMeta = {
  breadcrumb: string;
  title: string;
};

export function useAppShellBreadcrumbs(): AppShellBreadcrumbMeta {
  const location = useLocation();
  const session = useAuthSession();
  const role = normalizeUserRole(session.currentUser?.role);
  const baseMeta = resolveHeaderMeta(location.pathname, role);
  const [isBriefWizardOpen, setIsBriefWizardOpen] = useState(false);

  useEffect(() => {
    const onBriefWizardHeader = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      setIsBriefWizardOpen(Boolean(detail?.open));
    };
    window.addEventListener(UCE_BRIEF_WIZARD_HEADER_EVENT, onBriefWizardHeader);
    return () => {
      window.removeEventListener(
        UCE_BRIEF_WIZARD_HEADER_EVENT,
        onBriefWizardHeader,
      );
    };
  }, []);

  useEffect(() => {
    setIsBriefWizardOpen(false);
  }, [location.pathname]);

  const isBrandCentre =
    location.pathname === AUTH_ROUTES.brandCentre ||
    location.pathname.startsWith(`${AUTH_ROUTES.brandCentre}/`);

  if (isBrandCentre) {
    return {
      breadcrumb: "Brand Centre",
      title: "Brand",
    };
  }

  if (location.pathname === AUTH_ROUTES.brandUceCampaignCreate) {
    return {
      breadcrumb: "Campaigns",
      title: "Create Campaign",
    };
  }

  if (
    location.pathname.startsWith(`${AUTH_ROUTES.brandUceCampaigns}/`) &&
    location.pathname !== AUTH_ROUTES.brandUceCampaignCreate
  ) {
    return {
      breadcrumb: "Campaigns",
      title: isBriefWizardOpen ? "Create Brief" : "Campaign Detail",
    };
  }

  if (location.pathname.startsWith(`${AUTH_ROUTES.creatorMarketplace}/`)) {
    return {
      breadcrumb: "Marketplace",
      title: "Campaign Detail",
    };
  }

  if (location.pathname === AUTH_ROUTES.creatorCampaignsHistory) {
    return {
      breadcrumb: "Campaigns",
      title: "History",
    };
  }

  return baseMeta;
}
