import { Outlet, Link, useLocation } from "react-router-dom";

import { AUTH_ROUTES } from "../../features/auth/constants";
import "../../features/creator-campaigns/creator-campaigns.css";
import "./MarketplaceGuestLayout.css";

export function MarketplaceGuestLayout() {
  const location = useLocation();
  const loginState = { from: `${location.pathname}${location.search}` };

  return (
    <div className="cc-guest-shell">
      <header className="cc-guest-shell__header">
        <span className="cc-guest-shell__brand">
          Campaign opportunity entry
        </span>
        <div className="cc-guest-shell__actions">
          <Link
            className="aurora-button aurora-button--outline"
            to={AUTH_ROUTES.login}
            state={loginState}
          >
            Sign in
          </Link>
        </div>
      </header>
      <main className="cc-guest-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
