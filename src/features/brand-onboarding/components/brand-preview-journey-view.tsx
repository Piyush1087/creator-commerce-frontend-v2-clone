import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getBrandPreviewRuntime,
  isBrandPreviewRuntimeContractError,
  retryBrandPreviewRuntime,
} from "../api/brand-preview-client";
import type {
  BrandPreviewRuntimeProjection,
  BrandPreviewViewState,
} from "../contracts/brand-preview.contracts";
import { mapBrandPreviewRuntimeToViewState } from "../mappers/map-brand-preview-state";
import {
  clearBrandPreviewPendingSession,
  loadBrandOnboardingSession,
  loadBrandPreviewPendingSession,
  saveBrandOnboardingSession,
  saveBrandPreviewPendingSession,
} from "../session/onboarding-session";
import { ONBOARDING_ROUTES } from "../constants";
import { AnalysisRecoveryView } from "./analysis-recovery-view";
import { BrandPreviewView } from "./brand-preview-view";
import { FastBrandAnalysisView } from "./fast-brand-analysis-view";
import "../brand-preview.css";

type PreviewLocationState = {
  url?: string;
  leadId?: string;
};

const POLL_INTERVAL_MS = 1200;
const SLOW_ANALYSIS_THRESHOLD_MS = 8000;

function displayDomainFromUrl(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./i, "");
  } catch {
    return (
      value
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .split("/")[0] || "yourbrand.com"
    );
  }
}

export function BrandPreviewJourneyView() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as PreviewLocationState | undefined;
  const storedSession = useMemo(() => loadBrandOnboardingSession(), []);
  const pendingSession = useMemo(() => loadBrandPreviewPendingSession(), []);

  const leadId =
    locationState?.leadId ??
    pendingSession?.leadId ??
    storedSession?.leadId ??
    "";
  const normalizedUrl =
    locationState?.url ??
    pendingSession?.normalizedUrl ??
    storedSession?.normalizedUrl ??
    "";
  const initialDomain = normalizedUrl
    ? displayDomainFromUrl(normalizedUrl)
    : "yourbrand.com";

  const [viewState, setViewState] = useState<BrandPreviewViewState>({
    state: "FAST_ANALYSIS_ACTIVE",
    phase: null,
  });
  const [slow, setSlow] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [startingVerification, setStartingVerification] = useState(false);
  const [recoveringContractFailure, setRecoveringContractFailure] =
    useState(false);
  const pollTimerRef = useRef<number | null>(null);
  const slowTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const stopSlowTimer = useCallback(() => {
    if (slowTimerRef.current !== null) {
      window.clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
  }, []);

  const startSlowTimer = useCallback(() => {
    stopSlowTimer();
    setSlow(false);
    slowTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) setSlow(true);
    }, SLOW_ANALYSIS_THRESHOLD_MS);
  }, [stopSlowTimer]);

  const focusStateHeading = useCallback(
    (state: BrandPreviewViewState["state"]) => {
      const id =
        state === "PREVIEW_READY"
          ? "bp-preview-title"
          : state === "ANALYSIS_RECOVERABLE_FAILURE" ||
              state === "PREVIEW_NOT_READY"
            ? "bp-recovery-title"
            : "bp-analysis-title";
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.focus();
      });
    },
    [],
  );

  const applyProjection = useCallback(
    (projection: BrandPreviewRuntimeProjection) => {
      const mapped = mapBrandPreviewRuntimeToViewState(projection);
      setRecoveringContractFailure(false);
      setViewState(mapped);

      if (mapped.state === "FAST_ANALYSIS_ACTIVE") {
        return false;
      }

      stopPolling();
      stopSlowTimer();
      setSlow(false);

      if (mapped.state === "PREVIEW_READY") {
        saveBrandOnboardingSession({
          leadId,
          brandProfileId: mapped.brandProfileId,
          normalizedUrl: mapped.preview.identity.websiteUrl,
        });
        clearBrandPreviewPendingSession();
      }
      focusStateHeading(mapped.state);
      return true;
    },
    [focusStateHeading, leadId, stopPolling, stopSlowTimer],
  );

  const poll = useCallback(async () => {
    if (!leadId || !mountedRef.current) return;
    try {
      const projection = await getBrandPreviewRuntime(leadId);
      if (!mountedRef.current) return;
      const terminal = applyProjection(projection);
      if (!terminal) {
        pollTimerRef.current = window.setTimeout(() => {
          void poll();
        }, POLL_INTERVAL_MS);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      if (isBrandPreviewRuntimeContractError(error)) {
        stopPolling();
        stopSlowTimer();
        setSlow(false);
        setRecoveringContractFailure(true);
        setViewState({ state: "ANALYSIS_RECOVERABLE_FAILURE", canRetry: true });
        focusStateHeading("ANALYSIS_RECOVERABLE_FAILURE");
        return;
      }
      // Transport health is not Preview state authority. Retain the current
      // truthful analysis presentation and refetch instead of inventing a
      // terminal customer-facing state.
      pollTimerRef.current = window.setTimeout(() => {
        void poll();
      }, POLL_INTERVAL_MS * 2);
    }
  }, [applyProjection, focusStateHeading, leadId, stopPolling, stopSlowTimer]);

  useEffect(() => {
    mountedRef.current = true;
    if (!leadId) {
      navigate(ONBOARDING_ROUTES.landing, { replace: true });
      return () => {
        mountedRef.current = false;
      };
    }

    if (normalizedUrl) {
      saveBrandPreviewPendingSession({ leadId, normalizedUrl });
    }

    startSlowTimer();
    void poll();

    return () => {
      mountedRef.current = false;
      stopPolling();
      stopSlowTimer();
    };
  }, [
    leadId,
    navigate,
    normalizedUrl,
    poll,
    startSlowTimer,
    stopPolling,
    stopSlowTimer,
  ]);

  const handleRetry = async () => {
    if (!leadId || retrying) return;
    setRetrying(true);
    if (recoveringContractFailure) {
      setRecoveringContractFailure(false);
      setViewState({ state: "FAST_ANALYSIS_ACTIVE", phase: null });
      focusStateHeading("FAST_ANALYSIS_ACTIVE");
      startSlowTimer();
      await poll();
      if (mountedRef.current) setRetrying(false);
      return;
    }
    try {
      const projection = await retryBrandPreviewRuntime(leadId);
      if (!mountedRef.current) return;
      const terminal = applyProjection(projection);
      if (!terminal) {
        focusStateHeading("FAST_ANALYSIS_ACTIVE");
        startSlowTimer();
        pollTimerRef.current = window.setTimeout(() => {
          void poll();
        }, POLL_INTERVAL_MS);
      }
    } catch {
      // Keep the authoritative recovery state visible; do not substitute a
      // frontend-derived terminal state.
    } finally {
      if (mountedRef.current) setRetrying(false);
    }
  };

  const handleVerify = () => {
    if (viewState.state !== "PREVIEW_READY" || startingVerification) return;
    setStartingVerification(true);
    saveBrandOnboardingSession({
      leadId,
      brandProfileId: viewState.brandProfileId,
      normalizedUrl: viewState.preview.identity.websiteUrl,
    });
    clearBrandPreviewPendingSession();
    navigate(ONBOARDING_ROUTES.verification, {
      state: {
        url: viewState.preview.identity.websiteUrl,
        leadId,
        brandProfileId: viewState.brandProfileId,
      },
    });
  };

  if (viewState.state === "PREVIEW_READY") {
    return (
      <BrandPreviewView
        preview={viewState.preview}
        completeness={viewState.completeness}
        startingVerification={startingVerification}
        onVerify={handleVerify}
      />
    );
  }

  if (viewState.state === "ANALYSIS_RECOVERABLE_FAILURE") {
    return (
      <AnalysisRecoveryView
        kind="RECOVERABLE"
        displayDomain={initialDomain}
        canRetry
        retrying={retrying}
        onRetry={() => void handleRetry()}
      />
    );
  }

  if (viewState.state === "PREVIEW_NOT_READY") {
    return (
      <AnalysisRecoveryView
        kind="NOT_READY"
        displayDomain={initialDomain}
        canRetry={viewState.canRetry}
        retrying={retrying}
        onRetry={() => void handleRetry()}
      />
    );
  }

  return (
    <FastBrandAnalysisView
      displayDomain={initialDomain}
      phase={viewState.phase}
      slow={slow}
    />
  );
}
