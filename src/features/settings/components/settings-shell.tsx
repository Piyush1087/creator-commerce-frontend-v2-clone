import { CreditCard, Puzzle, Settings2 } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

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

  return (
    <div className="brand-settings">
      <header className="brand-settings__header">
        <h1 className="brand-settings__title">Settings</h1>
        <p className="brand-settings__subtitle">
          Manage your personal profile, workspace permissions, external integrations, and
          financial ledgers.
        </p>
      </header>

      <nav className="brand-settings__tabs" aria-label="Settings sections">
        {BRAND_SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isFinanceTab = tab.id === "finance";

          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              end={!isFinanceTab}
              className={({ isActive }) => {
                const active = isFinanceTab
                  ? isBrandFinanceRoute(location.pathname)
                  : isActive;
                return `brand-settings__tab ${active ? "brand-settings__tab--active" : ""}`;
              }}
            >
              <Icon size={18} aria-hidden />
              {tab.label}
            </NavLink>
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
