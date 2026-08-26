import { Outlet, useLocation } from "react-router-dom";

import { BrandCentreShellProvider } from "../../features/brand-centre/context/brand-centre-shell-context";
import { loadAuthSession } from "../../shared/auth/auth-session";
import { useAuthSessionSync } from "../../shared/auth/use-auth-session-sync";
import { normalizeUserRole } from "../../shared/auth/user-role";
import { AppShell } from "./AppShell";
import { resolveAppShellMainVariant } from "./sidebar-items";

export function AppShellLayout() {
  useAuthSessionSync();
  const location = useLocation();
  const role = normalizeUserRole(loadAuthSession()?.user.role);
  const mainVariant = resolveAppShellMainVariant(location.pathname, role);

  return (
    <BrandCentreShellProvider>
      <AppShell
        mainVariant={mainVariant}
        brandWorkspace={
          location.pathname === "/brand-centre" && role === "BRAND"
        }
      >
        <Outlet />
      </AppShell>
    </BrandCentreShellProvider>
  );
}
