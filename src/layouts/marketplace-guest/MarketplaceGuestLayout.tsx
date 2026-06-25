import { Outlet, Link, useLocation } from "react-router-dom";

import { Button } from "../../design-system/aurora";
import { AUTH_ROUTES } from "../../features/auth/constants";
import "../../features/creator-campaigns/creator-campaigns.css";
import "./MarketplaceGuestLayout.css";

export function MarketplaceGuestLayout() {
  const location = useLocation();
  const loginState = { from: `${location.pathname}${location.search}` };

  return (
    <div className="cc-guest-shell">
      <header className="cc-guest-shell__header">
        <Link to="/marketplace" className="cc-guest-shell__brand">
          Creator Marketplace
        </Link>
        <div className="cc-guest-shell__actions">
          <Link to={AUTH_ROUTES.login} state={loginState}>
            <Button variant="outline" size="sm">
              Sign in
            </Button>
          </Link>
        </div>
      </header>
      <main className="cc-guest-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
