import {
  LayoutDashboard,
  Megaphone,
  Store,
  Wallet,
} from "lucide-react";
import type { ElementType } from "react";

import { AUTH_ROUTES } from "../../features/auth/constants";

export type BottomNavItem = {
  icon: ElementType;
  label: string;
  path?: string;
};

/** Mobile bottom bar — independent from desktop sidebar nav. */
export const brandBottomNavItems: BottomNavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: AUTH_ROUTES.brandDashboard,
  },
  {
    label: "Campaigns",
    icon: Megaphone,
  },
  {
    label: "Brand Centre",
    icon: Store,
    path: AUTH_ROUTES.brandCentre,
  },
  {
    label: "Payouts",
    icon: Wallet,
  },
];

export function isBottomNavItemActive(pathname: string, item: BottomNavItem): boolean {
  if (!item.path) {
    return false;
  }
  if (item.path === AUTH_ROUTES.brandCentre) {
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  }
  return pathname === item.path;
}
