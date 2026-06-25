import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button, Card, TextField } from "../../design-system/aurora";
import { login } from "../../features/auth/api/auth-client";
import { AUTH_ROUTES } from "../../features/auth/constants";
import { resolvePostLoginPath } from "../../features/auth/post-login-redirect";
import { STUB_OTP_CODE } from "../../features/brand-onboarding/verification-otp.config";
import { normalizeUserRole } from "../../shared/auth/user-role";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof (location.state as { from?: unknown }).from === "string"
      ? (location.state as { from: string }).from
      : undefined;
  const prefilledEmail =
    typeof location.state === "object" &&
    location.state !== null &&
    "email" in location.state &&
    typeof (location.state as { email?: unknown }).email === "string"
      ? (location.state as { email: string }).email
      : "";
  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const code = otp.replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login({ email: email.trim(), otp: code });
      const role = normalizeUserRole(result.user.role);
      navigate(resolvePostLoginPath(role, returnPath), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="bob-landing"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <Card className="bob-auth-card">
        <h1 className="aurora-card__title" style={{ marginBottom: 8 }}>
          Sign in
        </h1>
        <p className="bob-muted" style={{ marginBottom: 24 }}>
          Use your brand work email or creator test account{" "}
          <strong>test@creator.com</strong> with code <strong>{STUB_OTP_CODE}</strong>.
        </p>
        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Verification code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder={STUB_OTP_CODE}
            required
            maxLength={6}
          />
          {error ? (
            <p
              role="alert"
              style={{ color: "var(--color-danger)", fontSize: 14, margin: 0 }}
            >
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={isSubmitting} style={{ width: "100%" }}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="bob-muted" style={{ marginTop: 24, marginBottom: 0, fontSize: 14 }}>
          New brand?{" "}
          <Link to="/" className="bob-link">
            Start onboarding
          </Link>
        </p>
      </Card>
    </div>
  );
}
