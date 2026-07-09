import { useEffect, useMemo, useState } from "react";
import { Check, Shield, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../../design-system/aurora";

import {
  getSurfaceScanProgress,
  postSurfaceScan,
  SurfaceScanGateError,
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
          navigate(ONBOARDING_ROUTES.dna, {
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
  }, [brandUrl, leadId, navigate]);

  const scanComplete =
    !error && (uiStep >= SCAN_PROGRESS_STEPS.length || scanMode !== null);

  const statusLine = error
    ? "We couldn’t finish the scan."
    : scanComplete
      ? scanMode === "cached"
        ? "Using your recent scan results."
        : "Scan complete — opening your brand DNA."
      : "This takes a few seconds.";

  return (
    <div className="bob-scan">
      <div className="bob-scan__bg" aria-hidden />
      <div className="bob-scan__layout">
        <div className="bob-scan__panel">
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.06em",
                marginBottom: 8,
              }}
            >
              Analyzing your brand
            </p>
            <h1 style={{ color: "var(--color-primary)" }}>{brandName}</h1>
            <p style={{ color: "rgba(255,255,255,0.65)", marginTop: 8 }}>{statusLine}</p>
            {error ? (
              <div style={{ marginTop: 16 }}>
                <p style={{ color: "#ffb4b4", marginBottom: 12 }}>{error}</p>
                <Button type="button" variant="secondary" onClick={() => navigate("/")}>
                  Back to landing
                </Button>
              </div>
            ) : null}
            <div className="bob-scan__steps" style={{ marginTop: 24 }}>
              {SCAN_PROGRESS_STEPS.map((step, index) => {
                const isDone = completeSteps.includes(index) || scanComplete;
                const isActive = !isDone && uiStep === index;
                const isPending = !isDone && index > uiStep;
                const overdueActive =
                  !isDone && !isActive && !isPending && uiStep > index;
                const showActive = isActive || overdueActive;
                const dotClass = [
                  "bob-scan-step__dot",
                  isDone ? "bob-scan-step__dot--done" : "",
                  showActive ? "bob-scan-step__dot--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
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
                    <div className={dotClass}>
                      {isDone ? (
                        <Check size={16} strokeWidth={3} aria-hidden />
                      ) : showActive ? (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--color-primary)",
                            display: "inline-block",
                          }}
                        />
                      ) : (
                        <span>{String(index + 1).padStart(2, "0")}</span>
                      )}
                    </div>
                    <div>
                      <h3>{step.label}</h3>
                      <p>{step.subtext}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bob-scan-ai-card bob-scan-ai-card--footer">
            <Sparkles size={18} color="var(--color-primary)" aria-hidden />
            <div>
              <strong>Aurora AI Active</strong>
              <p>
                Our engine is non-intrusive. We perform a read-only scan of your public
                pages — nothing is changed on your website.
              </p>
            </div>
          </div>
        </div>
        <div className="bob-scan-visual" aria-label="Brand scan animation">
          <div className="bob-scan-orb-stage">
            <div className="bob-scan-burst bob-scan-burst--1" aria-hidden />
            <div className="bob-scan-burst bob-scan-burst--2" aria-hidden />
            <div className="bob-scan-burst bob-scan-burst--3" aria-hidden />
            <div className="bob-scan-orb-halo" aria-hidden />
            <div
              className={[
                "bob-scan-orb-core",
                scanComplete ? "bob-scan-orb-core--complete" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {scanComplete ? (
                <Check size={56} strokeWidth={3} className="bob-scan-orb-check" aria-hidden />
              ) : (
                <Sparkles size={48} className="bob-scan-orb-zap" aria-hidden />
              )}
              <p className="bob-scan-orb-status">
                {scanComplete ? "Ready" : "Brand DNA"}
              </p>
            </div>
          </div>
          <div className="bob-scan-trust">
            <Shield size={16} color="var(--color-primary)" aria-hidden />
            <span>No changes made to your website</span>
          </div>
        </div>
      </div>
    </div>
  );
}
