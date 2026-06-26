import type { UserRole } from "../../shared/auth/user-role";

export const AUTH_ROUTES = {
  login: "/login",  brandDashboard: "/brand/dashboard",
  brandCentre: "/brand-centre",
  brandUceCampaigns: "/brand/uce/campaigns",
  brandUceCampaignCreate: "/brand/uce/campaigns/create",
  brandUceCampaignDetail: "/brand/uce/campaigns/:id",
  brandCollaborations: "/brand/collaborations",
  brandCollaborationPage: "/brand/collaboration-page",
  brandPayouts: "/brand/payouts",
  brandSettings: "/brand/settings",
  brandSettingsBilling: "/brand/settings/billing",
  brandSettingsEscrow: "/brand/settings/escrow",
  creatorDashboard: "/creator/dashboard",
  creatorMarketplace: "/creator/marketplace",
  creatorMarketplaceCampaign: "/creator/marketplace/:campaignId",
  creatorCampaigns: "/creator/campaigns",
  creatorCampaignsHistory: "/creator/campaigns/history",
  creatorCollaborations: "/creator/collaborations",
  creatorPayouts: "/creator/payouts",
} as const;

/** Public guest marketplace (no auth required). */
export const PUBLIC_ROUTES = {
  marketplace: "/marketplace",
  marketplaceCampaign: "/marketplace/:campaignId",
  marketplaceInvite: "/marketplace/invite/:token",
  brandLanding: "/brand/:slug",
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
