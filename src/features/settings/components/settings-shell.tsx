import { CreditCard, Group, PersonStanding, Puzzle } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { BRAND_SETTINGS_ROUTES } from "../constants/settings-routes";
import "../settings.css";

const SETTINGS_TABS = [
  { id: "brand-setup", label: "Brand Setup", icon: PersonStanding, disabled: true },
  { id: "integrations", label: "Integrations", icon: Puzzle, disabled: true },
  { id: "workspace", label: "Workspace", icon: Group, disabled: true },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    to: BRAND_SETTINGS_ROUTES.billing,
    disabled: false,
  },
] as const;

const SETTINGS_SUB_NAV = [
  { label: "Billing overview", to: BRAND_SETTINGS_ROUTES.billing },
  { label: "Secure escrow", to: BRAND_SETTINGS_ROUTES.escrow },
] as const;

export function SettingsShell() {
  const location = useLocation();
  const isBillingSection = location.pathname.startsWith(BRAND_SETTINGS_ROUTES.root);

  return (
    <div className="brand-settings">
      <header className="brand-settings__header">
        <h1 className="brand-settings__title">Settings</h1>
        <p className="brand-settings__subtitle">
          Manage your workspace, integrations, and preferences
        </p>
      </header>

      <nav className="brand-settings__tabs" aria-label="Settings sections">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          if (tab.disabled || !("to" in tab)) {
            return (
              <span
                key={tab.id}
                className="brand-settings__tab"
                aria-disabled
                style={{ opacity: 0.45, cursor: "not-allowed" }}
              >
                <Icon size={18} aria-hidden />
                {tab.label}
              </span>
            );
          }

          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              className={() =>
                `brand-settings__tab ${isBillingSection ? "brand-settings__tab--active" : ""}`
              }
            >
              <Icon size={18} aria-hidden />
              {tab.label}
            </NavLink>
          );
        })}
      </nav>

      <nav className="brand-settings__subnav" aria-label="Billing sub-sections">
        {SETTINGS_SUB_NAV.map((item) => (
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

      <Outlet />
    </div>
  );
}
