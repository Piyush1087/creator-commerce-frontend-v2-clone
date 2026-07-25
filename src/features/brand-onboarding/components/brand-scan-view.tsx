import { useEffect, useMemo, useState } from "react";
import { Check, Dna, RefreshCw, Shield, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../../design-system/aurora";

import {
  getSurfaceScanProgress,
  postSurfaceScan,
  SurfaceScanGateError,
  SurfaceScanInfrastructureError,
  SurfaceScanTimeoutError,
} from "../api/brand-client";
import type { SurfaceScanResponseBody } from "../contracts/brand.contracts";
import { isHttpApiError } from "../api/http-api-error";
import { ONBOARDING_ROUTES } from "../constants";
import { landingStateFromScanGate } from "../landing-gate-redirect";
import { SCAN_PROGRESS_STEPS } from "../constants/scan-progress-steps";
import { saveBrandOnboardingSession } from "../session/onboarding-session";
import type { ScanPhase } from "../types";

type ScanLocationState = {
  url?: string;
  leadId?: string;
};

const UI_PHASE_ORDER: ScanPhase[] = [
  "signals",
  "products",
  "audience",
  "competitors",
];

const DESKTOP_ORBIT_CHIPS = [
  "Style Guide Identified",
  "SEO Meta Parsed",
  "Social Proof Detected",
] as const;

const MOBILE_ORBIT_TAGS = ["POS_TAGGING", "AUDIENCE_MATCH"] as const;

/** Share one in-flight POST across StrictMode remounts for the same lead. */
const inflightSurfaceScans = new Map<
  string,
  Promise<SurfaceScanResponseBody>
>();

function postSurfaceScanOnce(leadId: string): Promise<SurfaceScanResponseBody> {
  const existing = inflightSurfaceScans.get(leadId);
  if (existing) {
    return existing;
  }
  const pending = postSurfaceScan({ leadId }).finally(() => {
    inflightSurfaceScans.delete(leadId);
  });
  inflightSurfaceScans.set(leadId, pending);
  return pending;
}

function deriveBrandName(rawUrl: string): string {
  try {
    const trimmed = rawUrl.replace(/^(https?:\/\/)?(www\.)?/i, "");
    const first = trimmed.split(".")[0] ?? trimmed;
    return first
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return rawUrl;
  }
}

function phaseToUiIndex(phase: string): number {
  if (phase === "complete" || phase === "persisting") {
    return UI_PHASE_ORDER.length;
  }
  if (phase === "error") {
    return -1;
  }
  const idx = UI_PHASE_ORDER.indexOf(phase as ScanPhase);
  return idx >= 0 ? idx : 0;
}

function completedPhaseIndexes(completed: string[]): number[] {
  const indexes = completed
    .map((phase) => UI_PHASE_ORDER.indexOf(phase as ScanPhase))
    .filter((idx) => idx >= 0);
  return [...new Set(indexes)].sort((a, b) => a - b);
}

export function BrandScanView() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ScanLocationState | undefined;

  const brandUrl = typeof state?.url === "string" ? state.url : "yourbrand.com";
  const leadId = typeof state?.leadId === "string" ? state.leadId : "";

  const brandName = useMemo(() => deriveBrandName(brandUrl), [brandUrl]);

  const [uiStep, setUiStep] = useState(0);
  const [completeSteps, setCompleteSteps] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [scanMode, setScanMode] = useState<"http" | "cached" | null>(null);

  useEffect(() => {
    if (!leadId) {
      setError("Missing discovery session. Go back to the landing page and start again.");
      return;
    }

    let cancelled = false;
    let pollId: number | undefined;
    let navigateTimeout: number | undefined;

    const applyProgress = (snapshot: {
      phase: string;
      completedPhases: string[];
      message?: string;
      error?: string;
    }) => {
      if (snapshot.phase === "error") {
        setError(snapshot.error ?? snapshot.message ?? "We couldn’t finish the scan.");
        return;
      }
      const activeIndex = phaseToUiIndex(snapshot.phase);
      if (activeIndex >= 0) {
        setUiStep(Math.min(activeIndex, UI_PHASE_ORDER.length));
      }
      const done = completedPhaseIndexes(snapshot.completedPhases);
      if (snapshot.phase === "complete" || snapshot.phase === "persisting") {
        setCompleteSteps(UI_PHASE_ORDER.map((_, idx) => idx));
        setUiStep(UI_PHASE_ORDER.length);
      } else {
        setCompleteSteps(done);
      }
    };

    const pollProgress = async () => {
      try {
        const snapshot = await getSurfaceScanProgress(leadId);
        if (cancelled) {
          return;
        }
        applyProgress(snapshot);
        if (snapshot.phase === "complete" || snapshot.phase === "error") {
          if (pollId) {
            window.clearInterval(pollId);
            pollId = undefined;
          }
        }
      } catch {
        // Progress is best-effort; primary completion comes from POST.
      }
    };

    void pollProgress();
    pollId = window.setInterval(() => {
      void pollProgress();
    }, 900);

    void (async () => {
      try {
        const result = await postSurfaceScanOnce(leadId);
        saveBrandOnboardingSession({
          leadId,
          brandProfileId: result.brandProfileId,
          normalizedUrl: brandUrl,
        });
        if (cancelled) {
          return;
        }
        setScanMode(result.mode);
        setCompleteSteps(UI_PHASE_ORDER.map((_, idx) => idx));
        setUiStep(UI_PHASE_ORDER.length);
        if (pollId) {
          window.clearInterval(pollId);
          pollId = undefined;
        }
        navigateTimeout = window.setTimeout(() => {
          if (cancelled) {
            return;
          }
          navigate(ONBOARDING_ROUTES.coreIdentity, {
            replace: true,
            state: {
              url: brandUrl,
              leadId,
              brandProfileId: result.brandProfileId,
              scanMode: result.mode,
            },
          });
        }, 700);
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (pollId) {
          window.clearInterval(pollId);
          pollId = undefined;
        }
        if (err instanceof SurfaceScanGateError) {
          navigate(ONBOARDING_ROUTES.landing, {
            replace: true,
            state: {
              gate: landingStateFromScanGate(err.gate, {
                leadId,
                normalizedUrl: brandUrl,
              }),
            },
          });
          return;
        }
        if (err instanceof SurfaceScanInfrastructureError) {
          navigate(ONBOARDING_ROUTES.landing, {
            replace: true,
            state: {
              gate: {
                kind: "infrastructure_error",
                message: err.payload.message,
                url: brandUrl,
              },
            },
          });
          return;
        }
        if (err instanceof SurfaceScanTimeoutError) {
          setError(err.payload.message);
          setCanRetry(true);
          return;
        }
        if (isHttpApiError(err) && err.isRateLimited) {
          navigate(ONBOARDING_ROUTES.landing, {
            replace: true,
            state: {
              gate: { kind: "rate_limit", message: err.message },
            },
          });
          return;
        }
        const message =
          err instanceof Error ? err.message : "We couldn’t finish the scan. Please try again.";
        setError(message);
      }
    })();

    return () => {
      cancelled = true;
      if (pollId) {
        window.clearInterval(pollId);
      }
      if (navigateTimeout) {
        window.clearTimeout(navigateTimeout);
      }
    };
  }, [brandUrl, leadId, navigate, retryAttempt]);

  const retryScan = () => {
    setError(null);
    setCanRetry(false);
    setUiStep(0);
    setCompleteSteps([]);
    setScanMode(null);
    setRetryAttempt((attempt) => attempt + 1);
  };

  const scanComplete =
    !error && (uiStep >= SCAN_PROGRESS_STEPS.length || scanMode !== null);

  const statusLine = error
    ? "We couldn’t finish the scan."
    : scanComplete
      ? scanMode === "cached"
        ? "Using your recent scan results."
        : "Scan complete — opening core identity review."
      : "This takes a few seconds.";

  const errorActions = (
    <div className="bob-scan__error-actions">
      {canRetry ? (
        <Button type="button" onClick={retryScan}>
          <RefreshCw size={16} aria-hidden />
          Retry scan
        </Button>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        onClick={() => navigate(ONBOARDING_ROUTES.landing)}
      >
        Back to landing
      </Button>
    </div>
  );

  const stepList = (
    <nav className="bob-scan__steps" aria-label="Scan progress">
      {SCAN_PROGRESS_STEPS.map((step, index) => {
        const isDone = completeSteps.includes(index) || scanComplete;
        const isActive = !isDone && uiStep === index;
        const isPending = !isDone && index > uiStep;
        const overdueActive = !isDone && !isActive && !isPending && uiStep > index;
        const showActive = isActive || overdueActive;
        const subtext = isPending
          ? "Awaiting processing..."
          : step.subtext;

        return (
          <div
            key={step.id}
            className={[
              "bob-scan-step",
              showActive ? "bob-scan-step--active" : "",
              isDone ? "bob-scan-step--done" : "",
              isPending ? "bob-scan-step--pending" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div
              className={[
                "bob-scan-step__dot",
                isDone ? "bob-scan-step__dot--done" : "",
                showActive ? "bob-scan-step__dot--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {isDone ? (
                <Check size={14} strokeWidth={3} aria-hidden />
              ) : showActive ? (
                <span className="bob-scan-step__ping" aria-hidden />
              ) : (
                <span className="bob-scan-step__num">
                  {String(index + 1).padStart(2, "0")}
                </span>
              )}
            </div>
            <div className="bob-scan-step__copy">
              <h3>{step.label}</h3>
              <p className="bob-scan-step__subtext--desktop">{subtext}</p>
            </div>
          </div>
        );
      })}
    </nav>
  );

  const desktopOrb = (
    <div className="bob-scan-visual bob-scan-visual--desktop" aria-label="Brand scan animation">
      <div className="bob-scan-visual__grid" aria-hidden />
      <div className="bob-scan-orb-stage bob-scan-orb-stage--desktop">
        <div className="bob-scan-orb-halo" aria-hidden />
        <div className="bob-scan-orb-halo bob-scan-orb-halo--delayed" aria-hidden />
        <div
          className={[
            "bob-scan-orb-core bob-scan-orb-core--desktop",
            scanComplete ? "bob-scan-orb-core--complete" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="bob-scan-orb-core__inner">
            {scanComplete ? (
              <Check size={56} strokeWidth={3} className="bob-scan-orb-check" aria-hidden />
            ) : (
              <>
                <Dna size={56} className="bob-scan-orb-zap" aria-hidden />
                <p className="bob-scan-orb-status">Brand DNA</p>
              </>
            )}
          </div>
        </div>
        {DESKTOP_ORBIT_CHIPS.map((label, index) => (
          <div
            key={label}
            className={`bob-scan-orbit-tag bob-scan-orbit-tag--${index + 1}`}
          >
            <span className="bob-scan-orbit-tag__dot" aria-hidden />
            <span className="bob-scan-orbit-tag__text">{label}</span>
          </div>
        ))}
      </div>
      <div className="bob-scan-trust">
        <Shield size={18} aria-hidden />
        <span>No changes made to your website</span>
        <span className="bob-scan-trust__divider" aria-hidden />
        <span className="bob-scan-trust__meta">Real-time simulation active</span>
      </div>
    </div>
  );

  const mobileOrb = (
    <div className="bob-scan-visual bob-scan-visual--mobile" aria-label="Brand scan animation">
      <div className="bob-scan-orb-stage bob-scan-orb-stage--mobile">
        <div className="bob-scan-mobile-glow" aria-hidden />
        <div className="bob-scan-burst bob-scan-burst--1" aria-hidden />
        <div className="bob-scan-burst bob-scan-burst--2" aria-hidden />
        <div className="bob-scan-burst bob-scan-burst--3" aria-hidden />
        <div className="bob-scan-burst bob-scan-burst--4" aria-hidden />
        <div
          className={[
            "bob-scan-orb-core bob-scan-orb-core--mobile",
            scanComplete ? "bob-scan-orb-core--complete" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {scanComplete ? (
            <Check size={36} strokeWidth={3} className="bob-scan-orb-check" aria-hidden />
          ) : (
            <Dna size={40} className="bob-scan-orb-zap" aria-hidden />
          )}
        </div>
        {MOBILE_ORBIT_TAGS.map((label, index) => (
          <div
            key={label}
            className={`bob-scan-mobile-tag bob-scan-mobile-tag--${index + 1}`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bob-scan">
      <div className="bob-scan__bg" aria-hidden />
      <div className="bob-scan__layout">
        <aside className="bob-scan__panel">
          <div className="bob-scan__intro bob-scan__intro--desktop">
            <h2 className="bob-scan__headline">Analyzing your brand</h2>
            <p className="bob-scan__status">{statusLine}</p>
            {error ? (
              <div className="bob-scan__error">
                <p>{error}</p>
                {errorActions}
              </div>
            ) : null}
          </div>

          <div className="bob-scan__intro bob-scan__intro--mobile">
            <p className="bob-scan__eyebrow">Scanning in progress</p>
            <h1>
              Analyzing your brand
              <br />
              <span className="bob-scan__brand-name">{brandName}</span>
            </h1>
            {error ? (
              <div className="bob-scan__error">
                <p>{error}</p>
                {errorActions}
              </div>
            ) : null}
          </div>

          <div className="bob-scan__mobile-visual">{mobileOrb}</div>

          <div className="bob-scan__steps-wrap">{stepList}</div>

          <div className="bob-scan-ai-card">
            <Sparkles size={20} aria-hidden />
            <div>
              <strong>Aurora AI Active</strong>
              <p>
                Our engine is non-intrusive. We are performing a read-only scan of your
                public infrastructure.
              </p>
            </div>
          </div>
        </aside>

        <section className="bob-scan__desktop-visual">{desktopOrb}</section>
      </div>

      <footer className="bob-scan-mobile-footer">
        <Shield size={14} aria-hidden />
        <span>AI can make mistakes.</span>
      </footer>
    </div>
  );
}
