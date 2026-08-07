import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2,
  Image as ImageIcon,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Button, TextField } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import { env } from "../../../shared/config/env";
import { loadAuthSession } from "../../../shared/auth/auth-session";
/**
 * Placeholder UI (no Stitch reference). Aurora-styled to match verification shell.
 * Instagram Login only during onboarding — Meta Business Suite is Settings-only.
 */
export function SocialSyncView() {
  const navigate = useNavigate();
  const auth = loadAuthSession();

  const [finalizedHandle, setFinalizedHandle] = useState("@yourbrand");
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);

  const authHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (auth?.accessToken) {
      headers.Authorization = `Bearer ${auth.accessToken}`;
    }
    return headers;
  };

  const redirectUri = () =>
    `${window.location.origin}/brand/onboarding/social-sync`;

  useEffect(() => {
    if (!auth?.accessToken) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `${env.apiUrl}/api/v1/brand/social-sync/instagram/oauth-url?redirectUri=${encodeURIComponent(redirectUri())}`,
          { headers: authHeaders() },
        );
        const json = (await res.json()) as {
          finalizedHandle?: string;
          message?: string;
        };
        if (!cancelled && res.ok && json.finalizedHandle) {
          setFinalizedHandle(`@${json.finalizedHandle.replace(/^@/, "")}`);
        }
      } catch {
        // Keep placeholder handle when profile has no finalized IG yet.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount with session token
  }, [auth?.accessToken]);

  useEffect(() => {
    if (!auth?.accessToken) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      return;
    }
    let cancelled = false;
    void (async () => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(
          `${env.apiUrl}/api/v1/brand/social-sync/instagram/connect`,
          {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ code, redirectUri: redirectUri() }),
          },
        );
        const json = (await res.json()) as { connected?: boolean; message?: string };
        if (!res.ok) {
          throw new Error(json.message || "Instagram connect failed.");
        }
        if (!cancelled) {
          window.history.replaceState({}, "", window.location.pathname);
          setMessage("Instagram connected. Redirecting to Brand Centre…");
          navigate(AUTH_ROUTES.brandCentre);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Instagram connect failed.",
          );
        }
      } finally {
        if (!cancelled) {
          setBusy(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.accessToken]);

  const connectInstagram = async () => {
    setError(null);
    setMessage(null);
    if (!auth?.accessToken) {
      setError(
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
        finalizedHandle?: string;
        message?: string;
      };
      if (!res.ok || !json.url) {
        throw new Error(json.message || "Could not start Instagram OAuth.");
      }
      if (json.finalizedHandle) {
        setFinalizedHandle(`@${json.finalizedHandle.replace(/^@/, "")}`);
      }
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Instagram connect failed.");
    } finally {
      setBusy(false);
    }
  };

  const confirmSkip = async () => {
    setError(null);
    setSkipConfirmOpen(false);
    if (!auth?.accessToken) {
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
    if (!auth?.accessToken) {
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
      setMessage("Secure integration link sent (check server logs in local/dev).");
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
        <section className="bob-verify__left" aria-labelledby="social-sync-title">
          <div className="bob-verify__left-inner bob-social-sync__left-inner">
            <header className="bob-social-sync__header">
              <h1 id="social-sync-title" className="bob-verify__title">
                Supercharge your Brand DNA
              </h1>
              <p className="bob-verify__lead bob-social-sync__lead">
                Connect your professional Instagram profile to unlock deep performance analytics
                and verify your ecosystem engagement metrics.
              </p>
            </header>

            <div className="bob-social-sync__permissions" aria-label="What you unlock">
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

            <div
              className="bob-inline-error"
              style={{
                background: "var(--color-surface-muted, #f9fafb)",
                border: "1px solid var(--color-border, #e5e7eb)",
                color: "inherit",
              }}
            >
              <Lock size={16} aria-hidden />
              <span>
                <strong>System Target Profile: {finalizedHandle}</strong>
                <br />
                Handle finalized upstream. Log into this exact Instagram profile during auth.
              </span>
            </div>

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

            <Button
              type="button"
              variant="primary"
              className="bob-social-sync__connect"
              disabled={busy}
              onClick={() => void connectInstagram()}
            >
              Connect Instagram Profile
            </Button>

            <div className="bob-stack" style={{ marginTop: "var(--space-lg)" }}>
              <h3 className="bob-verify__title" style={{ fontSize: "1rem" }}>
                Not the Instagram Account Manager?
              </h3>
              <p className="bob-verify__lead">
                Enter the email of the teammate who manages your Instagram professional credentials.
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
                disabled={busy}
                onClick={() => setSkipConfirmOpen(true)}
              >
                Skip for now
              </button>
              <p className="bob-otp-helper">
                Instagram Login only during onboarding. Meta Business Suite can be added later in
                Settings → Integrations.
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
              <h2 id="skip-sync-title" className="bob-verify__title" style={{ fontSize: "1.25rem" }}>
                Are you sure you want to skip integration?
              </h2>
              <p className="bob-verify__lead">
                Bypassing this step will limit your real-time performance tracking and fallback to
                historical public engagement estimates. You can connect later via your workspace
                account panel.
              </p>
              <div className="bob-inline" style={{ justifyContent: "flex-end", gap: "0.5rem" }}>
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

        <aside className="bob-verify__right" aria-hidden>
          <div className="bob-verify__preview">
            <p className="bob-verify__preview-badge">Instagram API Synchronization Pipeline Active</p>
            <div className="bob-verify__preview-card">
              <p>Before: Estimated Engagement 2.4%</p>
              <p>After: Verified Reach · Save Velocity · Impression Mapping</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
