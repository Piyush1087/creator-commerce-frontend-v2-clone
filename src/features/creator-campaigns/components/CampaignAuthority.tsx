import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Outlet } from "react-router-dom";
import { useCreatorWorkspaceActorState } from "../../../shared/creator/creator-workspace-actor-context-value";
import { useAuthSession } from "../../../shared/auth/use-auth-session";
import {
  CampaignScope,
  actorIdentity,
  sessionIdentity,
} from "../api/c03-scope";

const ScopeContext = createContext<CampaignScope | null>(null);
export function useCampaignScope() {
  const scope = useContext(ScopeContext);
  if (!scope) throw new Error("Campaign authority is required");
  return scope;
}
export function ScopedCampaigns({
  children,
  authority,
}: {
  children: ReactNode;
  authority?: string;
}) {
  const [scope] = useState(() => new CampaignScope(authority));
  const mounted = useRef(false);
  const current = useSyncExternalStore(scope.subscribe, scope.getSnapshot);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      queueMicrotask(() => {
        if (!mounted.current) scope.dispose();
      });
    };
  }, [scope]);
  if (!current)
    return (
      <div className="cc-workspace" role="alert">
        Your access changed. Reload to verify your current workspace.
      </div>
    );
  return (
    <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>
  );
}
export function CampaignAuthority({ children }: { children?: ReactNode }) {
  const actor = useCreatorWorkspaceActorState();
  useAuthSession();
  if (actor?.status !== "READY")
    return (
      <div className="cc-workspace" role="status">
        {actor?.status === "RECOVERY"
          ? actor.reason
          : "Verifying Creator workspace access…"}
      </div>
    );
  return (
    <ScopedCampaigns
      key={sessionIdentity() + actorIdentity(actor.actorContext)}
      authority={sessionIdentity() + actorIdentity(actor.actorContext)}
    >
      {children ?? <Outlet />}
    </ScopedCampaigns>
  );
}
