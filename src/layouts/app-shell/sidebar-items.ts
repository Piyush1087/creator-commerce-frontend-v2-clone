import {
  Globe,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageCircle,
  Search,
  Settings,
  Store,
  Wallet,
} from "lucide-react";
import type { ElementType } from "react";

import { AUTH_ROUTES } from "../../features/auth/constants";
import { isCreatorCentrePath } from "../../features/creator-centre/constants/creator-centre-tabs";
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

export type SidebarFooterNavItem = {
  icon: ElementType;
  label: string;
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
    mainVariant: "flush",
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
    label: "Brand page",
    icon: Globe,
    path: AUTH_ROUTES.brandCollaborationPage,
    roles: ["BRAND"],
    breadcrumb: "Brand page",
    headerTitle: "Brand page",
    mainVariant: "flush",
  },
  {
    label: "Collaborations",
    icon: MessageCircle,
    path: AUTH_ROUTES.brandCollaborations,
    roles: ["BRAND"],
    breadcrumb: "Collaborations",
    headerTitle: "Collaborations",
    mainVariant: "flush",
  },
  {
    label: "Payouts",
    icon: Wallet,
    path: AUTH_ROUTES.brandPayouts,
    roles: ["BRAND"],
    breadcrumb: "Payouts",
    headerTitle: "Billing, Escrow & Compliance Hub",
    mainVariant: "flush",
  },
  {
    label: "Settings",
    icon: Settings,
    path: AUTH_ROUTES.brandSettings,
    roles: ["BRAND"],
    breadcrumb: "Settings",
    headerTitle: "Settings",
    mainVariant: "default",
  },
];

const creatorSidebarNavItems: SidebarNavItem[] = [
  {
    label: "Creator Centre",
    icon: Home,
    path: AUTH_ROUTES.creatorHome,
    roles: ["CREATOR"],
    breadcrumb: "Creator Centre",
    headerTitle: "Creator Centre",
    mainVariant: "flush",
  },
  {
    label: "Marketplace",
    icon: Search,
    path: AUTH_ROUTES.creatorMarketplace,
    roles: ["CREATOR"],
    breadcrumb: "Marketplace",
    headerTitle: "Marketplace",
    mainVariant: "flush",
  },
  {
    label: "Campaigns",
    icon: Megaphone,
    path: AUTH_ROUTES.creatorCampaigns,
    roles: ["CREATOR"],
    breadcrumb: "Campaigns",
    headerTitle: "Campaigns Command Center",
    mainVariant: "flush",
  },
  {
    label: "Payouts",
    icon: Wallet,
    path: AUTH_ROUTES.creatorPayouts,
    roles: ["CREATOR"],
    breadcrumb: "Payouts",
    headerTitle: "Earnings & Payouts Hub",
    mainVariant: "flush",
  },
  {
    label: "Chat",
    icon: MessageCircle,
    path: AUTH_ROUTES.creatorCollaborations,
    roles: ["CREATOR"],
    breadcrumb: "Collaborations",
    headerTitle: "Collaborations",
    mainVariant: "flush",
  },
  {
    label: "Settings",
    icon: Settings,
    path: AUTH_ROUTES.creatorSettings,
    roles: ["CREATOR"],
    breadcrumb: "Settings",
    headerTitle: "Settings",
    mainVariant: "default",
  },
];

const brandSidebarFooterNavItems: SidebarFooterNavItem[] = [
  {
    label: "Support",
    icon: HelpCircle,
    path: "/help",
    roles: ["BRAND"],
  },
];

const brandSidebarUtilityItems: SidebarUtilityItem[] = [
  {
    label: "Logout",
    icon: LogOut,
    action: "logout",
    roles: ["BRAND"],
  },
];

const creatorSidebarUtilityItems: SidebarUtilityItem[] = [
  {
    label: "Help",
    icon: HelpCircle,
    path: "/help",
    action: "help",
    roles: ["CREATOR"],
  },
  {
    label: "Logout",
    icon: LogOut,
    action: "logout",
    roles: ["CREATOR"],
  },
];

const sidebarNavByRole: Record<UserRole, SidebarNavItem[]> = {
  BRAND: brandSidebarNavItems,
  CREATOR: creatorSidebarNavItems,
  ADMIN: [],
};

const sidebarFooterNavByRole: Record<UserRole, SidebarFooterNavItem[]> = {
  BRAND: brandSidebarFooterNavItems,
  CREATOR: [],
  ADMIN: [],
};

const sidebarUtilityByRole: Record<UserRole, SidebarUtilityItem[]> = {
  BRAND: brandSidebarUtilityItems,
  CREATOR: creatorSidebarUtilityItems,
  ADMIN: [],
};

export function getSidebarNavItemsForRole(role: UserRole | null): SidebarNavItem[] {
  if (!role) {
    return [];
  }
  return sidebarNavByRole[role];
}

export function getSidebarFooterNavItemsForRole(
  role: UserRole | null,
): SidebarFooterNavItem[] {
  if (!role) {
    return [];
  }
  return sidebarFooterNavByRole[role];
}

export function getSidebarUtilityItemsForRole(role: UserRole | null): SidebarUtilityItem[] {
  if (!role) {
    return [];
  }
  return sidebarUtilityByRole[role];
}

const PREFIX_MATCH_PATHS = [
  AUTH_ROUTES.brandCentre,
  AUTH_ROUTES.brandUceCampaigns,
  AUTH_ROUTES.brandCollaborationPage,
  AUTH_ROUTES.brandCollaborations,
  AUTH_ROUTES.brandPayouts,
  AUTH_ROUTES.brandSettings,
  AUTH_ROUTES.creatorHome,
  AUTH_ROUTES.creatorMarketplace,
  AUTH_ROUTES.creatorCampaigns,
  AUTH_ROUTES.creatorPayouts,
  AUTH_ROUTES.creatorCollaborations,
  AUTH_ROUTES.creatorSettings,
] as const;

export function isSidebarNavItemActive(pathname: string, itemPath: string): boolean {
  if (itemPath === AUTH_ROUTES.creatorHome) {
    return isCreatorCentrePath(pathname);
  }

  if (PREFIX_MATCH_PATHS.some((p) => p === itemPath)) {
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
  if (pathname.startsWith(AUTH_ROUTES.brandSettings)) {
    if (pathname.includes("/integrations")) {
      return { breadcrumb: "Settings", title: "Integrations" };
    }
    if (pathname.includes("/escrow")) {
      return { breadcrumb: "Settings", title: "Secure Escrow" };
    }
    if (pathname.includes("/billing")) {
      return { breadcrumb: "Settings", title: "Billing" };
    }
    return { breadcrumb: "Settings", title: "General" };
  }

  if (pathname.startsWith(AUTH_ROUTES.creatorSettings)) {
    if (pathname.includes("/social")) {
      return { breadcrumb: "Settings", title: "Social Channels" };
    }
    if (pathname.includes("/payouts")) {
      return { breadcrumb: "Settings", title: "Payouts & Tax" };
    }
    return { breadcrumb: "Settings", title: "Profile & Workspace" };
  }

  if (isCreatorCentrePath(pathname)) {
    return { breadcrumb: "Creator Centre", title: "Creator Centre" };
  }

  const match = findSidebarNavItemByPath(pathname, role);
  if (match) {
    return {
      breadcrumb: match.breadcrumb ?? match.label,
      title: match.headerTitle ?? match.label,
    };
  }
  return { breadcrumb: "Home", title: "Dashboard" };
}
