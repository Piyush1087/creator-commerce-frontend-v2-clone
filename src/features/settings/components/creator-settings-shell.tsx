import { CreditCard, Puzzle, Settings2 } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { CREATOR_SETTINGS_ROUTES } from "../constants/settings-routes";
import "../settings.css";

const CREATOR_SETTINGS_TABS = [
  {
    id: "profile",
    label: "Profile & Workspace",
    icon: Settings2,
    to: CREATOR_SETTINGS_ROUTES.profile,
  },
  {
    id: "social",
    label: "Social Channels",
    icon: Puzzle,
    to: CREATOR_SETTINGS_ROUTES.social,
  },
  {
    id: "payouts",
    label: "Payouts & Tax",
    icon: CreditCard,
    to: CREATOR_SETTINGS_ROUTES.payouts,
  },
] as const;

export function CreatorSettingsShell() {
  return (
    <div className="brand-settings creator-settings">
      <header className="brand-settings__header">
        <h1 className="brand-settings__title">Settings</h1>
        <p className="brand-settings__subtitle">
          Manage your creator identity, secure shipping logistics, team workspace access, and
          linked social performance nodes.
        </p>
      </header>

      <nav className="brand-settings__tabs" aria-label="Creator settings sections">
        {CREATOR_SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              className={({ isActive }) =>
                `brand-settings__tab ${isActive ? "brand-settings__tab--active" : ""}`
              }
            >
              <Icon size={18} aria-hidden />
              {tab.label}
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
