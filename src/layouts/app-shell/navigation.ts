export type NavigationItem = {
  active?: boolean;
  icon: string;
  label: string;
};

export const navigationItems: NavigationItem[] = [
  { active: true, icon: "D", label: "Dashboard" },
  { icon: "C", label: "Campaigns" },
  { icon: "B", label: "Brand Centre" },
  { icon: "P", label: "Payouts" },
  { icon: "S", label: "Settings" },
];

export const utilityItems: NavigationItem[] = [
  { icon: "?", label: "Help" },
  { icon: "L", label: "Logout" },
];
