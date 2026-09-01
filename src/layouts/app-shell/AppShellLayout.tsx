import { Outlet, useLocation } from "react-router-dom";

import { BrandCentreShellProvider } from "../../features/brand-centre/context/brand-centre-shell-context";
import { useAuthSessionSync } from "../../shared/auth/use-auth-session-sync";
import { useAuthSession } from "../../shared/auth/use-auth-session";
import { normalizeUserRole } from "../../shared/auth/user-role";
import { CreatorWorkspaceActorProvider } from "../../shared/creator/creator-workspace-actor-context";
import { useCreatorWorkspaceActorState } from "../../shared/creator/creator-workspace-actor-context-value";
import { AppShell } from "./AppShell";
import { resolveAppShellMainVariant } from "./sidebar-items";

type AppShellLayoutContentProps = {
  brandWorkspace: boolean;
  mainVariant: ReturnType<typeof resolveAppShellMainVariant>;
};

function AppShellLayoutContent({
  brandWorkspace,
  mainVariant,
}: AppShellLayoutContentProps) {
  const creatorShellState = useCreatorWorkspaceActorState();

  return (
    <BrandCentreShellProvider>
      <AppShell
        mainVariant={mainVariant}
        brandWorkspace={brandWorkspace}
        creatorShellState={creatorShellState}
      >
        <Outlet />
      </AppShell>
    </BrandCentreShellProvider>
  );
}

export function AppShellLayout() {
  useAuthSessionSync();
  const location = useLocation();
  const session = useAuthSession();
  const role = normalizeUserRole(session.currentUser?.role);
  const mainVariant = resolveAppShellMainVariant(location.pathname, role);
  const creatorSession =
    session.status === "AUTHENTICATED" && role === "CREATOR";

  return (
    <CreatorWorkspaceActorProvider
      enabled={creatorSession}
      actorUserId={session.currentUser?.id}
    >
      <AppShellLayoutContent
        mainVariant={mainVariant}
        brandWorkspace={
          location.pathname === "/brand-centre" && role === "BRAND"
        }
      />
    </CreatorWorkspaceActorProvider>
  );
}
