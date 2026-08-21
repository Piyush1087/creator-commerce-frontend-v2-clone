import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  Briefcase,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  PieChart,
  Settings,
  Users,
  X,
} from "lucide-react";

import { AUTH_ROUTES } from "../../features/auth/constants";
import "./brand-onboarding-shell.css";

const MOBILE_NAV = [
  { label: "Dashboard", path: "/", Icon: Home },
  { label: "Campaigns", path: "/campaigns", Icon: Briefcase },
  { label: "Network", path: "/network", Icon: Users },
  { label: "Insights", path: "/insights", Icon: PieChart },
] as const;

const DRAWER_NAV = [
  ...MOBILE_NAV,
  { label: "Settings", path: "/settings", Icon: Settings },
] as const;

export function BrandOnboardingShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="bons-shell">
      <header className="bons-shell__header">
        <div className="bons-shell__left">
          <Link className="bons-shell__brand" to="/" onClick={closeDrawer}>
            The Creator Shop
          </Link>
        </div>
        <div className="bons-shell__actions">
          <Link className="bons-shell__login" to={AUTH_ROUTES.login}>
            Login
          </Link>
          <button
            type="button"
            className="bons-shell__menu-btn"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={24} aria-hidden />
          </button>
        </div>
      </header>

      <div
        className={
          drawerOpen
            ? "bons-shell__drawer-backdrop bons-shell__drawer-backdrop--open"
            : "bons-shell__drawer-backdrop"
        }
        role="presentation"
        onClick={closeDrawer}
      />
      <aside
        ref={(drawer) => {
          if (drawer) drawer.inert = !drawerOpen;
        }}
        className={
          drawerOpen ? "bons-shell__drawer bons-shell__drawer--open" : "bons-shell__drawer"
        }
        aria-hidden={!drawerOpen}
      >
        <div className="bons-shell__drawer-header">
          <span className="bons-shell__drawer-title">Creator Shop</span>
          <button
            type="button"
            className="bons-shell__drawer-close"
            aria-label="Close menu"
            onClick={closeDrawer}
          >
            <X size={24} aria-hidden />
          </button>
        </div>

        <div className="bons-shell__drawer-list">
          {DRAWER_NAV.map((item) => (
            <Link key={item.label} to={item.path} onClick={closeDrawer}>
              <item.Icon size={20} aria-hidden />
              <span>{item.label}</span>
              <ChevronRight size={16} aria-hidden />
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="bons-shell__drawer-logout"
          onClick={closeDrawer}
        >
          <LogOut size={18} aria-hidden />
          Log out
        </button>
      </aside>

      <main className="bons-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
