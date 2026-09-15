import type { PropsWithChildren } from "react";
import { Fragment } from "react";
import { useCreatorWorkspaceActorState } from "../../../shared/creator/creator-workspace-actor-context-value";
export function CommercialRouteGuard({ children }: PropsWithChildren) {
  const state = useCreatorWorkspaceActorState();
  if (!state || state.status === "LOADING")
    return (
      <p role="status" aria-busy="true">
        Verifying Commercial Setup access…
      </p>
    );
  if (
    state.status !== "READY" ||
    !state.actorContext.allowedActions.includes("COMMERCIAL_SETUP_READ")
  )
    return (
      <p role="alert">
        Commercial Setup access could not be verified. No active authorized
        membership is available.
      </p>
    );
  return <Fragment key={state.actorContext.workspaceId}>{children}</Fragment>;
}
