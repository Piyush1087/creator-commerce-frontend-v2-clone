import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Alert, Badge, Button, Card, useToast } from "../../../design-system/aurora";
import {
  connectCreatorMeta,
  fetchInstagramOAuthUrl,
  isApiRequestError,
} from "../api/creator-onboarding-client";
import { CREATOR_ONBOARDING_ROUTES } from "../constants";
import {
  getOnboardingHandle,
  getOnboardingTrackId,
  markInstagramConnectSkipped,
} from "../utils/onboarding-session";
import { displayValue } from "../../creator-campaigns/utils/display-value";
import { env } from "../../../shared/config/env";
import {
  clearInstagramOAuthFlow,
  openInstagramOAuth,
  removeInstagramOAuthState,
  setInstagramOAuthFlow,
  storeInstagramOAuthState,
  validateInstagramOAuthState,
} from "../../../shared/oauth/instagram-oauth";

import "../creator-onboarding.css";

type ConnectPhase = "briefing" | "handshake" | "connected";

function isPopupCallback(): boolean {
  return Boolean(window.opener && window.opener !== window);
}

export function CreatorMetaConnectView() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [phase, setPhase] = useState<ConnectPhase>("briefing");
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<{
    username: string;
    accountType: string;
    followersCount: number;
  } | null>(null);
  const handledCodeRef = useRef(false);

  const trackId = getOnboardingTrackId();
  const handle = getOnboardingHandle();
  const appOrigin = env.publicAppUrl || window.location.origin;
  const redirectUri = `${appOrigin}${CREATOR_ONBOARDING_ROUTES.instagramCallback}`;

  const notifyOpener = useCallback((payload: { type: string; error?: string }) => {
    if (!window.opener) {
      return;
    }
    try {
      window.opener.postMessage(payload, window.location.origin);
    } catch {
      // Opener may be on a different origin in misconfigured environments.
    }
  }, []);

  const finishConnectSuccess = useCallback(
    (instagram: { username: string; accountType: string; followersCount: number }) => {
      setConnected(instagram);
      setPhase("connected");
      removeInstagramOAuthState();
      clearInstagramOAuthFlow();

      if (isPopupCallback()) {
        notifyOpener({ type: "CREATOR_INSTAGRAM_CONNECTED" });
        toast.push({
          tone: "success",
          title: "Instagram connected",
          message: `@${instagram.username} is linked to your workspace.`,
          ttlMs: 5000,
        });
        window.setTimeout(() => window.close(), 800);
        return;
      }

      toast.push({
        tone: "success",
        title: "Instagram connected",
        message: `@${instagram.username} is linked. Starting workspace sync…`,
        ttlMs: 5000,
      });
      navigate(CREATOR_ONBOARDING_ROUTES.sync);
    },
    [navigate, notifyOpener, toast],
  );

  const finishConnectError = useCallback(
    (message: string) => {
      setPhase("briefing");
      setError(message);
      removeInstagramOAuthState();
      clearInstagramOAuthFlow();

      if (isPopupCallback()) {
        notifyOpener({ type: "CREATOR_INSTAGRAM_ERROR", error: message });
        window.setTimeout(() => window.close(), 1200);
        return;
      }

      toast.push({
        tone: "error",
        title: "Instagram connection failed",
        message,
        ttlMs: 7000,
      });
    },
    [notifyOpener, toast],
  );

  const runConnect = useCallback(
    async (code: string) => {
      if (!trackId) {
        navigate(CREATOR_ONBOARDING_ROUTES.landing);
        return;
      }
      setPhase("handshake");
      setError(null);
      try {
        const result = await connectCreatorMeta({
          onboardingTrackId: trackId,
          code,
          redirectUri,
        });
        finishConnectSuccess(result.instagram);
      } catch (err) {
        const message = isApiRequestError(err)
          ? err.code === "PERSONAL_ACCOUNT"
            ? "Personal Instagram accounts cannot connect. Switch to Creator or Business mode, then try again."
            : err.message
          : err instanceof Error
            ? err.message
            : "Instagram connect failed.";
        finishConnectError(message);
      }
    },
    [finishConnectError, finishConnectSuccess, navigate, redirectUri, trackId],
  );

  useEffect(() => {
    if (handledCodeRef.current) {
      return;
    }

    const oauthError = searchParams.get("error");
    const oauthErrorDescription = searchParams.get("error_description");
    if (oauthError) {
      handledCodeRef.current = true;
      setSearchParams({}, { replace: true });
      finishConnectError(oauthErrorDescription ?? oauthError);
      return;
    }

    const codeFromUrl = searchParams.get("code");
    const stateFromUrl = searchParams.get("state");
    if (!codeFromUrl) {
      return;
    }

    if (!validateInstagramOAuthState(stateFromUrl)) {
      handledCodeRef.current = true;
      setSearchParams({}, { replace: true });
      finishConnectError(
        "OAuth session expired or was interrupted. Please try connecting again.",
      );
      return;
    }

    handledCodeRef.current = true;
    setSearchParams({}, { replace: true });
    void runConnect(codeFromUrl);
  }, [finishConnectError, runConnect, searchParams, setSearchParams]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === "CREATOR_INSTAGRAM_CONNECTED") {
        toast.push({
          tone: "success",
          title: "Instagram connected",
          message: "Starting workspace sync…",
          ttlMs: 5000,
        });
        navigate(CREATOR_ONBOARDING_ROUTES.sync);
      }
      if (event.data?.type === "CREATOR_INSTAGRAM_ERROR") {
        const message =
          typeof event.data.error === "string"
            ? event.data.error
            : "Instagram connection failed.";
        setError(message);
        toast.push({
          tone: "error",
          title: "Instagram connection failed",
          message,
          ttlMs: 7000,
        });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate, toast]);

  const onLaunchOAuth = async () => {
    setLaunching(true);
    setError(null);
    try {
      removeInstagramOAuthState();
      setInstagramOAuthFlow("onboarding");
      const { url, state } = await fetchInstagramOAuthUrl(redirectUri);
      storeInstagramOAuthState(state);
      openInstagramOAuth(url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start Instagram authorization.";
      setError(message);
      toast.push({
        tone: "error",
        title: "Instagram OAuth unavailable",
        message,
        ttlMs: 7000,
      });
    } finally {
      setLaunching(false);
    }
  };

  const onSkip = () => {
    markInstagramConnectSkipped();
    toast.push({
      tone: "info",
      title: "Instagram skipped",
      message: "We'll build your workspace shell. Connect Instagram later for live metrics.",
      ttlMs: 6000,
    });
    navigate(CREATOR_ONBOARDING_ROUTES.sync);
  };

  if (phase === "handshake") {
    return (
      <div className="cob-page cob-connect-layout">
        <Card className="cob-modal-panel cob-connect-card">
          <span className="cob-badge">Meta Graph API secure handshake</span>
          <h1 className="cob-connect-title">Verifying your Instagram connection…</h1>
          <p className="cob-muted">
            Reading authorization tokens and verifying your professional profile.
          </p>
          <ul className="cob-handshake-list cob-muted">
            <li>Token handshake initialized with Meta.</li>
            <li>Querying linked Creator or Business profiles…</li>
          </ul>
        </Card>
      </div>
    );
  }

  return (
    <div className="cob-page cob-connect-layout">
      <Card className="cob-modal-panel cob-connect-card">
        {connected ? (
          <div className="cob-connect-badge-row">
            <Badge tone="success">Instagram Connected</Badge>
          </div>
        ) : (
          <span className="cob-badge">Data privacy protocol · Official Meta API</span>
        )}

        <h1 className="cob-connect-title">Before connecting: how we protect your account</h1>
        <p className="cob-muted">
          The Creator Shop routes authorization through Meta&apos;s secure infrastructure. We only
          request read-only access to public metrics. Handle from eligibility:{" "}
          <strong>{displayValue(handle)}</strong>
        </p>

        <div className="cob-trust-grid">
          <div className="cob-trust-item">
            <strong>We never see your password</strong>
            <p className="cob-muted">Authentication happens entirely on Meta&apos;s servers.</p>
          </div>
          <div className="cob-trust-item">
            <strong>Read-only access</strong>
            <p className="cob-muted">We cannot post, delete, or send messages on your behalf.</p>
          </div>
          <div className="cob-trust-item">
            <strong>You stay in control</strong>
            <p className="cob-muted">Revoke access anytime from dashboard settings.</p>
          </div>
        </div>

        {error ? (
          <div className="cob-connect-alert">
            <Alert tone="error" title="Connection issue">
              {error}
            </Alert>
          </div>
        ) : null}

        {connected ? (
          <div className="cob-account-card cob-account-card--selected">
            <span>
              <strong>@{connected.username}</strong>
              <span className="cob-muted cob-account-meta">
                {displayValue(connected.accountType)} · {connected.followersCount} followers
              </span>
            </span>
          </div>
        ) : (
          <div className="cob-form-actions">
            <Button variant="primary" onClick={() => void onLaunchOAuth()} disabled={launching}>
              {launching ? "Opening Meta…" : "Connect with Instagram"}
            </Button>
            <p className="cob-muted cob-connect-footnote">
              Multi-account picker: {displayValue("-")} (single connected account today)
            </p>
          </div>
        )}

        <div className="cob-form-actions cob-connect-actions">
          {connected ? (
            <Button variant="primary" onClick={() => navigate(CREATOR_ONBOARDING_ROUTES.sync)}>
              Continue to workspace sync
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onSkip}>
            Skip for now — build workspace without Instagram
          </Button>
        </div>
      </Card>
    </div>
  );
}
