import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Outlet } from "react-router-dom";
import { Button } from "../../../design-system/aurora";
import { useCreatorWorkspaceActorState } from "../../../shared/creator/creator-workspace-actor-context-value";
import { useAuthSession } from "../../../shared/auth/use-auth-session";
import {
  CampaignScope,
  actorIdentity,
  sessionIdentity,
} from "../api/c03-scope";

import { ScopeContext } from "../hooks/campaign-scope-context";
export function ScopedCampaigns({
  children,
  authority,
  fallback,
}: {
  children: ReactNode;
  authority?: string;
  fallback?: ReactNode;
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
  if (!current && fallback) return <>{fallback}</>;
  if (!current)
    return (
      <div className="cc-workspace" role="alert">
        <h1>Campaigns</h1>
        <p>Your access changed. Reload to verify your current workspace.</p>
        <Button onClick={() => window.location.reload()}>
          Reload workspace access
        </Button>
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
        <h1>Campaigns</h1>
        <p>
          {actor?.status === "RECOVERY"
            ? actor.reason
            : "Verifying Creator workspace access…"}
        </p>
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

export function CampaignOpportunityAuthority() {
  const actor = useCreatorWorkspaceActorState();
  return actor?.status === "READY" &&
    actor.actorContext.allowedActions.includes("CAMPAIGN_OPPORTUNITY_VIEW") ? (
    <Outlet />
  ) : (
    <section className="c03-content">
      <h1>Opportunities</h1>
      <p role="status">
        Your current workspace access does not allow viewing Opportunities.
      </p>
    </section>
  );
}
