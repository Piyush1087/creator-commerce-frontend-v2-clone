import type { UserRole } from "../../shared/auth/user-role";

export const AUTH_ROUTES = {
  login: "/login",
  brandDashboard: "/brand/dashboard",
  brandCentre: "/brand-centre",
  brandUceCampaigns: "/brand/uce/campaigns",
  brandUceCampaignCreate: "/brand/uce/campaigns/create",
  brandUceCampaignDetail: "/brand/uce/campaigns/:id",
  brandCollaborations: "/brand/collaborations",
  brandSettings: "/brand/settings",
  brandSettingsBilling: "/brand/settings/billing",
  brandSettingsEscrow: "/brand/settings/escrow",
  creatorDashboard: "/creator/dashboard",
  creatorCollaborations: "/creator/collaborations",
} as const;

export function getHomeRouteForRole(role: UserRole | null): string {
  switch (role) {
    case "CREATOR":
      return AUTH_ROUTES.creatorDashboard;
    case "BRAND":
      return AUTH_ROUTES.brandCentre;
    default:
      return AUTH_ROUTES.login;
  }
}

export function getCollaborationsRouteForRole(role: UserRole | null): string {
  return role === "CREATOR"
    ? AUTH_ROUTES.creatorCollaborations
    : AUTH_ROUTES.brandCollaborations;
}

export function collaborationsThreadUrl(threadId: string): string {
  const base = AUTH_ROUTES.brandCollaborations;
  const params = new URLSearchParams({ thread: threadId });
  return `${base}?${params.toString()}`;
}
