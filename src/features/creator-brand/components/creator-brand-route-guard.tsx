import type { PropsWithChildren } from "react";
import { useCreatorWorkspaceActorState } from "../../../shared/creator/creator-workspace-actor-context-value";

/** Projection of authenticated Team authority only; no source/Entry prerequisite. */
export function CreatorBrandRouteGuard({ children }: PropsWithChildren) {
  const state = useCreatorWorkspaceActorState();
  if (!state || state.status === "LOADING")
    return (
      <p role="status" aria-busy="true">
        Verifying Creator workspace access…
      </p>
    );
  if (
    state.status !== "READY" ||
    !state.actorContext.allowedActions.includes("CREATOR_BRAND_READ")
  )
    return (
      <p role="alert">
        Creator Brand access could not be verified. No active authorized
        membership is available.
      </p>
    );
  return <>{children}</>;
}
