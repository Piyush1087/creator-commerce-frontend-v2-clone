import { useState } from "react";
import {
  Alert,
  Button,
  SelectField,
  SideDrawer,
  TextField,
} from "../../../../design-system/aurora";
import type {
  BrandGeneralResponse,
  BrandSettingsRole,
  InviteTeamMemberPayload,
  TeamInvitationDispatch,
  UpdateTeamRolePayload,
} from "../../contracts/brand-settings.contracts";
import { mapBrandTeamRows } from "../../utils/brand-settings-display";
import { teamRoleOptions } from "../../utils/brand-team-authority";
import { SettingsTeamTable } from "../settings-team-table";

type Props = {
  data: BrandGeneralResponse;
  inviteMember: (
    input: InviteTeamMemberPayload,
  ) => Promise<TeamInvitationDispatch>;
  revokeMember: (id: string) => Promise<void>;
  cancelInvitation: (id: string) => Promise<void>;
  changeRole: (input: UpdateTeamRolePayload) => Promise<void>;
};

export function BrandTeamSettings({
  data,
  inviteMember,
  revokeMember,
  cancelInvitation,
  changeRole,
}: Props) {
  const [action, setAction] = useState<{
    kind: "invite" | "role" | "revoke";
    id?: string;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BrandSettingsRole>("CAMPAIGN_MANAGER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const options = teamRoleOptions(data.current_user_role);
  const seats = data.team.seat_usage;
  const atCapacity =
    seats.active_members + seats.pending_invitations >= seats.max_seats;
  const run = async (operation: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await operation();
      setSuccess(message);
      setAction(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Team action failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const submit = () => {
    if (!action) return;
    if (action.kind === "invite")
      void run(
        () => inviteMember({ email: email.trim(), role }),
        "Invitation email dispatched.",
      );
    if (action.kind === "role" && action.id)
      void run(
        () => changeRole({ membershipId: action.id!, role }),
        "Workspace role updated.",
      );
    if (action.kind === "revoke" && action.id)
      void run(() => revokeMember(action.id!), "Workspace membership revoked.");
  };
  return (
    <>
      {error && !action && (
        <Alert tone="error" title="Team action failed">
          {error}
        </Alert>
      )}
      {success && (
        <div role="status">
          <Alert tone="success" title="Team updated">
            {success}
          </Alert>
        </div>
      )}
      <SettingsTeamTable
        members={mapBrandTeamRows(data)}
        maxSeats={seats.max_seats}
        inviteVisible={options.length > 0}
        inviteDisabled={atCapacity || busy}
        inviteDisabledReason={
          atCapacity
            ? "Workspace seat capacity fully exhausted. Revoke a member or cancel a pending invitation."
            : undefined
        }
        onInvite={() => {
          setError(null);
          setEmail("");
          setRole("CAMPAIGN_MANAGER");
          setAction({ kind: "invite" });
        }}
        onRevoke={(id) => {
          if (!busy) {
            setError(null);
            setAction({ kind: "revoke", id });
          }
        }}
        onChangeRole={(id) => {
          if (!busy) {
            setError(null);
            setRole(
              data.team.members.find((member) => member.membership_id === id)
                ?.role ?? "CAMPAIGN_MANAGER",
            );
            setAction({ kind: "role", id });
          }
        }}
        onCancelInvite={(id) => {
          if (!busy)
            void run(() => cancelInvitation(id), "Invitation cancelled.");
        }}
      />
      {options.length === 0 && (
        <p>
          Campaign Managers can view the team but cannot administer membership
          or roles.
        </p>
      )}
      <SideDrawer
        isOpen={action !== null}
        onClose={() => {
          if (!busy) setAction(null);
        }}
        closeLabel="Close team action"
        title={
          action?.kind === "invite"
            ? "Invite team member"
            : action?.kind === "role"
              ? "Change workspace role"
              : "Revoke workspace access"
        }
        width="460px"
        footer={
          <div className="settings-drawer-footer">
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setAction(null)}
            >
              Cancel
            </Button>
            <Button type="submit" form="brand-team-action" disabled={busy}>
              {busy
                ? "Submitting…"
                : action?.kind === "invite"
                  ? "Send invitation"
                  : action?.kind === "role"
                    ? "Save role"
                    : "Confirm revoke"}
            </Button>
          </div>
        }
      >
        <form
          id="brand-team-action"
          className="settings-drawer-body"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {error && (
            <Alert tone="error" title="Team action failed">
              {error}
            </Alert>
          )}
          {action?.kind === "invite" && (
            <TextField
              label="Recipient email"
              type="email"
              required
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}
          {action?.kind !== "revoke" && (
            <SelectField
              label="Workspace role"
              options={options}
              value={role}
              disabled={busy}
              onChange={(event) =>
                setRole(event.target.value as BrandSettingsRole)
              }
            />
          )}
          {action?.kind === "revoke" && (
            <p>
              This removes the member’s access to membership-protected workspace
              features. It does not delete their account or historical records.
            </p>
          )}
        </form>
      </SideDrawer>
    </>
  );
}
