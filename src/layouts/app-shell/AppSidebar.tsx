import { useLocation } from "react-router-dom";

import { loadAuthSession } from "../../shared/auth/auth-session";
import { useLogout } from "../../shared/auth/use-logout";
import { normalizeUserRole } from "../../shared/auth/user-role";
import { Button } from "../../design-system/aurora";
import {
  getSidebarFooterNavItemsForRole,
  getSidebarNavItemsForRole,
  getSidebarUtilityItemsForRole,
} from "./sidebar-items";
import { SidebarFooterNavLink } from "./SidebarFooterNavLink";
import { SidebarNavLink } from "./SidebarNavLink";

export function AppSidebar() {
  const location = useLocation();
  const logout = useLogout();
  const role = normalizeUserRole(loadAuthSession()?.user.role);
  const navItems = getSidebarNavItemsForRole(role);
  const footerNavItems = getSidebarFooterNavItemsForRole(role);
  const utilityItems = getSidebarUtilityItemsForRole(role);

  return (
    <aside className="aurora-sidebar">
      <div className="aurora-sidebar__brand">
        <div className="aurora-sidebar__logo-mark">T</div>
        <span className="aurora-sidebar__logo-text">TheCreatorShop</span>
      </div>

      <nav className="aurora-sidebar__nav">
        {navItems.map((item) => (
          <SidebarNavLink
            key={item.path}
            item={item}
            pathname={location.pathname}
            baseClassName="aurora-sidebar__link"
            activeClassName="aurora-sidebar__link--active"
          />
        ))}
      </nav>

      <div className="aurora-sidebar__footer">
        {footerNavItems.map((item) => (
          <SidebarFooterNavLink
            key={item.path}
            item={item}
            pathname={location.pathname}
          />
        ))}
        {utilityItems.map((item) =>
          item.action === "logout" ? (
            <button
              key={item.label}
              type="button"
              className="aurora-sidebar__link"
              onClick={() => logout()}
            >
              <span className="aurora-sidebar__icon">
                <item.icon size={20} />
              </span>
              <span className="aurora-sidebar__label">{item.label}</span>
            </button>
          ) : null,
        )}
        <div className="aurora-sidebar__upgrade">
          <Button style={{ width: "100%", height: 40, fontSize: 13 }}>
            Upgrade Plan
          </Button>
        </div>
      </div>
    </aside>
  );
}
