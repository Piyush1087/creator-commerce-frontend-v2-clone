import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Ban, CircleAlert, Info, Link2, Lock, RefreshCw } from "lucide-react";

import { Button } from "../../../design-system/aurora";

import { urlSchema } from "../schemas/url-schema";

export type LandingUrlCaptureMode =
  | "default"
  | "syntax_error"
  | "infra_retry"
  | "blocked_locked"
  | "resume"
  | "verification_required"
  | "org_claimed"
  | "brand_active"
  | "waitlist";

type LandingUrlCaptureProps = {
  isBusy: boolean;
  mode?: LandingUrlCaptureMode;
  lockedUrl?: string;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  feedback?: { tone: "error" | "warning" | "success"; message: string } | null;
  helperText?: string | null;
  onPrimaryAction: (url: string) => void | Promise<void>;
};

const LISTENING_MESSAGES = [
  "Locating brand servers...",
  "Analyzing industry signals...",
  "Verifying commercial DNA...",
] as const;

export function LandingUrlCapture({
  isBusy,
  mode = "default",
  lockedUrl,
  primaryLabel = "Analyze My Brand",
  primaryDisabled,
  feedback,
  helperText,
  onPrimaryAction,
}: LandingUrlCaptureProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shakeNonce, setShakeNonce] = useState(0);
  const [listening, setListening] = useState(false);
  const [listeningText, setListeningText] = useState<string>(
    LISTENING_MESSAGES[0],
  );
  const [textFading, setTextFading] = useState(false);
  const listenIndex = useRef(0);
  const fadeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (typeof lockedUrl === "string") {
      setUrl(lockedUrl);
      setError(null);
    }
  }, [lockedUrl]);

  useEffect(() => {
    return () => {
      if (fadeTimer.current !== null) {
        window.clearTimeout(fadeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!listening && !isBusy) {
      return;
    }
    const id = window.setInterval(() => {
      setTextFading(true);
      fadeTimer.current = window.setTimeout(() => {
        listenIndex.current =
          (listenIndex.current + 1) % LISTENING_MESSAGES.length;
        setListeningText(LISTENING_MESSAGES[listenIndex.current]);
        setTextFading(false);
      }, 200);
    }, 2000);
    return () => window.clearInterval(id);
  }, [listening, isBusy]);

  const shouldValidateUrl =
    mode === "default" ||
    mode === "syntax_error" ||
    mode === "infra_retry";

  const inputDisabled =
    mode === "blocked_locked" ||
    mode === "org_claimed" ||
    mode === "waitlist" ||
    (Boolean(lockedUrl) &&
      mode !== "resume" &&
      mode !== "brand_active" &&
      mode !== "verification_required" &&
      mode !== "infra_retry");

  const locked =
    Boolean(lockedUrl) ||
    mode === "blocked_locked" ||
    mode === "resume" ||
    mode === "verification_required" ||
    mode === "org_claimed" ||
    mode === "brand_active" ||
    mode === "waitlist";

  const effectiveFeedback = useMemo(() => {
    if (error) {
      return { tone: "error" as const, message: error };
    }
    return feedback ?? null;
  }, [error, feedback]);

  const handlePrimary = async (event?: React.FormEvent) => {
    event?.preventDefault();

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a website address.");
      setShakeNonce((value) => value + 1);
      return;
    }

    if (shouldValidateUrl) {
      const parsed = urlSchema.safeParse(trimmed);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid URL.");
        setShakeNonce((value) => value + 1);
        return;
      }
      setError(null);
      setListening(true);
      try {
        await Promise.resolve(onPrimaryAction(parsed.data));
      } finally {
        setListening(false);
      }
      return;
    }

    setError(null);
    await Promise.resolve(onPrimaryAction(trimmed));
  };

  const showLoadingStatus = listening || isBusy;
  const hasInlineError = effectiveFeedback?.tone === "error";
  const hasLocalError = Boolean(error);
  const showShake = hasLocalError || mode === "syntax_error";
  const showIdlePulse =
    mode === "default" && !locked && !showLoadingStatus && !hasInlineError;

  const glassClass = [
    "bob-url-glass",
    hasInlineError || hasLocalError ? "bob-url-glass--error" : "",
    showShake ? "bob-url-glass--shake" : "",
    mode === "blocked_locked" ? "bob-url-glass--blocked" : "",
    mode === "org_claimed" ? "bob-url-glass--org-claimed" : "",
    locked && mode !== "blocked_locked" ? "bob-url-glass--locked" : "",
    showLoadingStatus ? "bob-url-glass--active" : "",
    showIdlePulse ? "bob-url-glass--idle-pulse" : "",
    mode === "waitlist" ? "bob-url-glass--waitlist" : "",
    mode === "resume" ? "bob-url-glass--resume" : "",
    mode === "verification_required" ? "bob-url-glass--verify" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inputClass = [
    "bob-url-input",
    mode === "verification_required" ? "bob-url-input--rate-limit" : "",
    mode === "blocked_locked" || mode === "org_claimed"
      ? "bob-url-input--blocked"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const feedbackClass = [
    "bob-url-feedback",
    "bob-url-feedback--inline",
    effectiveFeedback?.tone === "error" ? "bob-url-feedback--error" : "",
    effectiveFeedback?.tone === "warning" ? "bob-url-feedback--warning" : "",
    effectiveFeedback?.tone === "success" ? "bob-url-feedback--success" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const linkIconColor =
    mode === "waitlist" ? "#F5926E" : "var(--bob-primary)";

  const feedbackIcon = useMemo(() => {
    if (!effectiveFeedback) {
      return null;
    }
    if (effectiveFeedback.tone === "error") {
      if (mode === "blocked_locked") {
        return <Ban size={16} aria-hidden className="bob-url-feedback__icon" />;
      }
      return (
        <CircleAlert size={16} aria-hidden className="bob-url-feedback__icon" />
      );
    }
    if (effectiveFeedback.tone === "warning") {
      if (mode === "org_claimed") {
        return <Lock size={16} aria-hidden className="bob-url-feedback__icon" />;
      }
      if (mode === "infra_retry") {
        return (
          <AlertCircle size={16} aria-hidden className="bob-url-feedback__icon" />
        );
      }
      return <Info size={16} aria-hidden className="bob-url-feedback__icon" />;
    }
    if (effectiveFeedback.tone === "success" && mode === "resume") {
      return (
        <RefreshCw size={16} aria-hidden className="bob-url-feedback__icon" />
      );
    }
    return null;
  }, [effectiveFeedback, mode]);

  const ctaDisabled =
    primaryDisabled ||
    showLoadingStatus ||
    !url.trim() ||
    (locked && shouldValidateUrl);

  return (
    <div className={`bob-url-capture bob-url-capture--${mode}`}>
      <form className="bob-url-form" onSubmit={handlePrimary}>
        <div
          key={shakeNonce}
          className={glassClass}
          data-mode={mode}
        >
          <div className="bob-url-glass__input-wrap">
            <Link2
              size={22}
              className="bob-url-glass__icon"
              color={linkIconColor}
              aria-hidden
            />
            <input
              className={inputClass}
              name="brandUrl"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="url"
              placeholder="Your website URL (we'll take it from here)"
              value={url}
              disabled={inputDisabled || showLoadingStatus}
              readOnly={
                mode === "resume" ||
                mode === "brand_active" ||
                mode === "verification_required"
              }
              onChange={(event) => {
                setUrl(event.target.value);
                if (error) {
                  setError(null);
                }
              }}
            />
          </div>
          <div className="bob-url-glass__cta">
            <Button
              type="submit"
              variant="primary"
              disabled={ctaDisabled}
            >
              {primaryLabel}
            </Button>
          </div>
        </div>
        <div className="bob-url-glass__cta-mobile">
          <Button
            type="submit"
            variant="primary"
            fullWidthOnMobile
            disabled={ctaDisabled}
          >
            {primaryLabel}
          </Button>
        </div>
      </form>

      {effectiveFeedback && !showLoadingStatus ? (
        <p className={feedbackClass} role="alert">
          {feedbackIcon}
          <span>{effectiveFeedback.message}</span>
        </p>
      ) : null}

      {helperText && !showLoadingStatus && !effectiveFeedback ? (
        <p className="bob-url-helper">{helperText}</p>
      ) : null}

      <div
        className={`bob-url-loading${
          showLoadingStatus ? " bob-url-loading--visible" : " bob-url-loading--hidden"
        }`}
        aria-live="polite"
        aria-hidden={!showLoadingStatus}
      >
        <span className="bob-url-loading__dot" aria-hidden />
        <span
          className={`bob-url-loading__text${
            textFading ? " bob-url-loading__text--fade" : ""
          }`}
        >
          {listeningText}
        </span>
      </div>
    </div>
  );
}
