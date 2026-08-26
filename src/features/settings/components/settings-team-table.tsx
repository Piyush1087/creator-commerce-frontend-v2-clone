import { Badge, Button } from "../../../design-system/aurora";
import { ProgressBar } from "../../../design-system/aurora/components/ProgressBar";

export type SettingsTeamMemberRow = {
  id: string;
  name: string;
  email: string;
  initials: string;
  roleLabel: string;
  status: "ACTIVE" | "PENDING";
  isCurrentUser?: boolean;
  isExternal?: boolean;
  canRevoke?: boolean;
  canChangeRole?: boolean;
  canCancelInvite?: boolean;
  canResendInvite?: boolean;
};

type SettingsTeamTableProps = {
  members: SettingsTeamMemberRow[];
  maxSeats: number;
  inviteDisabled?: boolean;
  inviteVisible?: boolean;
  inviteDisabledReason?: string;
  onInvite: () => void;
  onRevoke?: (memberId: string) => void;
  onResendInvite?: (memberId: string) => void;
  onCancelInvite?: (memberId: string) => void;
  onChangeRole?: (memberId: string) => void;
};

function roleBadgeTone(roleLabel: string): "success" | "neutral" | "pending" {
  if (
    roleLabel === "Admin" ||
    roleLabel === "Owner" ||
    roleLabel === "Brand Owner"
  ) {
    return "success";
  }
  if (roleLabel === "Campaign Manager" || roleLabel === "Manager") {
    return "neutral";
  }
  return "pending";
}

export function SettingsTeamTable({
  members,
  maxSeats,
  inviteDisabled = false,
  inviteVisible = true,
  inviteDisabledReason,
  onInvite,
  onRevoke,
  onResendInvite,
  onCancelInvite,
  onChangeRole,
}: SettingsTeamTableProps) {
  const activeCount = members.filter((m) => m.status === "ACTIVE").length;
  const pendingCount = members.filter((m) => m.status === "PENDING").length;
  const occupied = activeCount + pendingCount;
  const percent = Math.round((occupied / maxSeats) * 100);

  return (
    <>
      <div className="settings-team__toolbar">
        <div>
          <p className="settings-team__capacity">
            Capacity tracker: {occupied} / {maxSeats} active workspace seats
            occupied
          </p>
          <ProgressBar label="Seat usage" value={percent} />
        </div>
        {inviteVisible && (
          <Button
            variant="primary"
            disabled={inviteDisabled}
            onClick={onInvite}
          >
            Invite new member
          </Button>
        )}
      </div>

      {inviteDisabled && inviteDisabledReason ? (
        <p className="settings-team__capacity-warning">
          {inviteDisabledReason}
        </p>
      ) : null}

      <div className="settings-team__table-wrap">
        <table className="settings-team__table">
          <thead>
            <tr>
              <th>Member identity</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>
                  <div className="settings-team__member">
                    <span className="settings-team__avatar" aria-hidden>
                      {member.initials}
                    </span>
                    <div>
                      <p className="settings-team__member-name">
                        {member.name}
                      </p>
                      <p className="settings-team__member-email">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge tone={roleBadgeTone(member.roleLabel)}>
                    {member.roleLabel}
                  </Badge>
                </td>
                <td>
                  <span
                    className={
                      member.status === "ACTIVE"
                        ? "settings-team__status settings-team__status--active"
                        : "settings-team__status settings-team__status--pending"
                    }
                  >
                    {member.status === "ACTIVE" ? "Active" : "Invite pending"}
                  </span>
                </td>
                <td>
                  <div className="settings-team__actions">
                    {member.canChangeRole && onChangeRole ? (
                      <Button
                        variant="ghost"
                        onClick={() => onChangeRole(member.id)}
                      >
                        Change role
                      </Button>
                    ) : null}
                    {member.isCurrentUser ? (
                      <span className="settings-team__action-muted">
                        Manage permissions
                      </span>
                    ) : member.status === "PENDING" ? (
                      <>
                        {member.canResendInvite !== false && (
                          <button
                            type="button"
                            className="settings-team__action-link"
                            onClick={() => onResendInvite?.(member.id)}
                          >
                            Resend invitation
                          </button>
                        )}
                        {member.canResendInvite !== false &&
                          member.canCancelInvite !== false && (
                            <span aria-hidden>•</span>
                          )}
                        {member.canCancelInvite !== false && (
                          <button
                            type="button"
                            className="settings-team__action-link settings-team__action-link--danger"
                            onClick={() => onCancelInvite?.(member.id)}
                          >
                            Cancel invite
                          </button>
                        )}
                      </>
                    ) : (
                      member.canRevoke !== false && (
                        <button
                          type="button"
                          className="settings-team__action-link settings-team__action-link--danger"
                          onClick={() => onRevoke?.(member.id)}
                        >
                          Revoke access
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
