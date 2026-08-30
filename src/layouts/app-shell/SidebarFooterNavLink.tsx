import { Link } from "react-router-dom";

import type { SidebarFooterNavItem } from "./sidebar-items";
import { isSidebarNavItemActive } from "./sidebar-items";

type SidebarFooterNavLinkProps = {
  item: SidebarFooterNavItem;
  pathname: string;
  onNavigate?: () => void;
  variant?: "sidebar" | "drawer";
};

export function SidebarFooterNavLink({
  item,
  pathname,
  onNavigate,
  variant = "sidebar",
}: SidebarFooterNavLinkProps) {
  const isActive = isSidebarNavItemActive(pathname, item.path);
  const baseClassName =
    variant === "sidebar" ? "aurora-sidebar__link" : "aurora-drawer__link";
  const activeClassName =
    variant === "sidebar"
      ? "aurora-sidebar__footer-link--active"
      : "aurora-drawer__footer-link--active";

  return (
    <Link
      to={item.path}
      className={`${baseClassName}${isActive ? ` ${activeClassName}` : ""}`}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
    >
      <span
        className={variant === "sidebar" ? "aurora-sidebar__icon" : undefined}
        style={variant === "drawer" ? { marginRight: 12, display: "flex" } : undefined}
      >
        <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      </span>
      {variant === "sidebar" ? (
        <span className="aurora-sidebar__label">{item.label}</span>
      ) : (
        <span>{item.label}</span>
      )}
    </Link>
  );
}
