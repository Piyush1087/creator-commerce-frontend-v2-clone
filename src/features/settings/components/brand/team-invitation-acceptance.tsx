import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Button,
  Card,
  TextField,
} from "../../../../design-system/aurora";
import { adoptAuthSession } from "../../../../shared/auth/auth-session";
import { useAuthSession } from "../../../../shared/auth/use-auth-session";
import { logoutCurrentSession } from "../../../auth/api/auth-client";
import { GoogleSignInButton } from "../../../auth/components/google-sign-in-button";
import { AUTH_ROUTES } from "../../../auth/constants";
import {
  acceptTeamInvitation,
  inspectTeamInvitation,
  requestTeamInvitationOtp,
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
type ProofMethod = "password" | "email-code" | "google";
type InvitationProof = {
  password?: string;
  otpCode?: string;
  googleIdToken?: string;
};

function tokenFromLocation() {
  // New mail uses a fragment. Query is accepted for manually supplied legacy links.
  return (
    new URLSearchParams(window.location.hash.slice(1)).get("token") ??
    new URLSearchParams(window.location.search).get("token") ??
    ""
  );
}

function scrubInvitationToken() {
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.delete("token");
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}`,
  );
}

function terminalState(error: unknown): State | null {
  if (!(error instanceof TeamInvitationError)) return null;
  if (error.code === "INVITATION_EXPIRED") return "expired";
  if (error.code === "INVITATION_CONSUMED") return "consumed";
  if (error.code === "INVITATION_INVALID") return "invalid";
  return null;
}

export function TeamInvitationAcceptance() {
  const navigate = useNavigate();
  const auth = useAuthSession();
  const [token] = useState(tokenFromLocation);
  const [state, setState] = useState<State>("inspecting");
  const [invitation, setInvitation] =
    useState<TeamInvitationPresentation | null>(null);
  const [method, setMethod] = useState<ProofMethod>("email-code");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    scrubInvitationToken();
    if (!token) {
      setState("invalid");
      setMessage("This link does not contain a valid invitation.");
      return;
    }
    void inspectTeamInvitation(token)
      .then((value) => {
        if (active) {
          setInvitation(value);
          setMethod(
            value.requires_account_bootstrap ? "password" : "email-code",
          );
          setState("valid");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState(terminalState(error) ?? "invalid");
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

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const accept = useCallback(
    async (proof: InvitationProof = {}) => {
      if (!invitation || state === "submitting") return;
      setState("submitting");
      setMessage("");
      try {
        const session = await acceptTeamInvitation(token, proof);
        adoptAuthSession(session);
        setState("accepted");
        setPassword("");
        setConfirm("");
        setOtpCode("");
        navigate(AUTH_ROUTES.brandDashboard, { replace: true });
      } catch (error) {
        setState(terminalState(error) ?? "failed");
        setMessage(
          error instanceof Error
            ? error.message
            : "Acceptance failed. Please try again.",
        );
      }
    },
    [invitation, navigate, state, token],
  );

  const requestOtp = async () => {
    if (!invitation || state === "submitting" || resendSeconds > 0) return;
    setState("submitting");
    setMessage("");
    try {
      await requestTeamInvitationOtp(token);
      setOtpRequested(true);
      setResendSeconds(60);
      setState("valid");
    } catch (error) {
      setState(terminalState(error) ?? "failed");
      setMessage(
        error instanceof Error
          ? error.message
          : "The invitation code could not be sent.",
      );
    }
  };

  const signOutAndContinue = async () => {
    if (state === "submitting") return;
    setState("submitting");
    setMessage("");
    try {
      await logoutCurrentSession();
      setState("valid");
    } catch (error) {
      setState("failed");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not sign out of the current account.",
      );
    }
  };

  const invitedEmail = invitation?.email.trim().toLowerCase() ?? "";
  const currentEmail = auth.currentUser?.email.trim().toLowerCase() ?? "";
  const authenticated = auth.status === "AUTHENTICATED" && !!auth.currentUser;
  const exactAuthenticatedUser = authenticated && currentEmail === invitedEmail;
  const differentAuthenticatedUser =
    authenticated && currentEmail !== invitedEmail;
  const sessionPending =
    auth.status === "INITIALIZING" || auth.status === "REFRESHING";
  const canInteract = state === "valid" || state === "failed";

  const submitProof = () => {
    if (method === "password") {
      if (password.length < 8 || password.length > 128 || !password.trim()) {
        setMessage("Use a password between 8 and 128 characters.");
        setState("failed");
        return;
      }
      if (password !== confirm) {
        setMessage("The passwords do not match.");
        setState("failed");
        return;
      }
      void accept({ password });
      return;
    }
    if (method === "email-code") {
      if (!/^\d{6}$/.test(otpCode)) {
        setMessage("Enter the 6-digit invitation code.");
        setState("failed");
        return;
      }
      void accept({ otpCode });
    }
  };

  return (
    <main className="team-invitation">
      <Card>
        <h1>Join your Brand workspace</h1>
        {state === "inspecting" ? (
          <p role="status">Inspecting invitation…</p>
        ) : null}
        {state === "accepted" ? (
          <p role="status">Invitation accepted. Opening your workspace…</p>
        ) : null}
        {message ? (
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
            <dd>{invitation.brand_name}</dd>
            <dt>Email</dt>
            <dd>{invitation.email}</dd>
            <dt>Role</dt>
            <dd>{brandRoleLabel(invitation.role)}</dd>
            <dt>Expires</dt>
            <dd>{new Date(invitation.expires_at).toLocaleString()}</dd>
          </dl>
        ) : null}

        {invitation && canInteract && sessionPending ? (
          <p role="status">Checking your current account…</p>
        ) : null}

        {invitation && canInteract && differentAuthenticatedUser ? (
          <div className="team-invitation__account-warning">
            <Alert tone="warning" title="Use the invited account">
              You’re currently signed in as {auth.currentUser?.email}. This
              invitation is for {invitation.email}.
            </Alert>
            <Button type="button" onClick={() => void signOutAndContinue()}>
              Sign out and continue
            </Button>
          </div>
        ) : null}

        {invitation && canInteract && exactAuthenticatedUser ? (
          <div className="team-invitation__direct-accept">
            <p>
              Continue as {auth.currentUser?.email} to accept this workspace
              invitation.
            </p>
            <Button type="button" onClick={() => void accept()}>
              Accept invitation
            </Button>
          </div>
        ) : null}

        {invitation && canInteract && auth.status === "UNAUTHENTICATED" ? (
          <section aria-labelledby="invitation-proof-title">
            <h2 id="invitation-proof-title">
              {invitation.requires_account_bootstrap
                ? "Create your account"
                : "Verify your invited identity"}
            </h2>
            <div
              className="team-invitation__method-tabs"
              role="group"
              aria-label="Acceptance method"
            >
              {invitation.requires_account_bootstrap ? (
                <Button
                  type="button"
                  variant={method === "password" ? "primary" : "outline"}
                  aria-pressed={method === "password"}
                  onClick={() => {
                    setMethod("password");
                    setMessage("");
                  }}
                >
                  Password
                </Button>
              ) : null}
              <Button
                type="button"
                variant={method === "email-code" ? "primary" : "outline"}
                aria-pressed={method === "email-code"}
                onClick={() => {
                  setMethod("email-code");
                  setMessage("");
                }}
              >
                Email code
              </Button>
              <Button
                type="button"
                variant={method === "google" ? "primary" : "outline"}
                aria-pressed={method === "google"}
                onClick={() => {
                  setMethod("google");
                  setMessage("");
                }}
              >
                Google
              </Button>
            </div>

            {method === "password" ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitProof();
                }}
              >
                <TextField
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                />
                <Button type="submit">Accept invitation</Button>
              </form>
            ) : null}

            {method === "email-code" ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (otpRequested) submitProof();
                  else void requestOtp();
                }}
              >
                <p>
                  Send a purpose-bound invitation code to {invitation.email}.
                </p>
                {otpRequested ? (
                  <TextField
                    label="6-digit invitation code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(event) =>
                      setOtpCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                  />
                ) : null}
                <div className="team-invitation__otp-actions">
                  <Button type="submit">
                    {otpRequested ? "Accept invitation" : "Send email code"}
                  </Button>
                  {otpRequested ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={resendSeconds > 0}
                      onClick={() => void requestOtp()}
                    >
                      {resendSeconds > 0
                        ? `Resend in ${resendSeconds}s`
                        : "Resend code"}
                    </Button>
                  ) : null}
                </div>
              </form>
            ) : null}

            {method === "google" ? (
              <div className="team-invitation__google">
                <p>
                  Continue with the Google account for {invitation.email}. The
                  server verifies the exact invited email.
                </p>
                <GoogleSignInButton
                  context={
                    invitation.requires_account_bootstrap ? "signup" : "use"
                  }
                  onCredential={(googleIdToken) =>
                    void accept({ googleIdToken })
                  }
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {state === "submitting" ? (
          <p role="status">Completing invitation action…</p>
        ) : null}
        {["expired", "consumed", "invalid"].includes(state) ? (
          <p>
            Ask a workspace administrator for a new invitation, or{" "}
            <a href={AUTH_ROUTES.login}>sign in</a> if you already joined.
          </p>
        ) : null}
      </Card>
    </main>
  );
}
