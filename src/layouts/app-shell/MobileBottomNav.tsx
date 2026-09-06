import { Link, useLocation } from "react-router-dom";

import { useAuthSession } from "../../shared/auth/use-auth-session";
import { normalizeUserRole } from "../../shared/auth/user-role";
import {
  getBottomNavItemsForRole,
  isBottomNavItemActive,
} from "./bottom-nav-items";

export function MobileBottomNav() {
  const location = useLocation();
  const session = useAuthSession();
  const role = normalizeUserRole(session.currentUser?.role);
  const items = getBottomNavItemsForRole(role);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="aurora-bottom-nav" aria-label="Primary">
      {items.map((item) => {
        const isActive = isBottomNavItemActive(location.pathname, item);

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
