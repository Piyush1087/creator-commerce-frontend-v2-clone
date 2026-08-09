import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, Button, Card, ProgressBar } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import {
  activateCreatorSync,
  fetchOnboardingTrack,
} from "../api/creator-onboarding-client";
import { WORKSPACE_BUILD_STEPS } from "../mock-data/onboarding-mock";
import { getOnboardingTrackId, isInstagramConnectSkipped } from "../utils/onboarding-session";
import { displayValue } from "../../creator-campaigns/utils/display-value";

import "../creator-onboarding.css";

function progressForStatus(status: string | undefined): number {
  switch (status) {
    case "META_OAUTH_SUCCESS":
      return 35;
    case "AI_ENGINE_SYNCED":
      return 100;
    default:
      return 60;
  }
}

export function CreatorWorkspaceBuildingView() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(10);
  const [trackStatus, setTrackStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activatedRef = useRef(false);

  useEffect(() => {
    const trackId = getOnboardingTrackId();
    if (!trackId) {
      navigate(AUTH_ROUTES.creatorHome);
      return;
    }

    let cancelled = false;

    if (!activatedRef.current) {
      activatedRef.current = true;
      const skippedIg = isInstagramConnectSkipped();
      void activateCreatorSync(trackId, { skipInstagramConnect: skippedIg }).catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Sync activation failed.");
        }
      });
    }

    const poll = window.setInterval(() => {
      void fetchOnboardingTrack(trackId)
        .then((track) => {
          if (cancelled) return;
          setTrackStatus(track.status);
          setProgress(progressForStatus(track.status));
          if (track.status === "AI_ENGINE_SYNCED") {
            window.clearInterval(poll);
            window.setTimeout(() => navigate(AUTH_ROUTES.creatorHome), 1200);
          }
        })
        .catch(() => {
          if (!cancelled) setTrackStatus(null);
        });
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [navigate]);

  return (
    <div className="cob-page cob-sync-layout">
      <div>
        <h1 style={{ fontFamily: "var(--font-heading)", margin: "0 0 8px" }}>
          We&apos;re building your <em style={{ color: "var(--primary)" }}>creator workspace.</em>
        </h1>
        <p className="cob-muted">
          {isInstagramConnectSkipped()
            ? "Building your workspace shell without Instagram data. Connect later in settings for live metrics."
            : "Syncing Instagram insights into your command center."}
        </p>
        <p className="cob-muted" style={{ fontSize: 12 }}>
          Track status: {displayValue(trackStatus)}
        </p>
        {error ? (
          <div style={{ marginTop: 12 }}>
            <Alert tone="error" title="Workspace sync">
              {error}
            </Alert>
          </div>
        ) : null}
        <ol className="cob-step-list">
          {WORKSPACE_BUILD_STEPS.map((step) => (
            <li key={step.id} className={`cob-step cob-step--${step.state}`}>
              <span className="cob-step__dot" aria-hidden />
              <span>
                <strong>{step.label}</strong>
                <span className="cob-muted" style={{ display: "block", fontSize: 12 }}>
                  {step.state === "done"
                    ? "Completed"
                    : step.state === "active"
                      ? "In progress"
                      : "Pending"}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <p className="cob-muted" style={{ fontSize: 12 }}>
          Theme picker during sync: {displayValue("-")}
        </p>
      </div>

      <Card className="cob-insight-card">
        <p className="cob-muted" style={{ fontSize: 12, marginBottom: 8 }}>
          AI Insight Preview
        </p>
        <p style={{ margin: "0 0 16px", fontWeight: 600 }}>{displayValue("-")}</p>
        <ProgressBar value={progress} label="Workspace sync" />
        <p className="cob-muted" style={{ marginTop: 12 }}>
          {progress < 100 ? "Syncing data…" : "Workspace ready — opening home"}
        </p>
        {progress >= 100 ? (
          <Button
            variant="primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate(AUTH_ROUTES.creatorHome)}
          >
            Open Command Center
          </Button>
        ) : null}
      </Card>
    </div>
  );
}
