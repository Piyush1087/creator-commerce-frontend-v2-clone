import { useMemo, useState } from "react";
import { ArrowRight, Info, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Alert, Badge, Button, Card, TextField } from "../../../design-system/aurora";

import { ONBOARDING_ROUTES } from "../constants";
import { parseHostnameFromUrl } from "../mappers/map-brand-profile";
import { loadBrandOnboardingSession } from "../session/onboarding-session";

type VerifyStep = "email" | "otp";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function BrandVerificationView() {
  const navigate = useNavigate();
  const session = loadBrandOnboardingSession();

  const domain = useMemo(() => {
    if (!session?.normalizedUrl) {
      return "yourbrand.com";
    }
    const host = parseHostnameFromUrl(session.normalizedUrl);
    return host.length > 0 ? host : "yourbrand.com";
  }, [session?.normalizedUrl]);

  const [step, setStep] = useState<VerifyStep>("email");
  const [workEmail, setWorkEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const emailPlaceholder = `name@${domain}`;

  const sendOtp = async () => {
    setError(null);
    setInfo(null);
    if (!isValidEmail(workEmail)) {
      setError("Enter a valid work email address.");
      return;
    }
    setIsSending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setIsSending(false);
    setStep("otp");
    setInfo(`We sent a one-time code to ${workEmail.trim()}.`);
  };

  const verifyOtp = async () => {
    setError(null);
    setInfo(null);
    const code = otp.replace(/\D/g, "");
    if (code.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setIsVerifying(true);
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    setIsVerifying(false);
    navigate(ONBOARDING_ROUTES.landing, {
      state: { verificationComplete: true },
    });
  };

  const sessionError = session
    ? null
    : "Missing onboarding session. Go back and run a scan.";

  if (sessionError) {
    return (
      <div className="bob-verify bob-verify--empty">
        <div className="bob-container">
          <Alert title="Session required" tone="error">
            {sessionError}
          </Alert>
          <div className="bob-inline" style={{ marginTop: "var(--space-md)" }}>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate(ONBOARDING_ROUTES.landing)}
            >
              Back to start
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bob-verify">
      <div className="bob-verify__split">
        <section className="bob-verify__left" aria-labelledby="bob-verify-title">
          <div className="bob-verify__left-inner">
            <div className="bob-verify__toolbar">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                Back
              </Button>
            </div>

            {error ? (
              <Alert title="Verification" tone="error">
                {error}
              </Alert>
            ) : null}
            {info ? (
              <Alert title="Code sent" tone="success">
                {info}
              </Alert>
            ) : null}

            <Card className="bob-verify__card">
              <h1 id="bob-verify-title" className="bob-verify__title">
                Verify you own this brand
              </h1>
              <p className="bob-verify__lead">
                To protect brands on our platform, we verify that you&apos;re associated with{" "}
                <strong>{domain}</strong>. Enter your work email to receive a one-time code.
              </p>

              {step === "email" ? (
                <form
                  className="bob-stack"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendOtp();
                  }}
                >
                  <TextField
                    label="Work email"
                    type="email"
                    name="work-email"
                    autoComplete="email"
                    placeholder={emailPlaceholder}
                    value={workEmail}
                    onChange={(event) => setWorkEmail(event.target.value)}
                  />
                  <Button type="submit" variant="primary" fullWidthOnMobile disabled={isSending}>
                    {isSending ? "Sending…" : "Send OTP"}
                    <ArrowRight size={18} aria-hidden />
                  </Button>
                </form>
              ) : (
                <form
                  className="bob-stack"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void verifyOtp();
                  }}
                >
                  <TextField
                    label="One-time code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    helperText="Check your inbox and spam folder."
                  />
                  <Button type="submit" variant="primary" fullWidthOnMobile disabled={isVerifying}>
                    {isVerifying ? "Verifying…" : "Verify email"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setInfo(null);
                      setError(null);
                    }}
                  >
                    Use a different email
                  </Button>
                </form>
              )}

              <p className="bob-verify-disclaimer">
                <Info size={14} aria-hidden />
                AI can make mistakes. Verify the results.
              </p>
            </Card>
          </div>
        </section>

        <section
          className="bob-verify__right"
          aria-label="Preview of insights after verification"
        >
          <div className="bob-verify__right-inner">
            <div className="bob-verify__preview-badge">
              <Badge tone="selected">Phase 2 preview</Badge>
            </div>

            <div className="bob-verify__preview-panel">
              <header className="bob-verify__preview-header">
                <div>
                  <h2>Competitive gap analysis</h2>
                  <p>Real-time market intel comparison</p>
                </div>
              </header>

              <div className="bob-verify__preview-grid">
                <div className="bob-verify__preview-tile">
                  <div className="bob-verify__preview-tile-label">competitor_brand</div>
                  <div className="bob-verify__preview-visual" aria-hidden>
                    <span>Creative trend detected</span>
                  </div>
                  <div className="bob-verify__skeleton-lines" aria-hidden>
                    <span />
                    <span />
                  </div>
                </div>

                <div className="bob-verify__preview-stack">
                  <div className="bob-verify__preview-chart">
                    <h3>Market saturation</h3>
                    <div className="bob-verify__bars" aria-hidden>
                      <span className="bob-verify__bar bob-verify__bar--muted" />
                      <span className="bob-verify__bar bob-verify__bar--you">
                        <span className="bob-verify__bar-label">You (target)</span>
                      </span>
                    </div>
                  </div>
                  <div className="bob-verify__preview-keywords">
                    <h3>Winning keywords</h3>
                    <div className="bob-inline">
                      <Badge tone="pending">Sustainability</Badge>
                      <Badge tone="selected">High growth</Badge>
                    </div>
                    <div className="bob-verify__lock-row">
                      <Lock size={14} aria-hidden />
                      <span>Unlock deep intel</span>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="bob-verify__recommendation">
                <strong>Executive recommendation</strong>
                <p>
                  Shift creative spend toward community verification to bridge engagement gaps
                  identified in your sector.
                </p>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
