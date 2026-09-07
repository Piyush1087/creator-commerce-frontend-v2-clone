import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button, Card, TextField } from "../../../design-system/aurora";
import { normalizeUserRole } from "../../../shared/auth/user-role";
import { useAuthSession } from "../../../shared/auth/use-auth-session";
import {
  loginWithPassword,
  requestLoginOtp,
  signInWithGoogle,
  verifyLoginOtp,
} from "../api/auth-client";
import { AUTH_ROUTES } from "../constants";
import { resolvePostLoginPath } from "../post-login-redirect";
import { GoogleSignInButton } from "./google-sign-in-button";
import "../auth-pages.css";

type LoginMethod = "password" | "email-code";
type CodeStage = "request" | "verify";

function locationState(value: unknown): {
  accountSecurity?: "PASSWORD_CHANGED" | "SIGNED_OUT_ALL";
  email?: string;
  from?: string;
  passwordReset?: boolean;
} {
  return value && typeof value === "object" ? value : {};
}

export function SignInCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useAuthSession();
  const state = locationState(location.state);
  const [method, setMethod] = useState<LoginMethod>("password");
  const [codeStage, setCodeStage] = useState<CodeStage>("request");
  const [email, setEmail] = useState(state.email ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(
    state.passwordReset
      ? "Your password was reset. Sign in with your new password."
      : state.accountSecurity === "PASSWORD_CHANGED"
        ? "Your password was changed. Sign in again on this device."
        : state.accountSecurity === "SIGNED_OUT_ALL"
          ? "You have been signed out of Creator Shop on all devices."
          : null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const destination = useCallback(
    (role: string) => resolvePostLoginPath(normalizeUserRole(role), state.from),
    [state.from],
  );

  useEffect(() => {
    if (session.status === "AUTHENTICATED" && session.currentUser) {
      navigate(destination(session.currentUser.role), { replace: true });
    }
  }, [destination, navigate, session.currentUser, session.status]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(
      () => setResendSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const chooseMethod = (next: LoginMethod) => {
    setMethod(next);
    setCodeStage("request");
    setCode("");
    setError(null);
    setStatus(null);
  };

  const handleMethodKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const next: LoginMethod =
      event.key === "ArrowLeft" || event.key === "Home"
        ? "password"
        : "email-code";
    chooseMethod(next);
    document.getElementById(`sign-in-method-${next}`)?.focus();
  };

  const sendCode = async () => {
    await requestLoginOtp(email.trim());
    setCodeStage("verify");
    setResendSeconds(60);
    setStatus(
      "If an eligible account exists, a verification code has been sent.",
    );
    window.setTimeout(() => document.getElementById("login-code")?.focus(), 0);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      if (method === "password") {
        const result = await loginWithPassword({
          email: email.trim(),
          password,
        });
        navigate(destination(result.user.role), { replace: true });
      } else if (codeStage === "request") {
        await sendCode();
      } else {
        const normalizedCode = code.replace(/\D/g, "").slice(0, 6);
        if (normalizedCode.length !== 6) {
          setError("Enter the 6-digit verification code.");
          return;
        }
        const result = await verifyLoginOtp({
          email: email.trim(),
          code: normalizedCode,
        });
        navigate(destination(result.user.role), { replace: true });
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Sign in failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (resendSeconds > 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await sendCode();
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "A new code could not be requested.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const googleCredential = useCallback(
    (idToken: string) => {
      setSubmitting(true);
      setError(null);
      void signInWithGoogle({ idToken })
        .then((result) =>
          navigate(destination(result.user.role), { replace: true }),
        )
        .catch((googleError: unknown) => {
          setError(
            googleError instanceof Error
              ? googleError.message
              : "Google Sign-In failed.",
          );
        })
        .finally(() => setSubmitting(false));
    },
    [destination, navigate],
  );

  const checkingSession =
    session.status === "INITIALIZING" || session.status === "REFRESHING";

  return (
    <main className="auth-page">
      <Card className="auth-card">
        <h1 className="aurora-card__title">Sign in</h1>
        <p className="auth-copy">
          Access your Creator Shop workspace securely.
        </p>

        <div
          className="auth-methods"
          role="tablist"
          aria-label="Sign-in method"
        >
          <Button
            id="sign-in-method-password"
            type="button"
            role="tab"
            aria-selected={method === "password"}
            aria-controls="sign-in-method-panel"
            tabIndex={method === "password" ? 0 : -1}
            variant={method === "password" ? "primary" : "outline"}
            onClick={() => chooseMethod("password")}
            onKeyDown={handleMethodKeyDown}
          >
            Password
          </Button>
          <Button
            id="sign-in-method-email-code"
            type="button"
            role="tab"
            aria-selected={method === "email-code"}
            aria-controls="sign-in-method-panel"
            tabIndex={method === "email-code" ? 0 : -1}
            variant={method === "email-code" ? "primary" : "outline"}
            onClick={() => chooseMethod("email-code")}
            onKeyDown={handleMethodKeyDown}
          >
            Email code
          </Button>
        </div>

        <form
          id="sign-in-method-panel"
          className="auth-form"
          role="tabpanel"
          aria-label={
            method === "password"
              ? "Password sign-in form"
              : "Email code sign-in form"
          }
          onSubmit={(event) => void submit(event)}
        >
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={
              submitting || (method === "email-code" && codeStage === "verify")
            }
            required
          />
          {method === "password" ? (
            <>
              <TextField
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
                required
              />
              <Link
                className="auth-forgot-link"
                to={AUTH_ROUTES.forgotPassword}
              >
                Forgot password?
              </Link>
            </>
          ) : codeStage === "verify" ? (
            <>
              <TextField
                id="login-code"
                label="6-digit code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                disabled={submitting}
                required
              />
              <Button
                type="button"
                variant="ghost"
                disabled={submitting || resendSeconds > 0}
                onClick={() => void resend()}
              >
                {resendSeconds > 0
                  ? `Resend in ${resendSeconds}s`
                  : "Resend code"}
              </Button>
            </>
          ) : null}

          <div aria-live="polite">
            {status ? <p className="auth-inline-status">{status}</p> : null}
          </div>
          {error ? (
            <p className="auth-inline-error" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={submitting || checkingSession}>
            {submitting
              ? "Please wait…"
              : method === "password"
                ? "Sign in"
                : codeStage === "request"
                  ? "Send code"
                  : "Verify and sign in"}
          </Button>
        </form>

        <div className="auth-divider" aria-hidden>
          <span>or</span>
        </div>
        <GoogleSignInButton
          disabled={submitting}
          onCredential={googleCredential}
        />

        <p className="auth-secondary-copy">
          New brand? <Link to="/">Start onboarding</Link>
        </p>
      </Card>
    </main>
  );
}
