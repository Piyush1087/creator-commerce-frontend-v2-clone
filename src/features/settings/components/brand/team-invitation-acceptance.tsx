import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  TextField,
} from "../../../../design-system/aurora";
import { adoptAuthSession } from "../../../../shared/auth/auth-session";
import { AUTH_ROUTES } from "../../../auth/constants";
import {
  acceptTeamInvitation,
  inspectTeamInvitation,
  TeamInvitationError,
} from "../../api/team-invitations-client";
import type { TeamInvitationPresentation } from "../../contracts/brand-settings.contracts";
import { brandRoleLabel } from "../../utils/brand-settings-display";
import "../../team-invitation.css";

type State =
  | "inspecting"
  | "valid"
  | "expired"
  | "invalid"
  | "consumed"
  | "submitting"
  | "failed"
  | "accepted";
function tokenFromLocation() {
  // New mail uses a fragment. Query is accepted for manually supplied legacy links.
  return (
    new URLSearchParams(window.location.hash.slice(1)).get("token") ??
    new URLSearchParams(window.location.search).get("token") ??
    ""
  );
}

export function TeamInvitationAcceptance() {
  const navigate = useNavigate();
  const [token] = useState(tokenFromLocation);
  const [state, setState] = useState<State>("inspecting");
  const [invitation, setInvitation] =
    useState<TeamInvitationPresentation | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
    if (!token) {
      setState("invalid");
      setMessage("This link does not contain a valid invitation.");
      return;
    }
    void inspectTeamInvitation(token)
      .then((value) => {
        if (active) {
          setInvitation(value);
          setState("valid");
        }
      })
      .catch((error) => {
        if (!active) return;
        setState(
          error instanceof TeamInvitationError &&
            error.code === "INVITATION_EXPIRED"
            ? "expired"
            : error instanceof TeamInvitationError &&
                error.code === "INVITATION_CONSUMED"
              ? "consumed"
              : "invalid",
        );
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not inspect invitation.",
        );
      });
    return () => {
      active = false;
    };
  }, [token]);
  const submit = async () => {
    if (!invitation || state === "submitting") return;
    if (
      invitation.requires_account_bootstrap &&
      (password.length < 8 ||
        password.length > 256 ||
        !password.trim() ||
        password !== confirm)
    ) {
      setMessage(
        "Use a password of 8–256 characters, not only spaces, and matching confirmation.",
      );
      setState("failed");
      return;
    }
    setState("submitting");
    setMessage("");
    try {
      const session = await acceptTeamInvitation(
        token,
        invitation.requires_account_bootstrap ? password : undefined,
      );
      adoptAuthSession(session);
      setState("accepted");
      setPassword("");
      setConfirm("");
      navigate(AUTH_ROUTES.brandDashboard, { replace: true });
    } catch (error) {
      setState(
        error instanceof TeamInvitationError &&
          error.code === "INVITATION_CONSUMED"
          ? "consumed"
          : error instanceof TeamInvitationError &&
              error.code === "INVITATION_EXPIRED"
            ? "expired"
            : "failed",
      );
      setMessage(
        error instanceof Error
          ? error.message
          : "Acceptance failed. Please try again.",
      );
    }
  };
  const canAccept =
    invitation && ["valid", "failed", "submitting"].includes(state);
  return (
    <main className="team-invitation">
      <Card>
        <h1>Join your Brand workspace</h1>
        {state === "inspecting" && <p role="status">Inspecting invitation…</p>}
        {state === "accepted" && (
          <p role="status">Invitation accepted. Opening your workspace…</p>
        )}
        {message && (
          <div role="alert">
            <Alert
              tone="error"
              title={
                state === "expired"
                  ? "Invitation expired"
                  : state === "consumed"
                    ? "Invitation already accepted"
                    : state === "invalid"
                      ? "Invalid invitation"
                      : "Acceptance failed"
              }
            >
              {message}
            </Alert>
          </div>
        )}
        {invitation && (
          <dl>
            <dt>Workspace</dt>
            <dd>{invitation.brand_name}</dd>
            <dt>Email</dt>
            <dd>{invitation.email}</dd>
            <dt>Role</dt>
            <dd>{brandRoleLabel(invitation.role)}</dd>
            <dt>Expires</dt>
            <dd>{new Date(invitation.expires_at).toLocaleString()}</dd>
          </dl>
        )}
        {canAccept && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            {invitation.requires_account_bootstrap ? (
              <>
                <TextField
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={256}
                  required
                  disabled={state === "submitting"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={state === "submitting"}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                />
              </>
            ) : (
              <p>
                Accept using your existing account for {invitation.email}. No
                new password is needed. This will sign you in as that account.
              </p>
            )}
            <Button type="submit" disabled={state === "submitting"}>
              {state === "submitting"
                ? "Accepting invitation…"
                : "Accept invitation"}
            </Button>
          </form>
        )}
        {["expired", "consumed", "invalid"].includes(state) && (
          <p>
            Ask a workspace administrator for a new invitation, or{" "}
            <a href={AUTH_ROUTES.login}>sign in</a> if you already joined.
          </p>
        )}
      </Card>
    </main>
  );
}
