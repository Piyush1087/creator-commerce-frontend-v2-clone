import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import type { CreatorWorkspaceAction } from "../../../shared/creator/creator-workspace-actor.contract";
import { useCreatorWorkspaceActorState } from "../../../shared/creator/creator-workspace-actor-context-value";
import { CREATOR_SETTINGS_ROUTES } from "../constants/settings-routes";

type CreatorSettingsActionGuardProps = PropsWithChildren<{
  requiredAction: CreatorWorkspaceAction;
}>;

/**
 * Frontend projection only. The corresponding backend guard remains the
 * authorization authority for every Settings read and mutation.
 */
export function CreatorSettingsActionGuard({
  requiredAction,
  children,
}: CreatorSettingsActionGuardProps) {
  const state = useCreatorWorkspaceActorState();

  if (!state || state.status === "LOADING") {
    return (
      <p role="status" aria-busy="true">
        Verifying Creator workspace access…
      </p>
    );
  }

  if (
    state.status === "RECOVERY" ||
    !state.actorContext.allowedActions.includes(requiredAction)
  ) {
    return <Navigate to={CREATOR_SETTINGS_ROUTES.account} replace />;
  }

  return <>{children}</>;
}
