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
import { useAuthSession } from "../../../shared/auth/use-auth-session";
import { openInstagramOAuth } from "../../../shared/oauth/instagram-oauth";
import { fetchBrandGeneralSettings } from "../../settings/api/brand-settings-client";
import {
  connectInstagram,
  fetchInstagramIntegrations,
  getInstagramOAuthUrl,
} from "../../settings/api/instagram-integrations-client";
import {
  INSTAGRAM_AUTHORIZATION_HEALTH,
  type InstagramAuthorizationHealth,
  type InstagramIntegrationRow,
} from "../../settings/contracts/instagram-integrations.contracts";
import {
  callbackScrubbedPath,
  friendlyInstagramError,
  parseInstagramCallback,
} from "../../settings/utils/instagram-integration-state";
import {
  connectInvitedInstagram,
  inviteBrandSocialSyncTeammate,
  skipBrandSocialSync,
  startInvitedInstagramOAuth,
} from "../api/brand-social-sync-client";
import { InstagramConnectModal } from "./instagram-connect-modal";

const IG_CONNECTED_MESSAGE = "BRAND_INSTAGRAM_CONNECTED";
const IG_ERROR_MESSAGE = "BRAND_INSTAGRAM_ERROR";

type ConnectedInstagram = {
  handle: string;
  authorizationHealth: InstagramAuthorizationHealth;
};

function isAuthorizationHealth(
  value: unknown,
): value is InstagramAuthorizationHealth {
  return (
    typeof value === "string" &&
    INSTAGRAM_AUTHORIZATION_HEALTH.includes(
      value as InstagramAuthorizationHealth,
    )
  );
}

function onboardingConnectionMessage(
  result: ConnectedInstagram,
  normalizedHandle: string,
): string {
  if (result.authorizationHealth === "CONNECTED_FULL") {
    return `Instagram connected as ${normalizedHandle}.`;
  }
  if (result.authorizationHealth === "PARTIALLY_CONNECTED") {
    return `Instagram connected as ${normalizedHandle}. Profile access is active; Insights are limited.`;
  }
  if (result.authorizationHealth === "NEEDS_REVALIDATION") {
    return `Instagram authorized as ${normalizedHandle}, but permission evidence needs revalidation in Settings.`;
  }
  if (result.authorizationHealth === "PROVIDER_ACCESS_BLOCKED") {
    return `Instagram authorized as ${normalizedHandle}, but provider access is temporarily unavailable.`;
  }
  if (result.authorizationHealth === "UNKNOWN") {
    return `Instagram authorized as ${normalizedHandle}, but its current connection status is uncertain.`;
  }
  return `Instagram authorization for ${normalizedHandle} is disconnected. Review the connection in Settings.`;
}

function isPopupCallback(): boolean {
  return Boolean(window.opener && window.opener !== window);
}

/**
 * Aurora-styled onboarding shell using the same state-bound Instagram authority as Settings.
 * Delegated invitation links retain their separate backend-bound public state contract.
 */
export function SocialSyncView() {
  const navigate = useNavigate();
  const auth = useAuthSession();
  const initialParamsRef = useRef<URLSearchParams | null>(null);
  if (initialParamsRef.current === null) {
    initialParamsRef.current = new URLSearchParams(window.location.search);
  }
  const initialParams = initialParamsRef.current;
  const callback = useRef(parseInstagramCallback(initialParams)).current;
  const exchangeRequestRef = useRef<Promise<ConnectedInstagram> | null>(null);
  const invitationToken =
    initialParams.get("context") === "agent"
      ? initialParams.get("token")
      : null;
  const isInvitationFlow = initialParams.get("context") === "agent";

  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [connected, setConnected] = useState<ConnectedInstagram | null>(null);
  const [currentIntegration, setCurrentIntegration] =
    useState<InstagramIntegrationRow | null>(null);
  const [currentRole, setCurrentRole] = useState<
    "BRAND_OWNER" | "CAMPAIGN_MANAGER" | "FINANCE_ADMIN" | null
  >(null);

  const redirectUri = (() => {
    const url = new URL(
      "/brand/onboarding/social-sync",
      window.location.origin,
    );
    if (isInvitationFlow && invitationToken) {
      url.searchParams.set("context", "agent");
      url.searchParams.set("token", invitationToken);
    }
    return url.toString();
  })();

  const applyConnected = (result: ConnectedInstagram) => {
    const handle = result.handle;
    const normalized = handle.startsWith("@") ? handle : `@${handle}`;
    setConnected({ ...result, handle: normalized });
    setConnectModalOpen(false);
    setModalError(null);
    setMessage(null);
    setError(null);
  };

  const reloadCanonicalState = async () => {
    if (isInvitationFlow || !auth.accessToken) return;
    const [general, integrations] = await Promise.all([
      fetchBrandGeneralSettings(),
      fetchInstagramIntegrations(),
    ]);
    setCurrentRole(general.current_user_role);
    setCurrentIntegration(integrations.instagram);
    const row = integrations.instagram;
    if (row?.currentProviderDisplayIdentity) {
      applyConnected({
        handle: row.currentProviderDisplayIdentity,
        authorizationHealth: row.authorizationHealth,
      });
    }
  };

  useEffect(() => {
    if (callback.kind !== "none") {
      window.history.replaceState(
        window.history.state,
        "",
        callbackScrubbedPath(window.location.href),
      );
    }
  }, [callback.kind]);

  useEffect(() => {
    if (isInvitationFlow || !auth.accessToken || callback.kind === "ready")
      return;
    let active = true;
    void reloadCanonicalState().catch((loadError: unknown) => {
      if (active) setError(friendlyInstagramError(loadError));
    });
    return () => {
      active = false;
    };
    // auth token is the only external authority that changes during this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.accessToken, callback.kind, isInvitationFlow]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const data = event.data as {
        type?: string;
        handle?: string;
        authorizationHealth?: InstagramAuthorizationHealth;
        error?: string;
      };
      if (!data || typeof data !== "object") {
        return;
      }
      if (
        data.type === IG_CONNECTED_MESSAGE &&
        data.handle &&
        isAuthorizationHealth(data.authorizationHealth)
      ) {
        applyConnected({
          handle: data.handle,
          authorizationHealth: data.authorizationHealth,
        });
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
    if (callback.kind === "none") return;
    if (callback.kind === "error") {
      setError(callback.message);
      setModalError(callback.message);
      if (!isInvitationFlow) setConnectModalOpen(true);
      return;
    }
    if (!isInvitationFlow && !auth.accessToken) return;
    if (isInvitationFlow && !invitationToken) {
      setError("This secure Instagram invitation link is incomplete.");
      return;
    }
    let cancelled = false;

    if (!exchangeRequestRef.current) {
      exchangeRequestRef.current = isInvitationFlow
        ? connectInvitedInstagram({
            token: invitationToken!,
            code: callback.code,
            state: callback.state,
            redirectUri,
          }).then(
            (invited): ConnectedInstagram => ({
              handle: invited.handle,
              authorizationHealth:
                invited.status === "CONNECTED"
                  ? "CONNECTED_FULL"
                  : "PARTIALLY_CONNECTED",
            }),
          )
        : connectInstagram({
            code: callback.code,
            state: callback.state,
            redirectUri,
          }).then((response): ConnectedInstagram => {
            if (response.conflict) {
              throw new Error(
                "A different Instagram account was selected. Complete the account change in Settings as Brand Owner.",
              );
            }
            return {
              handle: response.handle,
              authorizationHealth: response.authorizationHealth,
            };
          });
    }
    const request = exchangeRequestRef.current;
    void (async () => {
      setBusy(true);
      setError(null);
      try {
        const result = await request;
        if (cancelled) return;
        if (isInvitationFlow) {
          const scrubbed = new URL(window.location.href);
          scrubbed.searchParams.delete("token");
          window.history.replaceState(
            window.history.state,
            "",
            `${scrubbed.pathname}${scrubbed.search}${scrubbed.hash}`,
          );
        }
        if (isPopupCallback()) {
          try {
            window.opener?.postMessage(
              {
                type: IG_CONNECTED_MESSAGE,
                handle: result.handle,
                authorizationHealth: result.authorizationHealth,
              },
              window.location.origin,
            );
          } catch {
            // Opener may be unavailable.
          }
          window.setTimeout(() => window.close(), 600);
          return;
        }
        applyConnected(result);
      } catch (exchangeError) {
        if (cancelled) return;
        const msg = friendlyInstagramError(exchangeError);
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
        setError(msg);
        if (!isInvitationFlow) setConnectModalOpen(true);
        setModalError(msg);
        if (!isInvitationFlow && auth.accessToken) {
          void reloadCanonicalState().catch(() => undefined);
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
    // Callback and redirect URI are immutable for this page load; the request ref prevents StrictMode replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.accessToken, callback, invitationToken, isInvitationFlow]);

  const launchInstagramOauth = async () => {
    setModalError(null);
    setError(null);
    setMessage(null);
    if (isInvitationFlow && !invitationToken) {
      setModalError("This secure Instagram invitation link is incomplete.");
      return;
    }
    if (!isInvitationFlow && !auth.accessToken) {
      setModalError(
        "Sign in / complete password verification before connecting Instagram.",
      );
      return;
    }
    if (!isInvitationFlow && currentRole !== "BRAND_OWNER") {
      setModalError(
        "Only the Brand Owner can connect Instagram during onboarding.",
      );
      return;
    }
    setBusy(true);
    try {
      if (
        !isInvitationFlow &&
        currentIntegration &&
        !currentIntegration.providerAccountId
      ) {
        throw new Error(
          "The Brand Owner must reconcile this legacy Instagram identity in Settings.",
        );
      }
      const oauth = isInvitationFlow
        ? await startInvitedInstagramOAuth(invitationToken!, redirectUri)
        : await getInstagramOAuthUrl(
            redirectUri,
            currentIntegration ? "RECONNECT" : "INITIAL_CONNECT",
          );
      // Desktop opens a centered popup; mobile falls back to full-page redirect.
      openInstagramOAuth(oauth.url);
      // Allow dismissing the waiting modal if the user closes the popup.
      window.setTimeout(() => {
        setBusy(false);
      }, 1500);
    } catch (launchError) {
      setModalError(friendlyInstagramError(launchError));
      setBusy(false);
    }
  };

  const confirmSkip = async () => {
    setError(null);
    setSkipConfirmOpen(false);
    if (isInvitationFlow || !auth.accessToken) {
      navigate(AUTH_ROUTES.brandCentre);
      return;
    }
    setBusy(true);
    try {
      await skipBrandSocialSync();
      navigate(AUTH_ROUTES.brandCentre);
    } catch (skipError) {
      setError(friendlyInstagramError(skipError));
    } finally {
      setBusy(false);
    }
  };

  const sendInvite = async () => {
    setError(null);
    setMessage(null);
    if (isInvitationFlow || !auth.accessToken) {
      setError("Sign in before inviting a teammate.");
      return;
    }
    setBusy(true);
    try {
      await inviteBrandSocialSyncTeammate(inviteEmail.trim());
      setMessage(
        "Secure integration link sent (check server logs in local/dev).",
      );
      setInviteEmail("");
    } catch (inviteError) {
      setError(friendlyInstagramError(inviteError));
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

            {connected ? (
              <div
                className="bob-inline-error"
                style={{ color: "inherit" }}
                role="status"
              >
                <CheckCircle2 size={16} aria-hidden />
                <span>
                  <strong>
                    {connected.authorizationHealth === "CONNECTED_FULL"
                      ? "Connected:"
                      : connected.authorizationHealth === "PARTIALLY_CONNECTED"
                        ? "Connected with limited access:"
                        : "Authorization status:"}
                  </strong>{" "}
                  {connected.handle}
                  <span style={{ display: "block", marginTop: "0.25rem" }}>
                    {onboardingConnectionMessage(connected, connected.handle)}
                  </span>
                </span>
              </div>
            ) : null}

            {error ? (
              <div className="bob-inline-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : null}
            {message ? (
              <div
                className="bob-inline-error"
                style={{ color: "inherit" }}
                role="status"
              >
                <CheckCircle2 size={16} />
                <span>{message}</span>
              </div>
            ) : null}

            {connected ? (
              <Button
                type="button"
                variant="primary"
                className="bob-social-sync__connect"
                disabled={busy}
                onClick={() => {
                  if (isInvitationFlow) window.close();
                  else navigate(AUTH_ROUTES.brandCentre);
                }}
              >
                {isInvitationFlow
                  ? "Close this page"
                  : "Continue to Brand Centre"}
              </Button>
            ) : !isInvitationFlow &&
              currentRole &&
              currentRole !== "BRAND_OWNER" ? (
              <p className="bob-inline-error" role="status">
                <Lock size={16} aria-hidden />
                Only the Brand Owner can make the initial Instagram connection.
              </p>
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

            {!isInvitationFlow ? (
              <>
                <div
                  className="bob-stack"
                  style={{ marginTop: "var(--space-lg)" }}
                >
                  <h3
                    className="bob-verify__title"
                    style={{ fontSize: "1rem" }}
                  >
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
                    disabled={busy || Boolean(connected)}
                    onClick={() => setSkipConfirmOpen(true)}
                  >
                    Skip for now
                  </button>
                  <p className="bob-otp-helper">
                    Instagram is optional during onboarding. Manage the
                    first-party connection later in Settings → Integrations.
                  </p>
                </div>
              </>
            ) : null}
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
        busy={busy && !connected}
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
