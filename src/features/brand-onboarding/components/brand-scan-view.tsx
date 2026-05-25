import { useEffect, useMemo, useState } from "react";
import { Check, Shield, Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../../design-system/aurora";

import { postSurfaceScan, SurfaceScanGateError } from "../api/brand-client";
import { ONBOARDING_ROUTES } from "../constants";
import { SCAN_PROGRESS_STEPS } from "../constants/scan-progress-steps";
import { saveBrandOnboardingSession } from "../session/onboarding-session";

type ScanLocationState = {
  url?: string;
  leadId?: string;
};

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
    let intervalId: number | undefined;

    intervalId = window.setInterval(() => {
      setUiStep((prev) => {
        if (prev >= SCAN_PROGRESS_STEPS.length) {
          if (intervalId) {
            window.clearInterval(intervalId);
          }
          return prev;
        }
        const mark = Math.min(prev, SCAN_PROGRESS_STEPS.length - 1);
        setCompleteSteps((done) => (done.includes(mark) ? done : [...done, mark]));
        const next = prev + 1;
        if (next >= SCAN_PROGRESS_STEPS.length && intervalId) {
          window.clearInterval(intervalId);
        }
        return next;
      });
    }, 1400);

    void (async () => {
      try {
        const result = await postSurfaceScan({ leadId });
        if (cancelled) {
          return;
        }
        setScanMode(result.mode);
        saveBrandOnboardingSession({
          leadId,
          brandProfileId: result.brandProfileId,
          normalizedUrl: brandUrl,
        });
        window.setTimeout(() => {
          if (cancelled) {
            return;
          }
          navigate(ONBOARDING_ROUTES.dna, {
            state: {
              url: brandUrl,
              leadId,
              brandProfileId: result.brandProfileId,
              scanMode: result.mode,
            },
          });
        }, Math.max(900, SCAN_PROGRESS_STEPS.length * 1400 - 500));
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof SurfaceScanGateError) {
          if (err.gate.outcome === "verification_required") {
            saveBrandOnboardingSession({
              leadId,
              brandProfileId: err.gate.brandProfileId,
              normalizedUrl: brandUrl,
            });
            navigate(ONBOARDING_ROUTES.verification);
            return;
          }
          if (err.gate.outcome === "brand_active") {
            navigate("/login");
            return;
          }
          setError(err.gate.message);
          return;
        }
        if (intervalId) {
          window.clearInterval(intervalId);
        }
        const message =
          err instanceof Error ? err.message : "Surface scan failed. Please try again.";
        setError(message);
      }
    })();

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [brandUrl, leadId, navigate]);

  const scanComplete = uiStep >= SCAN_PROGRESS_STEPS.length;

  return (
    <div className="bob-scan">
      <div className="bob-scan__bg" aria-hidden />
      <div className="bob-scan__layout">
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
          <h1>{brandName}</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", marginTop: 8 }}>
            {error
              ? "We couldn’t finish the scan."
              : "This may take a little longer while we extract and synthesize public pages."}
          </p>
          {scanMode ? (
            <p style={{ color: "rgba(255,255,255,0.55)", marginTop: 8 }}>
              Mode:{" "}
              <strong style={{ color: "rgba(255,255,255,0.85)" }}>
                {scanMode === "http"
                  ? "Live extraction (Parallel + Gemini)"
                  : "Cached profile (no vendor re-run)"}
              </strong>
            </p>
          ) : null}
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
              const isActive = uiStep === index;
              const isDone = completeSteps.includes(index);
              const isPending = index > uiStep;
              const dotClass = [
                "bob-scan-step__dot",
                isDone ? "bob-scan-step__dot--done" : "",
                isActive && !isDone ? "bob-scan-step__dot--active" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  key={step.id}
                  className={[
                    "bob-scan-step",
                    isActive ? "bob-scan-step--active" : "",
                    isDone ? "bob-scan-step--done" : "",
                    isPending ? "bob-scan-step--pending" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className={dotClass}>
                    {isDone ? (
                      <Check size={16} strokeWidth={3} aria-hidden />
                    ) : isActive ? (
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
                    <p>
                      {isActive
                        ? step.subtext
                        : isPending
                          ? "Awaiting processing…"
                          : "Chapter complete"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bob-scan-visual" aria-label="Scan console">
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
                <Zap size={48} className="bob-scan-orb-zap" aria-hidden />
              )}
              <p className="bob-scan-orb-status">
                {scanComplete ? "COMPLETE" : "EXTRACT + SYNTH"}
              </p>
            </div>
          </div>
          <div className="bob-scan-console">
            <div className="bob-scan-console__dots">
              <span />
              <span />
              <span />
            </div>
            <p>&gt; public_domain: {brandUrl}</p>
            <p>&gt; pipeline: parallel_extract → gemini_json → prisma_upsert</p>
            <p>&gt; lead_id: {leadId ? `${leadId.slice(0, 8)}…` : "missing"}</p>
            <p>&gt; output_target: BrandProfile + offerings + competitors + locations</p>
          </div>
          <div className="bob-scan-ai-card">
            <Shield size={18} color="var(--color-primary)" aria-hidden />
            <div>
              <strong>Aurora AI Active</strong>
              <p>
                Read-only extraction of public pages via Parallel and synthesis via Gemini.
                If the server returns an error, confirm PARALLEL_API_KEY and GEMINI_API_KEY
                are set on the API.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
