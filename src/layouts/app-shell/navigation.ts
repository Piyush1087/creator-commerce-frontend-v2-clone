import {
  LayoutDashboard,
  Megaphone,
  Store,
  Wallet,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import type { ElementType } from "react";

export type NavigationItem = {
  active?: boolean;
  icon: ElementType;
  label: string;
  path: string;
};

export const navigationItems: NavigationItem[] = [
  { active: true, icon: LayoutDashboard, label: "Dashboard", path: "/visual-test" },
  { icon: Megaphone, label: "Campaigns", path: "/campaigns" },
  { icon: Store, label: "Brand Centre", path: "/brand-centre" },
  { icon: Wallet, label: "Payouts", path: "/payouts" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const utilityItems: NavigationItem[] = [
  { icon: HelpCircle, label: "Help", path: "/help" },
  { icon: LogOut, label: "Logout", path: "/logout" },
];
