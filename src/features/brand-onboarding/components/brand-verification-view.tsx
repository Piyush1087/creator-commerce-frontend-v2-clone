import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Info, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge, Button, Card, TextField } from "../../../design-system/aurora";

import {
  sendBrandVerificationOtp,
  verifyBrandVerificationOtp,
} from "../api/brand-client";
import { ONBOARDING_ROUTES } from "../constants";
import {
  STUB_OTP_CODE,
  STUB_OTP_TTL_MINUTES,
  USE_REAL_BRAND_VERIFICATION_OTP,
} from "../verification-otp.config";
import { parseHostnameFromUrl } from "../mappers/map-brand-profile";
import { loadBrandOnboardingSession } from "../session/onboarding-session";

type VerifyStep = "email" | "otp" | "success";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function formatMmSs(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function parseSendCooldownSeconds(message: string): number | null {
  const match = message.match(/wait (\d+) seconds/i);
  if (!match) {
    return null;
  }
  const parsed = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [sendCooldownSeconds, setSendCooldownSeconds] = useState(0);

  const emailPlaceholder = `name@${domain}`;
  const isOtpExpired = otpSecondsLeft <= 0 && otpExpiresAt !== null;
  const canResend = sendCooldownSeconds <= 0 && !isSending;

  const tickOtpExpiry = useCallback(() => {
    if (otpExpiresAt === null) {
      setOtpSecondsLeft(0);
      return;
    }
    const remaining = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
    setOtpSecondsLeft(remaining);
  }, [otpExpiresAt]);

  useEffect(() => {
    tickOtpExpiry();
    if (otpExpiresAt === null) {
      return;
    }
    const timer = window.setInterval(tickOtpExpiry, 1000);
    return () => window.clearInterval(timer);
  }, [otpExpiresAt, tickOtpExpiry]);

  useEffect(() => {
    if (sendCooldownSeconds <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setSendCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sendCooldownSeconds]);

  const sendOtp = async () => {
    if (!session?.brandProfileId) {
      return;
    }

    setError(null);
    const email = workEmail.trim();

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address (e.g., name@brand.in)");
      return;
    }

    if (sendCooldownSeconds > 0) {
      setError(
        `Too many attempts. Please wait ${sendCooldownSeconds} seconds before requesting another code.`,
      );
      return;
    }

    setIsSending(true);
    try {
      // PRE-PROD: stub send — no API. PROD: set USE_REAL_BRAND_VERIFICATION_OTP=true
      // (see creator-commerce-backend-v2/docs/brand-onboarding/VERIFICATION_OTP_TOGGLE.md)
      if (!USE_REAL_BRAND_VERIFICATION_OTP) {
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        setWorkEmail(email);
        setOtpExpiresAt(Date.now() + STUB_OTP_TTL_MINUTES * 60 * 1000);
        setOtpValues(Array(6).fill(""));
        setStep("otp");
        window.setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
        return;
      }

      /* PROD — real OTP send (active when USE_REAL_BRAND_VERIFICATION_OTP is true) */
      const result = await sendBrandVerificationOtp(session.brandProfileId, email);
      setWorkEmail(email);
      setOtpExpiresAt(new Date(result.expiresAt).getTime());
      setOtpValues(Array(6).fill(""));
      setStep("otp");
      window.setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "We're having trouble connecting to our verification server. Please try again in a moment.";
      const cooldown = parseSendCooldownSeconds(message);
      if (cooldown !== null) {
        setSendCooldownSeconds(cooldown);
      }
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const applyOtpFromString = (raw: string, startIndex: number) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6 - startIndex);
    if (digits.length === 0) {
      return;
    }

    const newOtp = [...otpValues];
    for (let i = 0; i < digits.length; i += 1) {
      newOtp[startIndex + i] = digits[i] ?? "";
    }
    setOtpValues(newOtp);
    setError(null);

    const focusIndex = Math.min(startIndex + digits.length, 5);
    window.requestAnimationFrame(() => {
      inputRefs.current[focusIndex]?.focus();
    });
  };

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits && value !== "") {
      return;
    }

    if (digits.length > 1) {
      applyOtpFromString(digits, index);
      return;
    }

    const newOtp = [...otpValues];
    newOtp[index] = digits;
    setOtpValues(newOtp);
    setError(null);

    if (digits !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();
    applyOtpFromString(event.clipboardData.getData("text"), index);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    if (!session?.brandProfileId) {
      return;
    }

    setError(null);
    const code = otpValues.join("");

    if (code.length < 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    if (isOtpExpired) {
      setError("This code has expired. Resend a new code.");
      return;
    }

    setIsVerifying(true);
    try {
      // PRE-PROD: accept STUB_OTP_CODE locally, then verify API (backend stub sets isVerified)
      if (!USE_REAL_BRAND_VERIFICATION_OTP) {
        if (code !== STUB_OTP_CODE) {
          setError("Invalid code. Please check your email and try again.");
          setOtpValues(Array(6).fill(""));
          inputRefs.current[0]?.focus();
          return;
        }
      }

      /* PROD — real OTP verify (USE_REAL_BRAND_VERIFICATION_OTP=true) */
      await verifyBrandVerificationOtp(session.brandProfileId, {
        email: workEmail.trim(),
        otp: code,
      });
      setStep("success");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Incorrect code. Please check your email and try again.";
      setError(message);
      setOtpValues(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const sessionError = session
    ? null
    : "Missing onboarding session. Go back and run a scan.";

  if (sessionError) {
    return (
      <div className="bob-verify bob-verify--empty">
        <div className="bob-container">
          <div className="bob-inline-error">
            <AlertCircle size={16} />
            <span>{sessionError}</span>
          </div>
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
    <div className={`bob-verify bob-verify--hide-nav ${step === "success" ? "bob-verify--success" : ""}`}>
      <div className="bob-verify__split">
        <section className="bob-verify__left" aria-labelledby="bob-verify-title">
          <div className="bob-verify__left-inner">
            <div className="bob-verify__toolbar">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                Back
              </Button>
            </div>

            {step === "success" ? (
              <Card className="bob-verify__card bob-verify__card--success">
                <div className="bob-verify__success-icon">
                  <CheckCircle size={56} strokeWidth={1.5} />
                </div>
                <h1 id="bob-verify-title" className="bob-verify__title bob-verify__title--centered">
                  VERIFICATION SUCCESSFUL
                </h1>
                <p className="bob-verify__lead bob-verify__lead--centered">
                  Your brand ownership has been verified. You now have full access to Aurora&apos;s deep intelligence tools and strategy dashboard.
                </p>

                <div className="bob-verify__metadata">
                  <div className="bob-verify__metadata-item">
                    <span>Domain</span>
                    <strong>{domain}</strong>
                  </div>
                  <div className="bob-verify__metadata-item">
                    <span>Auth Method</span>
                    <strong>Deep Intel Scan</strong>
                  </div>
                  <div className="bob-verify__metadata-item">
                    <span>Status</span>
                    <Badge tone="success">Live</Badge>
                  </div>
                </div>

                <div className="bob-stack" style={{ marginTop: "var(--space-xl)", width: "100%" }}>
                  <Button
                    type="button"
                    variant="primary"
                    fullWidthOnMobile
                    onClick={() => navigate(ONBOARDING_ROUTES.pricing)}
                  >
                    Continue to pricing
                    <ArrowRight size={18} aria-hidden />
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="bob-verify__card">
                <h1 id="bob-verify-title" className="bob-verify__title bob-verify__title--uppercase">
                  {step === "email" ? "VERIFY YOU OWN THIS BRAND" : "ENTER THE 6-DIGIT CODE"}
                </h1>
                <p className="bob-verify__lead">
                  {step === "email" ? (
                    `Confirm your corporate identity to unlock Deep Intel and market mapping features for ${domain}.`
                  ) : (
                    <>
                      {`We sent a code to ${workEmail}. It expires in ${formatMmSs(otpSecondsLeft)}.`}
                      {" "}
                      <button
                        type="button"
                        className="bob-link"
                        disabled={!canResend}
                        onClick={() => void sendOtp()}
                        style={{ marginLeft: "4px" }}
                      >
                        {isSending
                          ? "Sending…"
                          : sendCooldownSeconds > 0
                            ? `Resend in ${sendCooldownSeconds}s`
                            : isOtpExpired
                              ? "Resend code"
                              : "Resend code"}
                      </button>
                    </>
                  )}
                </p>

                {step === "email" ? (
                  <form
                    className="bob-stack"
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      void sendOtp();
                    }}
                  >
                    <TextField
                      label="Work Email"
                      type="text"
                      name="work-email"
                      autoComplete="email"
                      placeholder={emailPlaceholder}
                      value={workEmail}
                      onChange={(event) => {
                        setWorkEmail(event.target.value);
                        if (error) {
                          setError(null);
                        }
                      }}
                      helperText="We'll send a one-time verification code to this address."
                      error={error ?? undefined}
                    />
                    {error && (
                      <div className="bob-inline-error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                      </div>
                    )}
                    <div style={{ marginTop: "var(--space-sm)" }}>
                      <Button
                        type="submit"
                        variant="primary"
                        fullWidthOnMobile
                        disabled={isSending || sendCooldownSeconds > 0}
                      >
                        {isSending
                          ? "Sending…"
                          : sendCooldownSeconds > 0
                            ? `Send OTP (${sendCooldownSeconds}s)`
                            : "Send OTP"}
                        <ArrowRight size={18} aria-hidden />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form
                    className="bob-stack"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void verifyOtp();
                    }}
                  >
                    <div className="bob-otp-container">
                      <label className="bob-otp-label">Security Code</label>
                      <div className="bob-otp-group">
                        {otpValues.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => {
                              inputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onPaste={(e) => handleOtpPaste(index, e)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className={`bob-otp-input ${error ? "bob-otp-input--error" : ""}`}
                            autoComplete={index === 0 ? "one-time-code" : "off"}
                            disabled={isOtpExpired}
                          />
                        ))}
                      </div>
                      {error ? (
                        <div className="bob-inline-error">
                          <AlertCircle size={16} />
                          <span>{error}</span>
                        </div>
                      ) : (
                        <div className="bob-otp-helper">
                          {isOtpExpired
                            ? "This code has expired. Resend a new code."
                            : `Code expires in ${formatMmSs(otpSecondsLeft)}`}
                        </div>
                      )}
                    </div>

                    <p className="bob-verify__spam-hint">
                      Didn&apos;t receive it? Check your spam folder.
                    </p>

                    <div className="bob-otp-actions">
                      <Button
                        type="submit"
                        variant="primary"
                        fullWidthOnMobile
                        disabled={isVerifying || isOtpExpired}
                      >
                        {isVerifying ? "Verifying…" : "Verify & Continue"}
                        <ArrowRight size={18} aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setStep("email");
                          setOtpValues(Array(6).fill(""));
                          setOtpExpiresAt(null);
                          setError(null);
                        }}
                      >
                        Use a different email
                      </Button>
                    </div>
                  </form>
                )}

                <p className="bob-verify-disclaimer">
                  <Info size={14} aria-hidden />
                  AI can make mistakes. Verify the results.
                </p>
              </Card>
            )}
          </div>
        </section>

        <section
          className="bob-verify__right bob-verify__right--desktop-only"
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
