import { useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { Alert } from "../../../design-system/aurora";
import type { CreatorShellState } from "../../../layouts/app-shell/creator-shell-capabilities";
import { getCreatorSettingsNavigation } from "../utils/creator-settings-navigation";
import "../settings.css";

type CreatorSettingsShellProps = {
  shellState?: CreatorShellState;
};

/**
 * Shared Settings shell. P2 supplies the resolved P1B actor state; the loading
 * default fails closed so administrative tabs cannot flash before resolution.
 */
export function CreatorSettingsShell({
  shellState = { status: "LOADING", actorContext: null },
}: CreatorSettingsShellProps) {
  const location = useLocation();
  const tabsRef = useRef<HTMLElement>(null);
  const tabs = getCreatorSettingsNavigation(shellState);

  useEffect(() => {
    tabsRef.current
      ?.querySelector<HTMLElement>(".brand-settings__tab--active")
      ?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [location.pathname]);

  return (
    <div className="brand-settings creator-settings">
      <header className="brand-settings__header">
        <h1 className="brand-settings__title">Settings</h1>
        <p className="brand-settings__subtitle">
          Manage account security and the Creator workspace areas your Team role
          permits.
        </p>
      </header>

      {shellState.status === "RECOVERY" ? (
        <Alert tone="warning" title="Workspace settings are limited">
          {shellState.reason} Account security remains available while the
          workspace is recovered.
        </Alert>
      ) : null}
      {shellState.status === "LOADING" ? (
        <p className="creator-settings__access-status" role="status">
          Loading Creator workspace access…
        </p>
      ) : null}

      <nav
        ref={tabsRef}
        className="brand-settings__tabs"
        aria-label="Creator settings sections"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            location.pathname === tab.to ||
            location.pathname.startsWith(`${tab.to}/`);

          if (tab.availability === "UNAVAILABLE") {
            return (
              <span
                key={tab.id}
                className="brand-settings__tab brand-settings__tab--disabled"
                aria-disabled="true"
                aria-label={`${tab.label}. ${tab.unavailableReason ?? "Unavailable"}`}
                title={tab.unavailableReason}
              >
                <Icon size={18} aria-hidden />
                {tab.label}
              </span>
            );
          }

          return (
            <Link
              key={tab.id}
              to={tab.to}
              aria-current={active ? "page" : undefined}
              className={`brand-settings__tab ${active ? "brand-settings__tab--active" : ""}`}
            >
              <Icon size={18} aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
