import { useEffect, useMemo, useState } from "react";
import { Check, Dna, Shield, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../../design-system/aurora";

import { getIntelligenceStatus } from "../api/brand-client";
import type { BrandIntelligenceStage } from "../contracts/brand.contracts";
import { ONBOARDING_ROUTES } from "../constants";
import { loadBrandOnboardingSession } from "../session/onboarding-session";

type IntelligenceScanLocationState = {
  url?: string;
  leadId?: string;
  brandProfileId?: string;
  scanMode?: "http" | "cached";
};

const INTELLIGENCE_STEPS = [
  {
    id: "acquiring",
    label: "Acquiring brand pages",
    subtext: "Collecting public brand surfaces…",
    stage: "CORE_IDENTITY_APPROVED" as const,
  },
  {
    id: "extracting",
    label: "Extracting Brand DNA",
    subtext: "Synthesizing positioning and voice…",
    stage: "STAGE_1B_COMPLETE" as const,
  },
  {
    id: "validating",
    label: "Validating Brand DNA",
    subtext: "Checking confidence and evidence…",
    stage: "STAGE_2_BRAND_DNA_COMPLETE" as const,
  },
] as const;

const PIPELINE_FAILED: BrandIntelligenceStage[] = [
  "STAGE_1B_FAILED",
  "STAGE_2_BRAND_DNA_FAILED",
  "STAGE_2_NEEDS_REVIEW",
];

const DESKTOP_ORBIT_CHIPS = [
  "Pages Acquired",
  "DNA Extracted",
  "Evidence Validated",
] as const;

const MOBILE_ORBIT_TAGS = ["PAGE_FETCH", "DNA_BUILD"] as const;

const FAILURE_NOTICE =
  "Deeper brand analysis unavailable — you can edit manually.";

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

function stageToUiIndex(stage: BrandIntelligenceStage | null): number {
  if (!stage) {
    return 0;
  }
  if (stage === "STAGE_2_BRAND_DNA_ARCHIVED" || stage === "CHECKPOINT_2_CONFIRMED") {
    return INTELLIGENCE_STEPS.length;
  }
  const idx = INTELLIGENCE_STEPS.findIndex((step) => step.stage === stage);
  return idx >= 0 ? idx : 0;
}

export function BrandIntelligenceScanView() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as IntelligenceScanLocationState | null) ?? {};
  const session = loadBrandOnboardingSession();

  const brandUrl =
    typeof state.url === "string"
      ? state.url
      : (session?.normalizedUrl ?? "yourbrand.com");
  const leadId =
    typeof state.leadId === "string" ? state.leadId : (session?.leadId ?? "");
  const brandProfileId =
    typeof state.brandProfileId === "string"
      ? state.brandProfileId
      : (session?.brandProfileId ?? "");
  const scanMode = state.scanMode;

  const brandName = useMemo(() => deriveBrandName(brandUrl), [brandUrl]);

  const [uiStep, setUiStep] = useState(0);
  const [completeSteps, setCompleteSteps] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanComplete, setScanComplete] = useState(false);

  useEffect(() => {
    if (!leadId) {
      setError(
        "Missing discovery session. Go back to the landing page and start again.",
      );
      return;
    }

    let cancelled = false;
    let pollId: number | undefined;
    let navigateTimeout: number | undefined;

    const dnaState = {
      url: brandUrl,
      leadId,
      brandProfileId,
      scanMode: scanMode ?? "http",
      coreIdentityConfirmed: true,
    };

    const goToDna = (extra?: { intelligenceFailure?: boolean; intelNotice?: string }) => {
      navigateTimeout = window.setTimeout(() => {
        if (cancelled) {
          return;
        }
        navigate(ONBOARDING_ROUTES.dna, {
          replace: true,
          state: {
            ...dnaState,
            ...extra,
          },
        });
      }, 700);
    };

    const applyStage = (stage: BrandIntelligenceStage | null) => {
      if (!stage) {
        setUiStep(0);
        setCompleteSteps([]);
        return "poll" as const;
      }

      if (PIPELINE_FAILED.includes(stage)) {
        setScanComplete(true);
        setCompleteSteps(INTELLIGENCE_STEPS.map((_, idx) => idx));
        setUiStep(INTELLIGENCE_STEPS.length);
        goToDna({
          intelligenceFailure: true,
          intelNotice: FAILURE_NOTICE,
        });
        return "done" as const;
      }

      if (
        stage === "STAGE_2_BRAND_DNA_ARCHIVED" ||
        stage === "CHECKPOINT_2_CONFIRMED"
      ) {
        setScanComplete(true);
        setCompleteSteps(INTELLIGENCE_STEPS.map((_, idx) => idx));
        setUiStep(INTELLIGENCE_STEPS.length);
        goToDna();
        return "done" as const;
      }

      const activeIndex = stageToUiIndex(stage);
      setUiStep(Math.min(activeIndex, INTELLIGENCE_STEPS.length));
      setCompleteSteps(
        Array.from({ length: Math.min(activeIndex, INTELLIGENCE_STEPS.length) }, (_, i) => i),
      );
      return "poll" as const;
    };

    const pollStatus = async () => {
      try {
        const status = await getIntelligenceStatus(leadId);
        if (cancelled) {
          return;
        }
        const mode = applyStage(status.currentStage);
        if (mode === "done" && pollId) {
          window.clearInterval(pollId);
          pollId = undefined;
        }
      } catch {
        // Status is best-effort; keep polling until a terminal stage.
      }
    };

    void pollStatus();
    pollId = window.setInterval(() => {
      void pollStatus();
    }, 2500);

    return () => {
      cancelled = true;
      if (pollId) {
        window.clearInterval(pollId);
      }
      if (navigateTimeout) {
        window.clearTimeout(navigateTimeout);
      }
    };
  }, [brandProfileId, brandUrl, leadId, navigate, scanMode]);

  const statusLine = error
    ? "We couldn’t finish brand intelligence."
    : scanComplete
      ? "Brand intelligence ready — opening Brand DNA."
      : "This usually takes a minute or two.";

  const errorActions = (
    <div className="bob-scan__error-actions">
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
    <nav className="bob-scan__steps" aria-label="Brand intelligence progress">
      {INTELLIGENCE_STEPS.map((step, index) => {
        const isDone = completeSteps.includes(index) || scanComplete;
        const isActive = !isDone && uiStep === index;
        const isPending = !isDone && index > uiStep;
        const overdueActive = !isDone && !isActive && !isPending && uiStep > index;
        const showActive = isActive || overdueActive;
        const subtext = isPending ? "Awaiting processing..." : step.subtext;

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
    <div className="bob-scan-visual bob-scan-visual--desktop" aria-label="Brand intelligence animation">
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
        <span className="bob-scan-trust__meta">Intelligence pipeline active</span>
      </div>
    </div>
  );

  const mobileOrb = (
    <div className="bob-scan-visual bob-scan-visual--mobile" aria-label="Brand intelligence animation">
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
            <h2 className="bob-scan__headline">Building brand intelligence</h2>
            <p className="bob-scan__status">{statusLine}</p>
            {error ? (
              <div className="bob-scan__error">
                <p>{error}</p>
                {errorActions}
              </div>
            ) : null}
          </div>

          <div className="bob-scan__intro bob-scan__intro--mobile">
            <p className="bob-scan__eyebrow">Intelligence in progress</p>
            <h1>
              Building brand intelligence
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
                We are building Brand DNA from public pages and your confirmed
                core identity. This is read-only.
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
