import { useEffect, useState } from "react";

import { Alert, Button, Card } from "../../../../design-system/aurora";
import { useAuthSession } from "../../../../shared/auth/use-auth-session";
import { logoutCurrentSession } from "../../../auth/api/auth-client";
import {
  acceptCreatorTeamInvitation,
  CreatorTeamInvitationError,
  inspectCreatorTeamInvitation,
} from "../../api/creator-team-client";
import type { InspectCreatorTeamInvitationResponse } from "../../contracts/creator-team.contracts";
import "../../team-invitation.css";

type State =
  | "INSPECTING"
  | "READY"
  | "SUBMITTING"
  | "ACCEPTED"
  | "INVALID"
  | "EXPIRED"
  | "CONSUMED"
  | "FAILED";

function tokenFromLocation(): string {
  return (
    new URLSearchParams(window.location.hash.slice(1)).get("token") ??
    new URLSearchParams(window.location.search).get("token") ??
    ""
  );
}

function scrubTokenFromLocation(): void {
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.delete("token");
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}`,
  );
}

function terminalState(error: unknown): State {
  if (!(error instanceof CreatorTeamInvitationError)) return "FAILED";
  if (error.code === "INVITATION_EXPIRED") return "EXPIRED";
  if (error.code === "INVITATION_CONSUMED") return "CONSUMED";
  if (error.code === "INVITATION_INVALID") return "INVALID";
  return "FAILED";
}

export function CreatorTeamInvitationAcceptance({
  onAccepted,
}: {
  onAccepted?: () => void;
}) {
  const auth = useAuthSession();
  const [token] = useState(tokenFromLocation);
  const [state, setState] = useState<State>("INSPECTING");
  const [invitation, setInvitation] =
    useState<InspectCreatorTeamInvitationResponse | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    scrubTokenFromLocation();
    if (!token) {
      setState("INVALID");
      setMessage("This link does not contain a valid invitation.");
      return;
    }
    void inspectCreatorTeamInvitation(token)
      .then((result) => {
        if (!active) return;
        setInvitation(result);
        setState("READY");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState(terminalState(error));
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not inspect this Creator Team invitation.",
        );
      });
    return () => {
      active = false;
    };
  }, [token]);

  const invitedEmail = invitation?.email.trim().toLowerCase() ?? "";
  const currentEmail = auth.currentUser?.email.trim().toLowerCase() ?? "";
  const authenticated = auth.status === "AUTHENTICATED" && !!auth.currentUser;
  const exactAccount = authenticated && currentEmail === invitedEmail;
  const differentAccount = authenticated && currentEmail !== invitedEmail;

  const accept = async () => {
    if (!invitation || state === "SUBMITTING" || !exactAccount) return;
    setState("SUBMITTING");
    setMessage("");
    try {
      await acceptCreatorTeamInvitation(token);
      setState("ACCEPTED");
      onAccepted?.();
    } catch (error) {
      setState(terminalState(error));
      setMessage(
        error instanceof Error
          ? error.message
          : "Invitation acceptance failed.",
      );
    }
  };

  const signOut = async () => {
    setState("SUBMITTING");
    setMessage("");
    try {
      await logoutCurrentSession();
      setState("READY");
    } catch (error) {
      setState("FAILED");
      setMessage(
        error instanceof Error ? error.message : "Could not sign out.",
      );
    }
  };

  return (
    <main className="team-invitation">
      <Card>
        <h1>Join a Creator workspace</h1>
        {state === "INSPECTING" ? (
          <p role="status">Inspecting invitation…</p>
        ) : null}
        {state === "ACCEPTED" ? (
          <p role="status">Invitation accepted. Your workspace is ready.</p>
        ) : null}
        {message ? (
          <div role="alert">
            <Alert
              tone="error"
              title={
                state === "EXPIRED"
                  ? "Invitation expired"
                  : state === "CONSUMED"
                    ? "Invitation already accepted"
                    : state === "INVALID"
                      ? "Invalid invitation"
                      : "Invitation action failed"
              }
            >
              {message}
            </Alert>
          </div>
        ) : null}

        {invitation ? (
          <dl>
            <dt>Workspace</dt>
            <dd>{invitation.workspace_name}</dd>
            <dt>Email</dt>
            <dd>{invitation.email}</dd>
            <dt>Role</dt>
            <dd>{invitation.role === "MANAGER" ? "Manager" : "Assistant"}</dd>
            <dt>Expires</dt>
            <dd>{new Date(invitation.expires_at).toLocaleString()}</dd>
          </dl>
        ) : null}

        {invitation?.requires_existing_creator_account && state === "READY" ? (
          <Alert tone="warning" title="Existing Creator account required">
            Create and activate the invited Creator account, then sign in and
            reopen this link. Acceptance never fabricates a User account.
          </Alert>
        ) : null}

        {invitation && state === "READY" && differentAccount ? (
          <div className="team-invitation__account-warning">
            <Alert tone="warning" title="Use the invited account">
              You are signed in as {auth.currentUser?.email}. This invitation is
              for {invitation.email}.
            </Alert>
            <Button type="button" onClick={() => void signOut()}>
              Sign out and continue
            </Button>
          </div>
        ) : null}

        {invitation && state === "READY" && exactAccount ? (
          <div className="team-invitation__direct-accept">
            <p>Continue as {auth.currentUser?.email}.</p>
            <Button type="button" onClick={() => void accept()}>
              Accept invitation
            </Button>
          </div>
        ) : null}

        {invitation &&
        state === "READY" &&
        !authenticated &&
        !invitation.requires_existing_creator_account ? (
          <Alert tone="warning" title="Sign in to accept">
            Sign in with {invitation.email}, then reopen this invitation link.
          </Alert>
        ) : null}
      </Card>
    </main>
  );
}
