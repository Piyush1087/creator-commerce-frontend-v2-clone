import { Link } from "react-router-dom";

import type { SidebarNavItem } from "./sidebar-items";
import { isSidebarNavItemActive } from "./sidebar-items";

type SidebarNavLinkProps = {
  activeClassName: string;
  baseClassName: string;
  iconClassName?: string;
  item: SidebarNavItem;
  labelClassName?: string;
  onNavigate?: () => void;
  pathname: string;
};

export function SidebarNavLink({
  item,
  pathname,
  baseClassName,
  activeClassName,
  iconClassName = "aurora-sidebar__icon",
  labelClassName = "aurora-sidebar__label",
  onNavigate,
}: SidebarNavLinkProps) {
  const isActive = isSidebarNavItemActive(pathname, item.path);

  return (
    <Link
      to={item.path}
      title={item.label}
      aria-current={isActive ? "page" : undefined}
      className={`${baseClassName}${isActive ? ` ${activeClassName}` : ""}`}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
    >
      <span className={iconClassName}>
        <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      </span>
      {labelClassName ? (
        <span className={labelClassName}>{item.label}</span>
      ) : (
        <span>{item.label}</span>
      )}
    </Link>
  );
}
