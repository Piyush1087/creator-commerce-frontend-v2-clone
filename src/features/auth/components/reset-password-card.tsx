import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, Card, TextField } from "../../../design-system/aurora";
import { resetPassword } from "../api/auth-client";
import { AUTH_ROUTES } from "../constants";
import "../auth-pages.css";

let pendingFragmentToken: { path: string; token: string } | null = null;

function captureFragmentToken(): string {
  const path = `${window.location.pathname}${window.location.search}`;
  const fragmentToken =
    new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
  if (fragmentToken) {
    pendingFragmentToken = { path, token: fragmentToken };
    window.history.replaceState(window.history.state, "", path);
    return fragmentToken;
  }

  return pendingFragmentToken?.path === path ? pendingFragmentToken.token : "";
}

export function ResetPasswordCard() {
  const navigate = useNavigate();
  const [token] = useState(captureFragmentToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      pendingFragmentToken = null;
    },
    [],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError("This reset link is invalid or incomplete. Request a new link.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("Use a password between 8 and 128 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword: password });
      setPassword("");
      setConfirmPassword("");
      navigate(AUTH_ROUTES.login, {
        replace: true,
        state: { passwordReset: true },
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "This reset link is invalid or expired.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <Card className="auth-card">
        <h1 className="aurora-card__title">Choose a new password</h1>
        <p className="auth-copy">Use 8–128 characters for your new password.</p>
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting || !token}
            required
          />
          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={submitting || !token}
            required
          />
          {!token ? (
            <p className="auth-inline-error" role="alert">
              This reset link is invalid or incomplete. Request a new link.
            </p>
          ) : error ? (
            <p className="auth-inline-error" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={submitting || !token}>
            {submitting ? "Resetting…" : "Reset password"}
          </Button>
        </form>
        <p className="auth-secondary-copy">
          <Link to={AUTH_ROUTES.forgotPassword}>Request a new reset link</Link>
        </p>
      </Card>
    </main>
  );
}
