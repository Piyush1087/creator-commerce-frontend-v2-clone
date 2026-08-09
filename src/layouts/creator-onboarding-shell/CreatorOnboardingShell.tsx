import { Link, Outlet } from "react-router-dom";

import { AUTH_ROUTES } from "../../features/auth/constants";
import { CREATOR_ONBOARDING_ROUTES } from "../../features/creator-onboarding/constants";
import "./creator-onboarding-shell.css";

export function CreatorOnboardingShell() {
  return (
    <div className="cobs-shell">
      <header className="cobs-shell__header">
        <Link className="cobs-shell__brand" to={CREATOR_ONBOARDING_ROUTES.landing}>
          The Creator Shop
        </Link>
        <nav className="cobs-shell__nav" aria-label="Marketing">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link to={AUTH_ROUTES.login}>Creator Login</Link>
        </nav>
        <Link className="cobs-shell__cta" to={CREATOR_ONBOARDING_ROUTES.landing}>
          Get Started
        </Link>
      </header>
      <main className="cobs-shell__main">
        <Outlet />
      </main>
      <footer className="cobs-shell__footer">
        <span>© {new Date().getFullYear()} The Creator Shop</span>
        <span className="cobs-shell__footer-note">Creator onboarding · API wired</span>
      </footer>
    </div>
  );
}
