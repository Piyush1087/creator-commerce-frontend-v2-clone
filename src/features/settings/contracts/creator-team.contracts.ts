import type {
  CreatorWorkspaceAction,
  CreatorWorkspaceActorRole,
} from "../../../shared/creator/creator-workspace-actor.contract";

export type CreatorTeamRole = CreatorWorkspaceActorRole;
export type CreatorTeamAssignableRole = Exclude<CreatorTeamRole, "OWNER">;
export type { CreatorWorkspaceAction };

export type CreatorWorkspaceActorContextResponse = {
  actor_user_id: string;
  actor_membership_id: string;
  actor_role: CreatorTeamRole;
  workspace_id: string;
  organization_id: string;
  subject_creator_profile_id: string;
  subject_owner_user_id: string;
  allowed_actions: CreatorWorkspaceAction[];
};

export type CreatorTeamMember = {
  membership_id: string;
  user_id: string | null;
  name: string | null;
  email: string;
  role: CreatorTeamRole;
  status: "ACTIVE" | "UNRESOLVED";
  is_current_actor: boolean;
  is_owner: boolean;
  can_change_role: boolean;
  can_remove: boolean;
};

export type CreatorTeamInvitation = {
  invitation_id: string;
  email: string;
  role: CreatorTeamAssignableRole;
  status: "PENDING";
  expires_at: string;
  can_cancel: boolean;
};

export type CreatorTeamResponse = {
  actor: {
    user_id: string;
    membership_id: string;
    role: CreatorTeamRole;
    allowed_actions: CreatorWorkspaceAction[];
  };
  workspace: {
    workspace_id: string;
    organization_name: string;
    subject_creator_profile_id: string;
  };
  team: {
    members: CreatorTeamMember[];
    pending_invitations: CreatorTeamInvitation[];
    seat_usage: {
      active_members: number;
      pending_invitations: number;
      max_seats: number;
      is_at_capacity: boolean;
    };
  };
};

export type InviteCreatorTeamMemberPayload = {
  recipientEmail: string;
  allocatedRole: CreatorTeamAssignableRole;
};

export type CreatorTeamInvitationDispatch = {
  invitation_id: string;
  email: string;
  role: CreatorTeamAssignableRole;
  expires_at: string;
  delivery_status: "DISPATCHED";
};

export type InspectCreatorTeamInvitationResponse = {
  workspace_name: string;
  email: string;
  role: CreatorTeamAssignableRole;
  expires_at: string;
  requires_existing_creator_account: boolean;
};
