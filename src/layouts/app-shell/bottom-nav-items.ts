import { LayoutDashboard, Megaphone, MessageCircle, Search, Store } from "lucide-react";
import type { ElementType } from "react";

import { AUTH_ROUTES } from "../../features/auth/constants";
import type { UserRole } from "../../shared/auth/user-role";

export type BottomNavItem = {
  icon: ElementType;
  label: string;
  path?: string;
};

export const brandBottomNavItems: BottomNavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: AUTH_ROUTES.brandDashboard,
  },
  {
    label: "Campaigns",
    icon: Megaphone,
    path: AUTH_ROUTES.brandUceCampaigns,
  },
  {
    label: "Brand Centre",
    icon: Store,
    path: AUTH_ROUTES.brandCentre,
  },
  {
    label: "Chat",
    icon: MessageCircle,
    path: AUTH_ROUTES.brandCollaborations,
  },
];

export const creatorBottomNavItems: BottomNavItem[] = [
  {
    label: "Home",
    icon: LayoutDashboard,
    path: AUTH_ROUTES.creatorDashboard,
  },
  {
    label: "Marketplace",
    icon: Search,
    path: AUTH_ROUTES.creatorMarketplace,
  },
  {
    label: "Campaigns",
    icon: Megaphone,
    path: AUTH_ROUTES.creatorCampaigns,
  },
  {
    label: "Chat",
    icon: MessageCircle,
    path: AUTH_ROUTES.creatorCollaborations,
  },
];

export function getBottomNavItemsForRole(role: UserRole | null): BottomNavItem[] {
  if (role === "CREATOR") {
    return creatorBottomNavItems;
  }
  if (role === "BRAND") {
    return brandBottomNavItems;
  }
  return [];
}

const PREFIX_MATCH_PATHS = [
  AUTH_ROUTES.brandCentre,
  AUTH_ROUTES.brandUceCampaigns,
  AUTH_ROUTES.brandCollaborations,
  AUTH_ROUTES.creatorMarketplace,
  AUTH_ROUTES.creatorCampaigns,
  AUTH_ROUTES.creatorCollaborations,
] as const;

export function isBottomNavItemActive(pathname: string, item: BottomNavItem): boolean {
  if (!item.path) {
    return false;
  }
  if (PREFIX_MATCH_PATHS.some((p) => p === item.path)) {
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  }
  return pathname === item.path;
}
