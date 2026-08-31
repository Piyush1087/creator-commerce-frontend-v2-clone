import { useState } from "react";
import { Link } from "react-router-dom";

import { Button, Card, TextField } from "../../../design-system/aurora";
import { forgotPassword } from "../api/auth-client";
import { AUTH_ROUTES } from "../constants";
import "../auth-pages.css";

const GENERIC_SUCCESS =
  "If an eligible account exists, a password reset link will be sent.";

export function ForgotPasswordCard() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setMessage(GENERIC_SUCCESS);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The request could not be completed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <Card className="auth-card">
        <h1 className="aurora-card__title">Reset your password</h1>
        <p className="auth-copy">
          Enter your account email and we’ll send reset instructions when
          eligible.
        </p>
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
            required
          />
          {message ? (
            <p className="auth-inline-status" role="status">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="auth-inline-error" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        <p className="auth-secondary-copy">
          <Link to={AUTH_ROUTES.login}>Back to sign in</Link>
        </p>
      </Card>
    </main>
  );
}
