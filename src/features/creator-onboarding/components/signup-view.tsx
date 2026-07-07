import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, Button, TextField } from "../../../design-system/aurora";
import { STUB_OTP_CODE } from "../../brand-onboarding/verification-otp.config";
import {
  fetchOnboardingTrack,
  isApiRequestError,
  signupCreatorAccount,
  verifyCreatorSignupOtp,
} from "../api/creator-onboarding-client";
import { CREATOR_ONBOARDING_ROUTES } from "../constants";
import { SIGNUP_WORKSPACE_WIDGETS } from "../mock-data/onboarding-mock";
import {
  getOnboardingEmail,
  getOnboardingTrackId,
  saveOnboardingEmail,
} from "../utils/onboarding-session";
import { displayValue } from "../../creator-campaigns/utils/display-value";

import "../creator-onboarding.css";

type SignupStep = "credentials" | "otp";

function validateCredentials(email: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Enter a password.";
  } else if (password.length < 6) {
    errors.password = "Use at least 6 characters.";
  }

  return errors;
}

function validateOtp(otp: string): Record<string, string> {
  const code = otp.replace(/\D/g, "");
  if (code.length !== 6) {
    return { otpCode: "Enter the 6-digit verification code." };
  }
  return {};
}

const POST_SIGNUP_STATUSES = new Set([
  "OTP_VERIFIED",
  "META_OAUTH_SUCCESS",
  "AI_ENGINE_SYNCED",
]);

export function CreatorSignupView() {
  const navigate = useNavigate();
  const [step, setStep] = useState<SignupStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resuming, setResuming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const trackId = getOnboardingTrackId();
    if (!trackId) {
      setResuming(false);
      return;
    }

    const savedEmail = getOnboardingEmail();
    if (savedEmail) {
      setEmail(savedEmail);
    }

    void fetchOnboardingTrack(trackId)
      .then((track) => {
        if (POST_SIGNUP_STATUSES.has(track.status)) {
          navigate(CREATOR_ONBOARDING_ROUTES.connect, { replace: true });
          return;
        }
        if (track.status === "ACCOUNT_CREATED") {
          setStep("otp");
        }
      })
      .catch(() => {
        // Track lookup failed — user can still submit credentials.
      })
      .finally(() => {
        setResuming(false);
      });
  }, [navigate]);

  const onSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    const trackId = getOnboardingTrackId();
    if (!trackId) {
      navigate(CREATOR_ONBOARDING_ROUTES.landing);
      return;
    }

    const clientErrors = validateCredentials(email, password);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setError(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const result = await signupCreatorAccount({
        onboardingTrackId: trackId,
        email: email.trim(),
        password,
      });

      saveOnboardingEmail(result.email);
      setEmail(result.email);
      setStep("otp");
      setError(null);
    } catch (err) {
      if (isApiRequestError(err)) {
        setFieldErrors(err.fieldErrors);
        setError(
          err.fieldErrors.email ?? err.fieldErrors.password ?? err.formError ?? err.message,
        );
      } else {
        setError(err instanceof Error ? err.message : "Signup failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const clientErrors = validateOtp(otp);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setError(null);
      return;
    }

    const code = otp.replace(/\D/g, "").slice(0, 6);

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      await verifyCreatorSignupOtp(email.trim(), code);
      navigate(CREATOR_ONBOARDING_ROUTES.connect);
    } catch (err) {
      if (isApiRequestError(err)) {
        setFieldErrors(err.fieldErrors);
        setError(err.fieldErrors.otpCode ?? err.formError ?? err.message);
      } else {
        setError(err instanceof Error ? err.message : "Verification failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onBackToCredentials = () => {
    setStep("credentials");
    setOtp("");
    setError(null);
    setFieldErrors({});
  };

  if (resuming) {
    return (
      <div className="cob-split">
        <section className="cob-split__form">
          <p className="cob-muted">Loading your signup session…</p>
        </section>
      </div>
    );
  }

  return (
    <div className="cob-split">
      <section className="cob-split__preview">
        <span className="cob-badge">Your Creator Workspace</span>
        <h1 style={{ fontFamily: "var(--font-heading)", margin: "0 0 8px" }}>
          Your workspace is almost ready.
        </h1>
        <p className="cob-muted">
          Complete credentials to unlock the staged modules you selected.
        </p>
        <div className="cob-widget-list">
          {SIGNUP_WORKSPACE_WIDGETS.map((widget) => (
            <div key={widget.label} className="cob-widget">
              <strong>{widget.label}</strong>
              <span
                className={
                  widget.tone === "success"
                    ? "cob-widget__status--success"
                    : "cob-widget__status--pending"
                }
              >
                {widget.status}
              </span>
            </div>
          ))}
        </div>
        <p className="cob-muted">
          Founding badge: {displayValue("-")} · Estimated setup: Less than 60 seconds
        </p>
      </section>

      <section className="cob-split__form">
        {step === "credentials" ? (
          <>
            <h2 style={{ fontFamily: "var(--font-heading)", margin: "0 0 8px" }}>
              Secure your workspace allocation
            </h2>
            <p className="cob-muted" style={{ marginBottom: 24 }}>
              Establish administrator credentials to initialize your staged modules.
            </p>

            <form
              className="cob-form-stack"
              noValidate
              onSubmit={(e) => void onSubmitCredentials(e)}
            >
              <TextField
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                error={fieldErrors.email}
              />

              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                helperText={fieldErrors.password ? undefined : "Use at least 6 characters."}
                error={fieldErrors.password}
              />

              {error && !fieldErrors.email && !fieldErrors.password ? (
                <Alert tone="error" title="Signup">
                  {error}
                </Alert>
              ) : null}

              <div className="cob-form-actions">
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? "Creating Workspace…" : "Create My Free Account"}
                </Button>
              </div>
            </form>

            <div className="cob-divider">or</div>

            <Button variant="outline" disabled style={{ width: "100%" }}>
              Continue with Google ({displayValue("-")} — SDK not wired)
            </Button>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "var(--font-heading)", margin: "0 0 8px" }}>
              Verify your email
            </h2>
            <p className="cob-muted" style={{ marginBottom: 24 }}>
              Enter the 6-digit code sent to <strong>{email}</strong>. Dev stub:{" "}
              <strong>{STUB_OTP_CODE}</strong>
            </p>

            <form className="cob-form-stack" noValidate onSubmit={(e) => void onSubmitOtp(e)}>
              <TextField
                label="Verification code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                error={fieldErrors.otpCode}
              />

              {error && !fieldErrors.otpCode ? (
                <Alert tone="error" title="Verification">
                  {error}
                </Alert>
              ) : null}

              <div className="cob-form-actions">
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? "Verifying…" : "Verify & Continue"}
                </Button>
                <Button variant="ghost" type="button" onClick={onBackToCredentials}>
                  Use a different email
                </Button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
