import { CreditCard, Puzzle, Settings2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import {
  BRAND_SETTINGS_ROUTES,
  isBrandFinanceRoute,
} from "../constants/settings-routes";
import "../settings.css";

const BRAND_SETTINGS_TABS = [
  {
    id: "general",
    label: "General",
    icon: Settings2,
    to: BRAND_SETTINGS_ROUTES.general,
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Puzzle,
    to: BRAND_SETTINGS_ROUTES.integrations,
  },
  {
    id: "finance",
    label: "Finance & Escrow",
    icon: CreditCard,
    to: BRAND_SETTINGS_ROUTES.billing,
  },
] as const;

const FINANCE_SUB_NAV = [
  { label: "Billing overview", to: BRAND_SETTINGS_ROUTES.billing },
  { label: "Secure escrow", to: BRAND_SETTINGS_ROUTES.escrow },
] as const;

export function SettingsShell() {
  const location = useLocation();
  const showFinanceSubNav = isBrandFinanceRoute(location.pathname);
  const tabsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const activeTab = tabsRef.current?.querySelector<HTMLElement>(
      ".brand-settings__tab--active",
    );
    activeTab?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [location.pathname]);

  return (
    <div className="brand-settings">
      <header className="brand-settings__header">
        <h1 className="brand-settings__title">Settings</h1>
        <p className="brand-settings__subtitle">
          Manage your personal profile, workspace permissions, external integrations, and
          financial ledgers.
        </p>
      </header>

      <nav
        ref={tabsRef}
        className="brand-settings__tabs"
        aria-label="Settings sections"
      >
        {BRAND_SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isFinanceTab = tab.id === "finance";
          const isActive = isFinanceTab
            ? showFinanceSubNav
            : location.pathname === tab.to ||
              location.pathname.startsWith(`${tab.to}/`);

          return (
            <Link
              key={tab.id}
              to={tab.to}
              aria-current={isActive ? "page" : undefined}
              className={`brand-settings__tab ${isActive ? "brand-settings__tab--active" : ""}`}
            >
              <Icon size={18} aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {showFinanceSubNav ? (
        <nav className="brand-settings__subnav" aria-label="Finance sub-sections">
          {FINANCE_SUB_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `brand-settings__subnav-link ${isActive ? "brand-settings__subnav-link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}

      <Outlet />
    </div>
  );
}
