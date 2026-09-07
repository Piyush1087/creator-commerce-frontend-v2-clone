import type {
  CreatorTeamAssignableRole,
  CreatorTeamMember,
  CreatorTeamResponse,
} from "../contracts/creator-team.contracts";

export const CREATOR_TEAM_ROLE_OPTIONS: Array<{
  value: CreatorTeamAssignableRole;
  label: string;
}> = [
  {
    value: "MANAGER",
    label: "Manager — workspace settings and non-Owner Team administration",
  },
  {
    value: "ASSISTANT",
    label: "Assistant — personal account security only in Settings",
  },
];

export function canViewCreatorTeam(data: CreatorTeamResponse): boolean {
  return data.actor.allowed_actions.includes("TEAM_READ");
}

export function canManageCreatorTeam(data: CreatorTeamResponse): boolean {
  return data.actor.allowed_actions.includes("TEAM_MANAGE");
}

export function canMutateCreatorTeamMember(
  data: CreatorTeamResponse,
  member: CreatorTeamMember,
): boolean {
  return (
    canManageCreatorTeam(data) &&
    !member.is_owner &&
    !member.is_current_actor &&
    member.can_change_role &&
    member.can_remove
  );
}
