import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Alert,
  Badge,
  Button,
  ProgressBar,
  SelectField,
  SideDrawer,
  TextField,
} from "../../../../design-system/aurora";
import type {
  CreatorTeamAssignableRole,
  CreatorTeamInvitation,
  CreatorTeamMember,
  CreatorTeamResponse,
  InviteCreatorTeamMemberPayload,
} from "../../contracts/creator-team.contracts";
import { useCreatorTeamSettings } from "../../hooks/use-creator-team-settings";
import {
  canManageCreatorTeam,
  canMutateCreatorTeamMember,
  canViewCreatorTeam,
  CREATOR_TEAM_ROLE_OPTIONS,
} from "../../utils/creator-team-authority";
import { SettingsSectionCard } from "../settings-section-card";
import "./creator-team-settings.css";

type TeamAction =
  | { kind: "invite" }
  | { kind: "role"; member: CreatorTeamMember }
  | { kind: "remove"; member: CreatorTeamMember };

type Props = {
  data: CreatorTeamResponse;
  inviteMember: (payload: InviteCreatorTeamMemberPayload) => Promise<unknown>;
  changeRole: (
    membershipId: string,
    role: CreatorTeamAssignableRole,
  ) => Promise<unknown>;
  removeMember: (membershipId: string) => Promise<unknown>;
  cancelInvitation: (invitationId: string) => Promise<unknown>;
};

const roleLabel: Record<
  CreatorTeamMember["role"] | CreatorTeamInvitation["role"],
  string
> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  ASSISTANT: "Assistant",
};

export function CreatorTeamSettings({
  data,
  inviteMember,
  changeRole,
  removeMember,
  cancelInvitation,
}: Props) {
  const [action, setAction] = useState<TeamAction | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CreatorTeamAssignableRole>("ASSISTANT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const canView = canViewCreatorTeam(data);
  const canManage = canManageCreatorTeam(data);
  const seats = data.team.seat_usage;
  const occupied = seats.active_members + seats.pending_invitations;
  const usage = Math.round((occupied / seats.max_seats) * 100);

  const rows = useMemo(
    () => [
      ...data.team.members.map((member) => ({
        kind: "member" as const,
        id: member.membership_id,
        member,
      })),
      ...data.team.pending_invitations.map((invitation) => ({
        kind: "invitation" as const,
        id: invitation.invitation_id,
        invitation,
      })),
    ],
    [data.team.members, data.team.pending_invitations],
  );

  if (!canView) {
    return (
      <Alert tone="warning" title="Team settings unavailable">
        Assistants can manage personal login security, but cannot view or
        administer workspace membership.
      </Alert>
    );
  }

  const run = async (operation: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await operation();
      setSuccess(message);
      setAction(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Creator Team action failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (!action) return;
    if (action.kind === "invite") {
      void run(
        () =>
          inviteMember({ recipientEmail: email.trim(), allocatedRole: role }),
        "Invitation sent.",
      );
      return;
    }
    if (action.kind === "role") {
      void run(
        () => changeRole(action.member.membership_id, role),
        "Team role updated.",
      );
      return;
    }
    void run(
      () => removeMember(action.member.membership_id),
      "Team access removed.",
    );
  };

  return (
    <div className="creator-team-settings">
      {error && !action ? (
        <Alert tone="error" title="Team action failed">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <div role="status">
          <Alert tone="success" title="Team updated">
            {success}
          </Alert>
        </div>
      ) : null}

      <SettingsSectionCard
        title="Creator Team"
        description="Manage direct User access to this Creator workspace. The canonical Creator remains the sole Owner."
        action={
          canManage ? (
            <Button
              type="button"
              disabled={seats.is_at_capacity || busy}
              aria-describedby={
                seats.is_at_capacity
                  ? "creator-team-capacity-warning"
                  : undefined
              }
              onClick={() => {
                setError(null);
                setEmail("");
                setRole("ASSISTANT");
                setAction({ kind: "invite" });
              }}
            >
              Invite team member
            </Button>
          ) : undefined
        }
      >
        <div className="creator-team-settings__capacity">
          <p>
            {occupied} of {seats.max_seats} seats occupied, including pending
            invitations.
          </p>
          <ProgressBar label="Creator Team seat usage" value={usage} />
        </div>

        {seats.is_at_capacity ? (
          <div id="creator-team-capacity-warning">
            <Alert tone="warning" title="Workspace is at capacity">
              Remove a non-Owner member or cancel a pending invitation before
              inviting someone else.
            </Alert>
          </div>
        ) : null}

        <div
          className="creator-team-roster"
          role="table"
          aria-label="Creator Team roster"
        >
          <div className="creator-team-roster__header" role="row">
            <span role="columnheader">Member identity</span>
            <span role="columnheader">Role</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Actions</span>
          </div>
          <div role="rowgroup">
            {rows.map((row) => {
              const member = row.kind === "member" ? row.member : null;
              const invitation =
                row.kind === "invitation" ? row.invitation : null;
              const emailValue = member?.email ?? invitation?.email ?? "";
              const name = member?.name?.trim() || emailValue.split("@")[0];
              const status = member?.status ?? invitation?.status ?? "PENDING";
              const canMutate = member
                ? canMutateCreatorTeamMember(data, member)
                : false;
              return (
                <div
                  className="creator-team-roster__row"
                  role="row"
                  key={row.id}
                >
                  <div
                    className="creator-team-roster__cell creator-team-roster__identity"
                    role="cell"
                    data-label="Member identity"
                  >
                    <span className="creator-team-roster__avatar" aria-hidden>
                      {name.slice(0, 1).toUpperCase() || "?"}
                    </span>
                    <span className="creator-team-roster__identity-copy">
                      <strong>{name}</strong>
                      <span>{emailValue}</span>
                    </span>
                  </div>
                  <div
                    className="creator-team-roster__cell"
                    role="cell"
                    data-label="Role"
                  >
                    <Badge tone={member?.is_owner ? "success" : "neutral"}>
                      {
                        roleLabel[
                          member?.role ?? invitation?.role ?? "ASSISTANT"
                        ]
                      }
                    </Badge>
                  </div>
                  <div
                    className="creator-team-roster__cell"
                    role="cell"
                    data-label="Status"
                  >
                    <Badge
                      tone={
                        status === "ACTIVE"
                          ? "success"
                          : status === "UNRESOLVED"
                            ? "error"
                            : "pending"
                      }
                    >
                      {status === "ACTIVE"
                        ? "Active"
                        : status === "UNRESOLVED"
                          ? "Unresolved — no User access"
                          : "Invitation pending"}
                    </Badge>
                  </div>
                  <div
                    className="creator-team-roster__cell creator-team-roster__actions"
                    role="cell"
                    data-label="Actions"
                  >
                    {member?.is_owner ? (
                      <span>Owner protected</span>
                    ) : member?.is_current_actor ? (
                      <span>Current account</span>
                    ) : member && canMutate ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setError(null);
                            setRole(
                              member.role === "MANAGER"
                                ? "MANAGER"
                                : "ASSISTANT",
                            );
                            setAction({ kind: "role", member });
                          }}
                        >
                          Change role
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setError(null);
                            setAction({ kind: "remove", member });
                          }}
                        >
                          Remove access
                        </Button>
                      </>
                    ) : invitation?.can_cancel && canManage ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => cancelInvitation(invitation.invitation_id),
                            "Invitation cancelled.",
                          )
                        }
                      >
                        Cancel invitation
                      </Button>
                    ) : (
                      <span>No actions available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SettingsSectionCard>

      <SideDrawer
        isOpen={action !== null}
        onClose={() => {
          if (!busy) setAction(null);
        }}
        closeLabel="Close Creator Team action"
        title={
          action?.kind === "invite"
            ? "Invite Creator Team member"
            : action?.kind === "role"
              ? "Change Creator Team role"
              : "Remove Creator Team access"
        }
        subtitle="Owner authority cannot be invited, transferred, demoted, or removed here."
        width="480px"
        footer={
          <div className="creator-team-drawer__footer">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => setAction(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="creator-team-action-form"
              disabled={
                busy ||
                (action?.kind === "invite" && !email.trim().includes("@"))
              }
            >
              {busy
                ? "Working…"
                : action?.kind === "invite"
                  ? "Send invitation"
                  : action?.kind === "role"
                    ? "Save role"
                    : "Confirm removal"}
            </Button>
          </div>
        }
      >
        <form
          id="creator-team-action-form"
          className="creator-team-drawer__form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {error ? (
            <Alert tone="error" title="Team action failed">
              {error}
            </Alert>
          ) : null}
          {action?.kind === "invite" ? (
            <TextField
              label="Recipient email"
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
              helperText="The recipient must sign in with an existing active Creator account to accept."
            />
          ) : null}
          {action?.kind === "invite" || action?.kind === "role" ? (
            <SelectField
              label="Workspace role"
              options={CREATOR_TEAM_ROLE_OPTIONS}
              value={role}
              disabled={busy}
              onChange={(event) =>
                setRole(event.target.value as CreatorTeamAssignableRole)
              }
            />
          ) : null}
          {action?.kind === "remove" ? (
            <p>
              Remove <strong>{action.member.email}</strong> from this Creator
              workspace? Their User account and historical records remain
              intact.
            </p>
          ) : null}
        </form>
      </SideDrawer>
    </div>
  );
}

export function CreatorTeamSettingsPanel() {
  const team = useCreatorTeamSettings();
  if (team.loading && !team.data) {
    return (
      <div className="creator-team-settings__loading" role="status">
        <Loader2 aria-hidden />
        <span>Loading Creator Team…</span>
      </div>
    );
  }
  if (!team.data) {
    return (
      <Alert tone="error" title="Creator Team unavailable">
        {team.error ?? "Creator Team settings could not be loaded."}
      </Alert>
    );
  }
  return (
    <CreatorTeamSettings
      data={team.data}
      inviteMember={team.invite}
      changeRole={team.changeRole}
      removeMember={team.remove}
      cancelInvitation={team.cancelInvitation}
    />
  );
}
