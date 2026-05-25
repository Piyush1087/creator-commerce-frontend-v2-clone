import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  ChevronRight,
  Home,
  Info,
  LogOut,
  Menu,
  PieChart,
  Settings,
  Users,
  X,
} from "lucide-react";

import "./brand-onboarding-shell.css";

const MARKETING_LINKS = ["How it works", "Features", "Pricing"] as const;

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
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isScan = location.pathname.endsWith("/brand/onboarding/scan");

  const closeDrawer = () => setDrawerOpen(false);
  const startScan = () => {
    closeDrawer();
    navigate("/");
  };

  if (isScan) {
    return (
      <div className="bons-shell bons-shell--scan">
        <header className="bons-shell__header bons-shell__header--scan">
          <button
            type="button"
            className="bons-shell__icon-btn"
            aria-label="Close scan and return home"
            onClick={() => navigate("/")}
          >
            <X size={20} aria-hidden />
          </button>
          <span className="bons-shell__scan-title">Aurora AI Scan</span>
          <button
            type="button"
            className="bons-shell__icon-btn"
            aria-label="Scan information"
          >
            <Info size={20} aria-hidden />
          </button>
        </header>
        <main className="bons-shell__main">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="bons-shell">
      <header className="bons-shell__header">
        <div className="bons-shell__left">
          <Link className="bons-shell__brand" to="/" onClick={closeDrawer}>
            The Creator Shop
          </Link>
          <nav className="bons-shell__nav" aria-label="Marketing sections">
            {MARKETING_LINKS.map((item) => (
              <a href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} key={item}>
                {item}
              </a>
            ))}
          </nav>
        </div>
        <div className="bons-shell__actions">
          <Link className="bons-shell__login" to="/">
            Login
          </Link>
          <button
            type="button"
            className="bons-shell__cta"
            onClick={startScan}
          >
            Start Your Free Scan →
          </button>
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
        className={
          drawerOpen ? "bons-shell__drawer bons-shell__drawer--open" : "bons-shell__drawer"
        }
        aria-hidden={!drawerOpen}
      >
        <div className="bons-shell__drawer-header">
          <span className="bons-shell__drawer-title">Aurora</span>
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
