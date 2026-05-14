import { useEffect, useMemo, useState } from "react";
import { Brain, Check, Database, Shield, Target, Users, Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { ONBOARDING_ROUTES } from "../constants";
import { SCAN_STEPS } from "../mock-data/scan-steps";

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
  const brandUrl =
    typeof location.state === "object" &&
    location.state !== null &&
    "url" in location.state &&
    typeof (location.state as { url?: unknown }).url === "string"
      ? (location.state as { url: string }).url
      : "yourbrand.com";

  const brandName = useMemo(() => deriveBrandName(brandUrl), [brandUrl]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completeSteps, setCompleteSteps] = useState<number[]>([]);

  useEffect(() => {
    if (currentStep < SCAN_STEPS.length) {
      const timer = window.setTimeout(() => {
        setCompleteSteps((prev) => [...prev, currentStep]);
        setCurrentStep((prev) => prev + 1);
      }, 4000);
      return () => window.clearTimeout(timer);
    }
    const done = window.setTimeout(() => {
      navigate(ONBOARDING_ROUTES.dna, { state: { url: brandUrl } });
    }, 2500);
    return () => window.clearTimeout(done);
  }, [brandUrl, currentStep, navigate]);

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
            This takes a few seconds.
          </p>
          <div className="bob-scan__steps" style={{ marginTop: 24 }}>
            {SCAN_STEPS.map((step, index) => {
              const isActive = currentStep === index;
              const isDone = completeSteps.includes(index);
              const isPending = index > currentStep;
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
        <div className="bob-scan-visual" aria-label="Mock scan console">
          <div className="bob-scan-orb">
            <div className="bob-scan-orb__ring" />
            <div className="bob-scan-orb__core">
              <Zap size={44} aria-hidden />
            </div>
          </div>
          <div className="bob-scan-console">
            <div className="bob-scan-console__dots">
              <span />
              <span />
              <span />
            </div>
            <p>&gt; public_domain: {brandUrl}</p>
            <p>&gt; signal_map: visual_identity, products, audience</p>
            <p>&gt; model_state: surface_scan_mock</p>
            <p>&gt; output_target: Brand DNA</p>
          </div>
          <div className="bob-scan-ai-card">
            <Shield size={18} color="var(--color-primary)" aria-hidden />
            <div>
              <strong>Aurora AI Active</strong>
              <p>
                Our engine is non-intrusive. We are performing a read-only scan
                of your public infrastructure.
              </p>
            </div>
          </div>
          <div className="bob-scan-signal-grid" aria-hidden>
            {[Brain, Database, Target, Users].map((Icon, index) => (
              <span key={index}>
                <Icon size={20} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
