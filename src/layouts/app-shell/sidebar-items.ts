import {
  LayoutDashboard,
  Store,
  HelpCircle,
  LogOut,
  Megaphone,
  MessageCircle,
} from "lucide-react";
import type { ElementType } from "react";

import { AUTH_ROUTES } from "../../features/auth/constants";
import type { UserRole } from "../../shared/auth/user-role";

export type AppShellMainVariant = "default" | "flush";

export type SidebarNavItem = {
  breadcrumb?: string;
  headerTitle?: string;
  icon: ElementType;
  label: string;
  mainVariant: AppShellMainVariant;
  path: string;
  roles: readonly UserRole[];
};

export type SidebarUtilityItem = {
  action: "help" | "logout";
  icon: ElementType;
  label: string;
  path?: string;
  roles: readonly UserRole[];
};

const brandSidebarNavItems: SidebarNavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: AUTH_ROUTES.brandDashboard,
    roles: ["BRAND"],
    breadcrumb: "Home",
    headerTitle: "Dashboard",
    mainVariant: "default",
  },
  {
    label: "Brand Centre",
    icon: Store,
    path: AUTH_ROUTES.brandCentre,
    roles: ["BRAND"],
    breadcrumb: "Brand Centre",
    headerTitle: "Brand DNA",
    mainVariant: "flush",
  },
  {
    label: "Campaigns",
    icon: Megaphone,
    path: AUTH_ROUTES.brandUceCampaigns,
    roles: ["BRAND"],
    breadcrumb: "Campaigns",
    headerTitle: "UCE Campaigns",
    mainVariant: "flush",
  },
  {
    label: "Chat",
    icon: MessageCircle,
    path: AUTH_ROUTES.brandAiChat,
    roles: ["BRAND"],
    breadcrumb: "Chat",
    headerTitle: "AI Chat",
    mainVariant: "flush",
  },
];

const brandSidebarUtilityItems: SidebarUtilityItem[] = [
  {
    label: "Help",
    icon: HelpCircle,
    path: "/help",
    action: "help",
    roles: ["BRAND"],
  },
  {
    label: "Logout",
    icon: LogOut,
    action: "logout",
    roles: ["BRAND"],
  },
];

/** Nav entries per role — extend when influencer/admin shells ship. */
const sidebarNavByRole: Record<UserRole, SidebarNavItem[]> = {
  BRAND: brandSidebarNavItems,
  INFLUENCER: [],
  ADMIN: [],
};

const sidebarUtilityByRole: Record<UserRole, SidebarUtilityItem[]> = {
  BRAND: brandSidebarUtilityItems,
  INFLUENCER: [],
  ADMIN: [],
};

export function getSidebarNavItemsForRole(role: UserRole | null): SidebarNavItem[] {
  if (!role) {
    return [];
  }
  return sidebarNavByRole[role];
}

export function getSidebarUtilityItemsForRole(role: UserRole | null): SidebarUtilityItem[] {
  if (!role) {
    return [];
  }
  return sidebarUtilityByRole[role];
}

export function isSidebarNavItemActive(pathname: string, itemPath: string): boolean {
  if (itemPath === AUTH_ROUTES.brandCentre || itemPath === AUTH_ROUTES.brandUceCampaigns) {
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  }
  return pathname === itemPath;
}

export function findSidebarNavItemByPath(
  pathname: string,
  role: UserRole | null,
): SidebarNavItem | undefined {
  return getSidebarNavItemsForRole(role).find((item) =>
    isSidebarNavItemActive(pathname, item.path),
  );
}

export function resolveAppShellMainVariant(
  pathname: string,
  role: UserRole | null,
): AppShellMainVariant {
  const match = findSidebarNavItemByPath(pathname, role);
  return match?.mainVariant ?? "default";
}

export function resolveHeaderMeta(
  pathname: string,
  role: UserRole | null,
): { breadcrumb: string; title: string } {
  const match = findSidebarNavItemByPath(pathname, role);
  if (match) {
    return {
      breadcrumb: match.breadcrumb ?? match.label,
      title: match.headerTitle ?? match.label,
    };
  }
  return { breadcrumb: "Home", title: "Dashboard" };
}
