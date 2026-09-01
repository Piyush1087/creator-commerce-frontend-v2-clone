import type { CreatorWorkspaceActorContextResponse } from "../../features/settings/contracts/creator-team.contracts";
import {
  CREATOR_WORKSPACE_ACTIONS,
  type CreatorWorkspaceAction,
  type CreatorWorkspaceActorContext,
  type CreatorWorkspaceActorRole,
} from "./creator-workspace-actor.contract";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isActorRole(value: unknown): value is CreatorWorkspaceActorRole {
  return value === "OWNER" || value === "MANAGER" || value === "ASSISTANT";
}

function isActorAction(value: unknown): value is CreatorWorkspaceAction {
  return (
    typeof value === "string" &&
    (CREATOR_WORKSPACE_ACTIONS as readonly string[]).includes(value)
  );
}

/**
 * Converts the backend's transport shape into the one shared actor contract.
 * Any identity mismatch fails closed; role/action policy is never inferred in
 * the browser.
 */
export function toCreatorWorkspaceActorContext(
  value: CreatorWorkspaceActorContextResponse,
  expectedActorUserId: string,
): CreatorWorkspaceActorContext | null {
  if (
    !isNonEmptyString(expectedActorUserId) ||
    !isNonEmptyString(value.actor_user_id) ||
    value.actor_user_id !== expectedActorUserId ||
    !isNonEmptyString(value.actor_membership_id) ||
    !isActorRole(value.actor_role) ||
    !isNonEmptyString(value.workspace_id) ||
    !isNonEmptyString(value.organization_id) ||
    !isNonEmptyString(value.subject_creator_profile_id) ||
    !isNonEmptyString(value.subject_owner_user_id) ||
    !Array.isArray(value.allowed_actions) ||
    !value.allowed_actions.every(isActorAction) ||
    (value.actor_role === "OWNER" &&
      value.actor_user_id !== value.subject_owner_user_id)
  ) {
    return null;
  }

  return {
    actorUserId: value.actor_user_id,
    actorMembershipId: value.actor_membership_id,
    actorRole: value.actor_role,
    workspaceId: value.workspace_id,
    organizationId: value.organization_id,
    subjectCreatorProfileId: value.subject_creator_profile_id,
    subjectOwnerUserId: value.subject_owner_user_id,
    allowedActions: [...value.allowed_actions],
  };
}
