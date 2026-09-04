import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alert, Button, Card, TextField } from "../../../design-system/aurora";
import { GoogleSignInButton } from "../../auth/components/google-sign-in-button";
import { AUTH_ROUTES } from "../../auth/constants";
import { PUBLIC_ROUTES } from "../../auth/constants";
import { logoutCurrentSession } from "../../auth/api/auth-client";
import { isApiRequestError } from "../../../shared/api/parse-api-error";
import { useAuthSession } from "../../../shared/auth/use-auth-session";
import {
  authorizeCreatorInstagram,
  authorizeCreatorInstagramReconnect,
  discardCampaignApplyContinuation,
  fetchCampaignApplyContinuationStatus,
  fetchCreatorEntryState,
  registerCreatorGoogle,
  registerCreatorPassword,
  requestCreatorRegistrationOtp,
  resolveCampaignApplyContinuation,
  revalidateCreatorInstagram,
  verifyCreatorRegistrationOtp,
} from "../api/creator-entry-client";
import type { CreatorEntryState } from "../contracts/creator-entry.contracts";
import { saveCreatorInstagramFlowMode } from "../utils/creator-entry-oauth-session";
import "../creator-onboarding.css";

type EntryError = { title: string; message: string; code?: string };

function describeError(error: unknown): EntryError {
  const code = isApiRequestError(error) ? error.code : undefined;
  const known: Record<string, EntryError> = {
    ACCOUNT_EXISTS_SIGN_IN_REQUIRED: {
      title: "Account already exists",
      message: "An account already exists. Sign in to continue.",
      code,
    },
    ACCOUNT_CONTEXT_CONFLICT: {
      title: "Brand account cannot enter Creator setup",
      message:
        "This account already belongs to a Brand workspace. Sign out and use a different account to create a Creator workspace.",
      code,
    },
    CREATOR_CONTEXT_RECOVERY_REQUIRED: {
      title: "Creator account needs recovery",
      message:
        "We could not safely restore your Creator workspace context. Please retry or contact support.",
      code,
    },
    INSTAGRAM_PROFESSIONAL_ACCOUNT_REQUIRED: {
      title: "Professional Instagram account required",
      message:
        "Change the Instagram account to a Professional account, then try connecting again.",
      code,
    },
    INSTAGRAM_AUTHORIZATION_DENIED: {
      title: "Instagram authorization was not completed",
      message: "Nothing was connected. You can try again when you are ready.",
      code,
    },
    INSTAGRAM_PROVIDER_RETRY_REQUIRED: {
      title: "Instagram is temporarily unavailable",
      message:
        "The provider could not complete this request. Please try again.",
      code,
    },
    PROVIDER_ACCESS_BLOCKED: {
      title: "Instagram access is blocked",
      message:
        "Instagram access must be restored before this Creator workspace can be used.",
      code,
    },
    CREATOR_ENTRY_CONTINUATION_EXPIRED: {
      title: "Campaign setup link expired",
      message:
        "This campaign setup link expired. Return to the campaign and choose Apply again.",
      code,
    },
    CREATOR_ENTRY_CONTINUATION_NOT_FOUND: {
      title: "Campaign setup link is unavailable",
      message: "Return to Marketplace or the campaign and choose Apply again.",
      code,
    },
    CREATOR_ENTRY_CONTINUATION_IDENTITY_CONFLICT: {
      title: "Different signed-in account",
      message: "This campaign setup belongs to a different signed-in account.",
      code,
    },
  };
  return (
    (code && known[code]) || {
      title: "Creator setup could not continue",
      message: error instanceof Error ? error.message : "Please try again.",
      code,
    }
  );
}

export function CreatorEntryView() {
  const session = useAuthSession();
  const navigate = useNavigate();
  const [entryState, setEntryState] = useState<CreatorEntryState | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verification, setVerification] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<EntryError | null>(null);
  const [continuationPresent, setContinuationPresent] = useState<
    boolean | null
  >(null);

  const evaluate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [state, continuationStatus] = await Promise.all([
        fetchCreatorEntryState(),
        fetchCampaignApplyContinuationStatus(),
      ]);
      setEntryState(state);
      setContinuationPresent(continuationStatus.present);
      if (continuationStatus.present) {
        try {
          const resolution = await resolveCampaignApplyContinuation();
          if (resolution.status === "READY_TO_RETURN") {
            navigate(
              `/creator/marketplace/${encodeURIComponent(resolution.campaign.campaignId)}`,
              { replace: true },
            );
            return;
          }
          setEntryState({ ...state, nextAction: resolution.nextAction });
        } catch (resolutionError) {
          const described = describeError(resolutionError);
          if (
            described.code === "CREATOR_ENTRY_CONTINUATION_EXPIRED" ||
            described.code === "CREATOR_ENTRY_CONTINUATION_NOT_FOUND"
          ) {
            setContinuationPresent(false);
          }
          setError(described);
          return;
        }
      }
      if (state.canEnterCreatorPlatform && !continuationStatus.present) {
        navigate(AUTH_ROUTES.creatorHome, { replace: true });
      }
    } catch (stateError) {
      setError(describeError(stateError));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (session.status === "AUTHENTICATED") {
      void evaluate();
      return;
    }
    if (session.status === "UNAUTHENTICATED") {
      let active = true;
      void fetchCampaignApplyContinuationStatus()
        .then(({ present }) => {
          if (active) setContinuationPresent(present);
        })
        .catch(() => {
          if (active) setContinuationPresent(false);
        });
      return () => {
        active = false;
      };
    }
  }, [evaluate, session.status]);

  const discardContinuation = async () => {
    setBusy(true);
    setError(null);
    try {
      await discardCampaignApplyContinuation();
      setContinuationPresent(false);
    } catch (discardError) {
      setError(describeError(discardError));
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await registerCreatorPassword({ email: email.trim(), password });
      setVerification(true);
    } catch (requestError) {
      setError(describeError(requestError));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyCreatorRegistrationOtp({
        email: email.trim(),
        code: code.trim(),
      });
    } catch (requestError) {
      setError(describeError(requestError));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError(null);
    try {
      await requestCreatorRegistrationOtp(email.trim());
    } catch (requestError) {
      setError(describeError(requestError));
    } finally {
      setBusy(false);
    }
  };

  const google = useCallback(async (idToken: string) => {
    setBusy(true);
    setError(null);
    try {
      await registerCreatorGoogle(idToken);
    } catch (requestError) {
      setError(describeError(requestError));
    } finally {
      setBusy(false);
    }
  }, []);

  const providerAction = async (mode: "INITIAL_CONNECT" | "RECONNECT") => {
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === "INITIAL_CONNECT"
          ? await authorizeCreatorInstagram()
          : await authorizeCreatorInstagramReconnect();
      saveCreatorInstagramFlowMode(mode);
      window.location.assign(result.authorizationUrl);
    } catch (requestError) {
      setError(describeError(requestError));
      setBusy(false);
    }
  };

  const revalidate = async () => {
    setBusy(true);
    setError(null);
    try {
      await revalidateCreatorInstagram();
      await evaluate();
    } catch (requestError) {
      setError(describeError(requestError));
    } finally {
      setBusy(false);
    }
  };

  if (session.status === "INITIALIZING" || session.status === "REFRESHING") {
    return <EntryStatus>Restoring your secure session…</EntryStatus>;
  }

  if (session.status === "UNAUTHENTICATED") {
    return (
      <div className="cob-page cob-entry-layout">
        <section className="cob-entry-intro">
          <span className="cob-badge">Creator Entry</span>
          <h1>Create your Creator account</h1>
          <p>
            {continuationPresent
              ? "Create or sign in to your Creator account. After Instagram setup, we’ll return you to the campaign."
              : "Create or sign in, connect your professional Instagram account, and enter Creator Shop."}
          </p>
          <ol>
            <li>Create or sign in</li>
            <li>Connect professional Instagram</li>
            <li>Enter Creator Shop</li>
          </ol>
        </section>
        <Card className="cob-entry-card">
          {error ? (
            <div role="alert">
              <Alert tone="error" title={error.title}>
                {error.message}
              </Alert>
            </div>
          ) : null}
          {verification ? (
            <form className="cob-form-stack" onSubmit={verify} aria-busy={busy}>
              <h2>Verify your email</h2>
              <p className="cob-muted">
                Enter the verification code sent to {email}.
              </p>
              <TextField
                label="Verification code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="one-time-code"
                required
              />
              <Button type="submit" disabled={busy} fullWidthOnMobile>
                Verify and continue
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void resend()}
                fullWidthOnMobile
              >
                Resend code
              </Button>
            </form>
          ) : (
            <>
              <form
                className="cob-form-stack"
                onSubmit={submitPassword}
                aria-busy={busy}
              >
                <h2>Create account</h2>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <Button type="submit" disabled={busy} fullWidthOnMobile>
                  Create Creator account
                </Button>
              </form>
              <div className="cob-divider">or</div>
              <GoogleSignInButton
                context="signup"
                disabled={busy}
                onCredential={(token) => void google(token)}
              />
              <p className="cob-entry-signin">
                Already have an account?{" "}
                <Link
                  to={AUTH_ROUTES.login}
                  state={{ from: "/creator/onboarding" }}
                >
                  Sign in
                </Link>
              </p>
              {continuationPresent ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void discardContinuation()}
                >
                  Discard campaign setup
                </Button>
              ) : null}
            </>
          )}
        </Card>
      </div>
    );
  }

  if (loading)
    return <EntryStatus>Reading your Creator Entry state…</EntryStatus>;
  if (!entryState) {
    return (
      <div className="cob-page cob-connect-layout">
        <Card className="cob-modal-panel cob-connect-card">
          <div role="alert">
            <Alert
              tone="error"
              title={error?.title ?? "Creator setup could not continue"}
            >
              {error?.message ?? "Please try again."}
            </Alert>
          </div>
          <div className="cob-connect-actions">
            <Button onClick={() => void evaluate()}>Try again</Button>
          </div>
        </Card>
      </div>
    );
  }

  const contextConflict =
    entryState.accountContext === "ACCOUNT_CONTEXT_CONFLICT";
  const contextRecovery =
    entryState.accountContext === "CONTEXT_RECOVERY_REQUIRED";
  const continuationFailure =
    error?.code?.startsWith("CREATOR_ENTRY_CONTINUATION_") ?? false;
  const action = entryState.nextAction;
  return (
    <div className="cob-page cob-connect-layout">
      <Card className="cob-modal-panel cob-connect-card">
        <span className="cob-badge">Creator Entry</span>
        {error ? (
          <div className="cob-connect-alert" role="alert">
            <Alert tone="error" title={error.title}>
              {error.message}
            </Alert>
          </div>
        ) : null}
        {continuationFailure ? (
          <div className="cob-connect-actions">
            {error?.code === "CREATOR_ENTRY_CONTINUATION_IDENTITY_CONFLICT" ? (
              <Button
                onClick={() =>
                  void logoutCurrentSession().then(() =>
                    navigate(AUTH_ROUTES.login, {
                      replace: true,
                      state: { from: "/creator/onboarding" },
                    }),
                  )
                }
              >
                Sign out and use the correct account
              </Button>
            ) : (
              <Button onClick={() => navigate(PUBLIC_ROUTES.marketplace)}>
                Return to Marketplace
              </Button>
            )}
          </div>
        ) : null}
        {!continuationFailure && contextConflict ? (
          <>
            <h1 className="cob-connect-title">
              Brand account cannot enter Creator setup
            </h1>
            <p className="cob-muted">
              This account already belongs to a Brand workspace. Sign out and
              use a different account to create a Creator workspace.
            </p>
            <div className="cob-connect-actions">
              <Button
                onClick={() =>
                  void logoutCurrentSession().then(() =>
                    navigate(AUTH_ROUTES.login, {
                      replace: true,
                      state: { from: "/creator/onboarding" },
                    }),
                  )
                }
              >
                Sign out and use another account
              </Button>
            </div>
          </>
        ) : null}
        {!continuationFailure && contextRecovery ? (
          <>
            <h1 className="cob-connect-title">
              Creator account recovery required
            </h1>
            <p className="cob-muted">
              We could not safely restore the Creator workspace context. No
              changes have been made.
            </p>
            <div className="cob-connect-actions">
              <Button onClick={() => void evaluate()}>
                Retry secure recovery
              </Button>
            </div>
          </>
        ) : null}
        {!continuationFailure && !contextConflict && !contextRecovery ? (
          <>
            <h1 className="cob-connect-title">
              Connect your professional Instagram
            </h1>
            <p className="cob-muted">
              Instagram verifies your Creator identity. Creator Shop access
              becomes available only when the backend confirms the connection is
              usable.
            </p>
            <div className="cob-trust-grid">
              <div className="cob-trust-item">
                <strong>Identity connection</strong>
                <span>{entryState.instagram.identityConnection}</span>
              </div>
              <div className="cob-trust-item">
                <strong>Authorization health</strong>
                <span>{entryState.instagram.authorizationHealth}</span>
              </div>
              <div className="cob-trust-item">
                <strong>Insights capability</strong>
                <span>
                  {entryState.instagram.insightsCapability} (not an entry gate)
                </span>
              </div>
            </div>
            <div className="cob-connect-actions">
              {action === "CONNECT_INSTAGRAM" ? (
                <Button
                  disabled={busy}
                  onClick={() => void providerAction("INITIAL_CONNECT")}
                >
                  Connect Instagram
                </Button>
              ) : null}
              {action === "RECONNECT_INSTAGRAM" ? (
                <Button
                  disabled={busy}
                  onClick={() => void providerAction("RECONNECT")}
                >
                  Reconnect Instagram
                </Button>
              ) : null}
              {action === "REVALIDATE_INSTAGRAM" ? (
                <Button disabled={busy} onClick={() => void revalidate()}>
                  Check Instagram connection again
                </Button>
              ) : null}
              {action === "RESOLVE_ACCOUNT_CONTEXT" ||
              action === "RECOVER_CREATOR_CONTEXT" ? (
                <Button disabled={busy} onClick={() => void evaluate()}>
                  Retry account recovery
                </Button>
              ) : null}
              {busy ? (
                <p role="status" aria-live="polite">
                  Processing securely…
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </Card>
    </div>
  );
}

function EntryStatus({ children }: { children: React.ReactNode }) {
  return (
    <div className="cob-page cob-connect-layout" aria-busy="true">
      <Card className="cob-modal-panel cob-connect-card">
        <p role="status" aria-live="polite">
          {children}
        </p>
      </Card>
    </div>
  );
}
