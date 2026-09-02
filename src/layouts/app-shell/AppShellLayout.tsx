import { Outlet, useLocation } from "react-router-dom";

import { BrandCentreShellProvider } from "../../features/brand-centre/context/brand-centre-shell-context";
import { useAuthSessionSync } from "../../shared/auth/use-auth-session-sync";
import { useAuthSession } from "../../shared/auth/use-auth-session";
import { normalizeUserRole } from "../../shared/auth/user-role";
import { AppShell } from "./AppShell";
import { resolveAppShellMainVariant } from "./sidebar-items";

export function AppShellLayout() {
  useAuthSessionSync();
  const location = useLocation();
  const session = useAuthSession();
  const role = normalizeUserRole(session.currentUser?.role);
  const mainVariant = resolveAppShellMainVariant(location.pathname, role);

  return (
    <BrandCentreShellProvider>
      <AppShell mainVariant={mainVariant}>
        <Outlet />
      </AppShell>
    </BrandCentreShellProvider>
  );
}
