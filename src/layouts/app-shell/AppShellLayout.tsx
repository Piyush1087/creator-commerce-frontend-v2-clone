import { Outlet, useLocation } from "react-router-dom";

import { BrandCentreShellProvider } from "../../features/brand-centre/context/brand-centre-shell-context";
import { loadAuthSession } from "../../shared/auth/auth-session";
import { normalizeUserRole } from "../../shared/auth/user-role";
import { AppShell } from "./AppShell";
import { resolveAppShellMainVariant } from "./sidebar-items";

export function AppShellLayout() {
  const location = useLocation();
  const role = normalizeUserRole(loadAuthSession()?.user.role);
  const mainVariant = resolveAppShellMainVariant(location.pathname, role);

  return (
    <BrandCentreShellProvider>
      <AppShell mainVariant={mainVariant}>
        <Outlet />
      </AppShell>
    </BrandCentreShellProvider>
  );
}
