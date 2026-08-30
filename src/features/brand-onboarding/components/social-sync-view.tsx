import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2,
  Image as ImageIcon,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import { Button, TextField } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import { env } from "../../../shared/config/env";
import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import { useAuthSession } from "../../../shared/auth/use-auth-session";
import { openInstagramOAuth } from "../../../shared/oauth/instagram-oauth";
import { InstagramConnectModal } from "./instagram-connect-modal";

const IG_CONNECTED_MESSAGE = "BRAND_INSTAGRAM_CONNECTED";
const IG_ERROR_MESSAGE = "BRAND_INSTAGRAM_ERROR";

type ConnectResult = {
  connected?: boolean;
  handle?: string;
  message?: string;
};

function isPopupCallback(): boolean {
  return Boolean(window.opener && window.opener !== window);
}

/**
 * Placeholder UI (no Stitch reference). Aurora-styled to match verification shell.
 * Instagram Login only during onboarding — Meta Business Suite is Settings-only.
 */
export function SocialSyncView() {
  const navigate = useNavigate();
  const auth = useAuthSession();
  const handledCodeRef = useRef(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [connectedHandle, setConnectedHandle] = useState<string | null>(null);

  const authHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    return headers;
  };

  const redirectUri = () =>
    `${window.location.origin}/brand/onboarding/social-sync`;

  const applyConnected = (handle: string) => {
    const normalized = handle.startsWith("@") ? handle : `@${handle}`;
    setConnectedHandle(normalized);
    setConnectModalOpen(false);
    setModalError(null);
    setMessage(`Instagram connected as ${normalized}.`);
    setError(null);
    window.history.replaceState({}, "", window.location.pathname);
  };

  const exchangeCode = async (code: string): Promise<ConnectResult> => {
    const res = await fetch(
      `${env.apiUrl}/api/v1/brand/social-sync/instagram/connect`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ code, redirectUri: redirectUri() }),
      },
    );
    const json = (await res.json()) as ConnectResult;
    if (!res.ok) {
      throw new Error(json.message || "Instagram connect failed.");
    }
    return json;
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const data = event.data as {
        type?: string;
        handle?: string;
        error?: string;
      };
      if (!data || typeof data !== "object") {
        return;
      }
      if (data.type === IG_CONNECTED_MESSAGE && data.handle) {
        applyConnected(data.handle);
        setBusy(false);
        return;
      }
      if (data.type === IG_ERROR_MESSAGE) {
        setModalError(data.error || "Instagram connect failed.");
        setBusy(false);
        setConnectModalOpen(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!auth.accessToken || handledCodeRef.current) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      return;
    }
    handledCodeRef.current = true;
    let cancelled = false;

    void (async () => {
      setBusy(true);
      setError(null);
      try {
        const json = await exchangeCode(code);
        const handle = json.handle || "@instagram";
        if (isPopupCallback()) {
          try {
            window.opener?.postMessage(
              { type: IG_CONNECTED_MESSAGE, handle },
              window.location.origin,
            );
          } catch {
            // Opener may be unavailable.
          }
          window.setTimeout(() => window.close(), 600);
          return;
        }
        if (!cancelled) {
          applyConnected(handle);
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Instagram connect failed.";
        if (isPopupCallback()) {
          try {
            window.opener?.postMessage(
              { type: IG_ERROR_MESSAGE, error: msg },
              window.location.origin,
            );
          } catch {
            // Opener may be unavailable.
          }
          window.setTimeout(() => window.close(), 900);
          return;
        }
        if (!cancelled) {
          setError(msg);
          setConnectModalOpen(true);
          setModalError(msg);
          window.history.replaceState({}, "", window.location.pathname);
        }
      } finally {
        if (!cancelled && !isPopupCallback()) {
          setBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when code is present
  }, [auth.accessToken]);

  const launchInstagramOauth = async () => {
    setModalError(null);
    setError(null);
    setMessage(null);
    if (!auth.accessToken) {
      setModalError(
        "Sign in / complete password verification before connecting Instagram.",
      );
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `${env.apiUrl}/api/v1/brand/social-sync/instagram/oauth-url?redirectUri=${encodeURIComponent(redirectUri())}`,
        { headers: authHeaders() },
      );
      const json = (await res.json()) as {
        url?: string;
        message?: string;
      };
      if (!res.ok || !json.url) {
        throw new Error(json.message || "Could not start Instagram OAuth.");
      }
      // Desktop opens a centered popup; mobile falls back to full-page redirect.
      openInstagramOAuth(json.url);
      // Allow dismissing the waiting modal if the user closes the popup.
      window.setTimeout(() => {
        setBusy(false);
      }, 1500);
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Instagram connect failed.",
      );
      setBusy(false);
    }
  };

  const confirmSkip = async () => {
    setError(null);
    setSkipConfirmOpen(false);
    if (!auth.accessToken) {
      navigate(AUTH_ROUTES.brandCentre);
      return;
    }
    setBusy(true);
    try {
      await fetch(`${env.apiUrl}/api/v1/brand/social-sync/skip`, {
        method: "POST",
        headers: authHeaders(),
      });
      navigate(AUTH_ROUTES.brandCentre);
    } catch {
      navigate(AUTH_ROUTES.brandCentre);
    } finally {
      setBusy(false);
    }
  };

  const sendInvite = async () => {
    setError(null);
    setMessage(null);
    if (!auth.accessToken) {
      setError("Sign in before inviting a teammate.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${env.apiUrl}/api/v1/brand/social-sync/invite`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const json = (await res.json()) as { sent?: boolean; message?: string };
      if (!res.ok) {
        throw new Error(json.message || "Invite failed.");
      }
      setMessage(
        "Secure integration link sent (check server logs in local/dev).",
      );
      setInviteEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bob-verify bob-verify--hide-nav bob-social-sync">
      <div className="bob-verify__split">
        <section
          className="bob-verify__left"
          aria-labelledby="social-sync-title"
        >
          <div className="bob-verify__left-inner bob-social-sync__left-inner">
            <header className="bob-social-sync__header">
              <h1 id="social-sync-title" className="bob-verify__title">
                Supercharge your Brand DNA
              </h1>
              <p className="bob-verify__lead bob-social-sync__lead">
                Connect your professional Instagram profile to unlock deep
                performance analytics and verify your ecosystem engagement
                metrics.
              </p>
            </header>

            <div
              className="bob-social-sync__permissions"
              aria-label="What you unlock"
            >
              <div className="bob-social-sync__permission">
                <BarChart2 size={22} aria-hidden />
                <div>
                  <h3>Profile Insights</h3>
                  <p>Verified reach, impressions, and audience growth maps.</p>
                </div>
              </div>
              <div className="bob-social-sync__permission">
                <ImageIcon size={22} aria-hidden />
                <div>
                  <h3>Media Reads</h3>
                  <p>Post performance, video views, and save rates.</p>
                </div>
              </div>
            </div>

            {connectedHandle ? (
              <div className="bob-inline-error" style={{ color: "inherit" }}>
                <CheckCircle2 size={16} aria-hidden />
                <span>
                  <strong>Connected:</strong> {connectedHandle}
                </span>
              </div>
            ) : null}

            {error ? (
              <div className="bob-inline-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : null}
            {message ? (
              <div className="bob-inline-error" style={{ color: "inherit" }}>
                <CheckCircle2 size={16} />
                <span>{message}</span>
              </div>
            ) : null}

            {connectedHandle ? (
              <Button
                type="button"
                variant="primary"
                className="bob-social-sync__connect"
                disabled={busy}
                onClick={() => navigate(AUTH_ROUTES.brandCentre)}
              >
                Continue to Brand Centre
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                className="bob-social-sync__connect"
                disabled={busy}
                onClick={() => {
                  setModalError(null);
                  setConnectModalOpen(true);
                }}
              >
                Connect Instagram Profile
              </Button>
            )}

            <div className="bob-stack" style={{ marginTop: "var(--space-lg)" }}>
              <h3 className="bob-verify__title" style={{ fontSize: "1rem" }}>
                Not the Instagram Account Manager?
              </h3>
              <p className="bob-verify__lead">
                Enter the email of the teammate who manages your Instagram
                professional credentials.
              </p>
              <TextField
                label="Colleague email"
                type="email"
                placeholder="colleague@anydomain.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={busy || !inviteEmail.trim()}
                onClick={() => void sendInvite()}
              >
                Send Secure Integration Link
              </Button>
            </div>

            <div className="bob-social-sync__footer">
              <button
                type="button"
                className="bob-link"
                disabled={busy || Boolean(connectedHandle)}
                onClick={() => setSkipConfirmOpen(true)}
              >
                Skip for now
              </button>
              <p className="bob-otp-helper">
                Instagram Login only during onboarding. Meta Business Suite can
                be added later in Settings → Integrations.
              </p>
            </div>
          </div>
        </section>

        {skipConfirmOpen ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="skip-sync-title"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "grid",
              placeItems: "center",
              zIndex: 50,
              padding: "1rem",
            }}
            onClick={() => setSkipConfirmOpen(false)}
          >
            <div
              style={{
                background: "var(--color-surface, #fff)",
                borderRadius: 12,
                maxWidth: 440,
                width: "100%",
                padding: "1.5rem",
                display: "grid",
                gap: "0.75rem",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="skip-sync-title"
                className="bob-verify__title"
                style={{ fontSize: "1.25rem" }}
              >
                Are you sure you want to skip integration?
              </h2>
              <p className="bob-verify__lead">
                Bypassing this step will limit your real-time performance
                tracking and fallback to historical public engagement estimates.
                You can connect later via your workspace account panel.
              </p>
              <div
                className="bob-inline"
                style={{ justifyContent: "flex-end", gap: "0.5rem" }}
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setSkipConfirmOpen(false)}
                >
                  Back to Sync
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy}
                  onClick={() => void confirmSkip()}
                >
                  Proceed anyway
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <section
          className="bob-verify__right bob-verify__right--desktop-only bob-social-sync__right"
          aria-label="Dashboard preview"
        >
          <div className="bob-social-sync__right-inner">
            <div className="bob-social-sync__pill">
              <Lock size={14} aria-hidden />
              Instagram API Synchronization Pipeline Active
            </div>

            <h2 className="bob-social-sync__preview-title">
              Dashboard Sneak-Peek
            </h2>

            <div className="bob-social-sync__preview-panel">
              <div className="bob-social-sync__preview-window">
                <div className="bob-social-sync__dots" aria-hidden>
                  <span />
                  <span />
                  <span />
                </div>
                <div className="bob-social-sync__window-label">
                  Global Analytics v5.0
                </div>
              </div>

              <div className="bob-social-sync__preview-grid">
                <div className="bob-social-sync__preview-col">
                  <p className="bob-social-sync__col-label bob-social-sync__col-label--muted">
                    Estimated Engagement
                  </p>
                  <div className="bob-social-sync__blur-card" aria-hidden>
                    <span />
                    <span />
                    <span />
                    <strong>2.4%</strong>
                  </div>
                </div>

                <div className="bob-social-sync__preview-col">
                  <p className="bob-social-sync__col-label bob-social-sync__col-label--live">
                    Verified API Data
                  </p>
                  <div className="bob-social-sync__live-card">
                    <div className="bob-social-sync__live-head">
                      <div>
                        <span>Accuracy Score</span>
                        <strong>Match: 98%</strong>
                      </div>
                      <ShieldCheck size={20} aria-hidden />
                    </div>
                    <div className="bob-social-sync__mini-bars" aria-hidden>
                      <span style={{ height: "35%" }} />
                      <span style={{ height: "60%" }} />
                      <span style={{ height: "50%" }} />
                      <span
                        className="bob-social-sync__mini-bars--peak"
                        style={{ height: "95%" }}
                      />
                      <span style={{ height: "70%" }} />
                    </div>
                    <div className="bob-social-sync__live-feed">
                      <span>Real-time feed</span>
                      <span>
                        <i aria-hidden /> Live
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bob-social-sync__preview-meta">
                <div>
                  <p>Current Data Source</p>
                  <strong>Meta API Connection</strong>
                </div>
                <div>
                  <p>Latency</p>
                  <strong className="bob-social-sync__latency">
                    Real-time (0.4ms)
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <InstagramConnectModal
        open={connectModalOpen}
        busy={busy && !connectedHandle}
        error={modalError}
        onClose={() => {
          setConnectModalOpen(false);
          setModalError(null);
          setBusy(false);
        }}
        onContinue={() => void launchInstagramOauth()}
      />
    </div>
  );
}
