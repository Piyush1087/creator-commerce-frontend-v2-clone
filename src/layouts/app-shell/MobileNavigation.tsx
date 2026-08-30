import { X } from "lucide-react";
import { useLocation } from "react-router-dom";

import { useAuthSession } from "../../shared/auth/use-auth-session";
import { useLogout } from "../../shared/auth/use-logout";
import { normalizeUserRole } from "../../shared/auth/user-role";
import {
  getSidebarFooterNavItemsForRole,
  getSidebarNavItemsForRole,
  getSidebarUtilityItemsForRole,
} from "./sidebar-items";
import { SidebarFooterNavLink } from "./SidebarFooterNavLink";
import { SidebarNavLink } from "./SidebarNavLink";

type MobileNavigationProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const location = useLocation();
  const logout = useLogout();
  const session = useAuthSession();
  const role = normalizeUserRole(session.currentUser?.role);
  const navItems = getSidebarNavItemsForRole(role);
  const footerNavItems = getSidebarFooterNavItemsForRole(role);
  const utilityItems = getSidebarUtilityItemsForRole(role);

  return (
    <>
      <div
        className={`aurora-drawer-overlay ${isOpen ? "aurora-drawer-overlay--open" : ""}`}
        onClick={onClose}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onClose();
          }
        }}
        role="presentation"
      />
      <aside className={`aurora-drawer ${isOpen ? "aurora-drawer--open" : ""}`}>
        <div className="aurora-drawer__header">
          <span className="aurora-drawer__title">The Creator Shop</span>
          <button
            type="button"
            className="aurora-header__btn"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              border: "none",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="aurora-drawer__nav">
          {navItems.map((item) => (
            <SidebarNavLink
              key={item.path}
              item={item}
              pathname={location.pathname}
              baseClassName="aurora-drawer__link"
              activeClassName="aurora-drawer__link--active"
              iconClassName=""
              labelClassName=""
              onNavigate={onClose}
            />
          ))}
          {footerNavItems.length > 0 ? (
            <div className="aurora-drawer__footer-nav">
              {footerNavItems.map((item) => (
                <SidebarFooterNavLink
                  key={item.path}
                  item={item}
                  pathname={location.pathname}
                  variant="drawer"
                  onNavigate={onClose}
                />
              ))}
            </div>
          ) : null}
          {utilityItems.map((item) =>
            item.action === "logout" ? (
              <button
                key={item.label}
                type="button"
                className="aurora-drawer__link"
                onClick={() => {
                  onClose();
                  logout();
                }}
              >
                <item.icon size={20} style={{ marginRight: 12 }} />
                <span>{item.label}</span>
              </button>
            ) : null,
          )}
        </nav>
      </aside>
    </>
  );
}
