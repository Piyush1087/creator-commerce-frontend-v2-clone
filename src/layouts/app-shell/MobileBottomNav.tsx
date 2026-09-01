import { Link, useLocation } from "react-router-dom";

import { useAuthSession } from "../../shared/auth/use-auth-session";
import { normalizeUserRole } from "../../shared/auth/user-role";
import {
  getBottomNavItemsForRole,
  isBottomNavItemActive,
} from "./bottom-nav-items";
import type { CreatorShellState } from "./creator-shell-capabilities";

type MobileBottomNavProps = {
  creatorShellState?: CreatorShellState;
};

export function MobileBottomNav({ creatorShellState }: MobileBottomNavProps) {
  const location = useLocation();
  const session = useAuthSession();
  const role = normalizeUserRole(session.currentUser?.role);
  const items = getBottomNavItemsForRole(role, creatorShellState);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="aurora-bottom-nav" aria-label="Primary">
      {items.map((item) => {
        const isActive = isBottomNavItemActive(location.pathname, item);

        if (item.availability === "UNAVAILABLE") {
          return (
            <span
              key={item.label}
              className="aurora-bottom-nav__item aurora-bottom-nav__item--disabled"
              aria-label={`${item.label}. ${item.unavailableReason ?? "Unavailable"}`}
              aria-disabled="true"
              title={item.unavailableReason}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </span>
          );
        }

        if (item.path) {
          return (
            <Link
              key={item.label}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className={`aurora-bottom-nav__item ${isActive ? "aurora-bottom-nav__item--active" : ""}`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        }

        return (
          <button
            key={item.label}
            type="button"
            className="aurora-bottom-nav__item aurora-bottom-nav__item--disabled"
            disabled
            aria-disabled
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
