import { useCallback, useEffect, useRef, useState } from "react";
import { Instagram } from "lucide-react";

import { Alert, Badge, Button } from "../../../../design-system/aurora";
import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";
import { env } from "../../../../shared/config/env";
import { authenticatedFetch as fetch } from "../../../../shared/api/authenticated-fetch";
import { SettingsSectionCard } from "../settings-section-card";

type LayoutCase = "PARTIAL_INSTAGRAM" | "FULL_INSTAGRAM" | "SKIPPED";

type IntegrationRow = {
  id: string;
  provider: "INSTAGRAM" | "META_BUSINESS_SUITE";
  status: string;
  currentPlatformHandle: string;
  scopes: string[];
};

type IntegrationsPayload = {
  layoutCase: LayoutCase;
  scrapedHandle: string | null;
  socialSyncSkipped: boolean;
  instagram: IntegrationRow | null;
  metaBusinessSuite: IntegrationRow | null;
};

type IdentityConflict = {
  integrationId: string;
  currentPlatformHandle: string;
  inboundOauthHandle: string;
};

type ConnectResponse = Partial<IdentityConflict> & {
  conflict?: boolean;
  connected?: boolean;
};

function nestErrorMessage(json: unknown, fallback: string): string {
  if (!json || typeof json !== "object") {
    return fallback;
  }
  const message = (json as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }
  if (
    message &&
    typeof message === "object" &&
    typeof (message as { message?: unknown }).message === "string"
  ) {
    return (message as { message: string }).message;
  }
  return fallback;
}

/**
 * Integrations tab — layout cases from Brand Settings change doc.
 * Instagram is the only operational provider in Settings MVP.
 */
export function BrandIntegrationsSettings() {
  const [data, setData] = useState<IntegrationsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<IdentityConflict | null>(null);
  const [callback] = useState(
    () => new URLSearchParams(window.location.search),
  );
  const connectRequest = useRef<Promise<ConnectResponse> | null>(null);
  const conflictPanel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!conflict || !conflictPanel.current) return;
    const panel = conflictPanel.current;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const buttons = () =>
      Array.from(
        panel.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
      );
    (buttons()[0] ?? panel).focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const targets = buttons();
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (!first || !last) {
        event.preventDefault();
        panel.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", trapFocus);
    return () => {
      panel.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = previousOverflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [conflict]);

  const authHeaders = (): HeadersInit => ({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  const redirectUri = () =>
    `${window.location.origin}/brand/settings/integrations`;

  const load = useCallback(async () => {
    const res = await fetch(
      `${env.apiUrl}/api/v1/brand/settings/integrations`,
      {
        headers: authHeaders(),
        referrerPolicy: "no-referrer",
      },
    );
    const json = (await res.json()) as IntegrationsPayload;
    if (!res.ok) {
      throw new Error(nestErrorMessage(json, "Failed to load integrations."));
    }
    setData(json);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load integrations.",
        );
      }
    })();
  }, [load]);

  useEffect(() => {
    const code = callback.get("code");
    const state = callback.get("state");
    if (!code && !callback.has("error") && !callback.has("state")) return;

    // Remove callback secrets even on missing state, denial, network or JSON errors.
    // Preserve unrelated query parameters and router history state.
    const cleanUrl = new URL(window.location.href);
    for (const key of [
      "code",
      "state",
      "error",
      "error_reason",
      "error_description",
    ]) {
      cleanUrl.searchParams.delete(key);
    }
    window.history.replaceState(
      window.history.state,
      "",
      `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash === "#_" ? "" : cleanUrl.hash}`,
    );
    if (callback.has("error") || !code || !state) {
      setError(
        "Instagram authorization is incomplete. Start a new connection attempt.",
      );
      return;
    }

    // Reuse this request during React StrictMode effect replay; the server state
    // is one-time, so a second POST would correctly be rejected as a replay.
    if (!connectRequest.current) {
      connectRequest.current = (async () => {
        const res = await fetch(
          `${env.apiUrl}/api/v1/brand/settings/integrations/instagram/connect`,
          {
            method: "POST",
            headers: authHeaders(),
            referrerPolicy: "no-referrer",
            body: JSON.stringify({ code, state, redirectUri: redirectUri() }),
          },
        );
        const json: unknown = await res.json();
        if (!res.ok)
          throw new Error(nestErrorMessage(json, "Instagram connect failed."));
        return json as ConnectResponse;
      })();
    }
    const request = connectRequest.current;
    let cancelled = false;
    void (async () => {
      setBusy(true);
      setError(null);
      try {
        const json = await request;
        if (cancelled) {
          return;
        }
        if (
          json.conflict &&
          json.integrationId &&
          json.currentPlatformHandle &&
          json.inboundOauthHandle
        ) {
          setConflict({
            integrationId: json.integrationId,
            currentPlatformHandle: json.currentPlatformHandle,
            inboundOauthHandle: json.inboundOauthHandle,
          });
          return;
        }
        if (!json.connected)
          throw new Error(
            "Instagram connect failed. Start a new connection attempt.",
          );
        setMessage("Instagram connected.");
        await load();
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
  }, [callback, load]);

  const startInstagramOauth = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `${env.apiUrl}/api/v1/brand/settings/integrations/instagram/oauth-url?redirectUri=${encodeURIComponent(redirectUri())}`,
        {
          headers: authHeaders(),
          cache: "no-store",
          referrerPolicy: "no-referrer",
        },
      );
      const json = (await res.json()) as { url?: string };
      if (!res.ok || !json.url) {
        throw new Error(
          nestErrorMessage(json, "Could not start Instagram OAuth."),
        );
      }
      window.location.href = json.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start Instagram OAuth.",
      );
      setBusy(false);
    }
  };

  const resolveConflict = async (
    resolution: "OVERWRITE_HANDLE" | "CANCEL_CONNECT",
  ) => {
    if (!conflict) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `${env.apiUrl}/api/v1/brand/settings/integrations/resolve-identity-conflict`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ ...conflict, resolution }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          nestErrorMessage(json, "Could not resolve identity conflict."),
        );
      }
      setConflict(null);
      setMessage(
        resolution === "OVERWRITE_HANDLE"
          ? "Handle overwritten. Instagram connection activated."
          : "Handshake cancelled. Reconnect with the correct profile when ready.",
      );
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Conflict resolution failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const manage = async (
    action: "DISCONNECT_INTEGRATION" | "DELETE_INGESTED_DATA" | "RECONNECT",
  ) => {
    if (!data?.instagram?.id) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (action === "RECONNECT") {
        await startInstagramOauth();
        return;
      }
      const res = await fetch(
        `${env.apiUrl}/api/v1/brand/settings/integrations/manage`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            integrationId: data.instagram.id,
            action,
            confirmDeleteData: action === "DELETE_INGESTED_DATA",
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(nestErrorMessage(json, "Manage action failed."));
      }
      setManageOpen(false);
      setMessage(
        action === "DELETE_INGESTED_DATA"
          ? "Instagram disconnected and connection credentials removed. Historical data retained."
          : "Integration disconnected.",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Manage action failed.");
    } finally {
      setBusy(false);
    }
  };

  const layout = data?.layoutCase ?? "SKIPPED";
  const handle =
    data?.scrapedHandle ?? data?.instagram?.currentPlatformHandle ?? "@handle";
  const tokenExpired = data?.instagram?.status === "TOKEN_EXPIRED";

  const instagramCard = (
    <SettingsSectionCard
      title="Instagram Profile Connection"
      description="Basics + Insights via Instagram Login (onboarding or standalone)."
    >
      <div className="settings-meta-header">
        <div className="settings-meta-header__brand">
          <span className="settings-meta-header__icon" aria-hidden>
            <Instagram size={24} />
          </span>
          <div>
            <h3 className="settings-meta-header__title">Instagram</h3>
            <Badge
              tone={
                tokenExpired
                  ? "error"
                  : layout === "FULL_INSTAGRAM"
                    ? "success"
                    : layout === "PARTIAL_INSTAGRAM"
                      ? "pending"
                      : "neutral"
              }
            >
              {tokenExpired
                ? "Token expired"
                : layout === "FULL_INSTAGRAM"
                  ? "Connected"
                  : layout === "PARTIAL_INSTAGRAM"
                    ? "Partially connected"
                    : "Not connected"}
            </Badge>
          </div>
        </div>
        <div className="settings-meta-header__actions">
          {layout === "PARTIAL_INSTAGRAM" || tokenExpired ? (
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => void startInstagramOauth()}
            >
              {tokenExpired
                ? "Re-authenticate"
                : "Reconnect to Enable Insights"}
            </Button>
          ) : null}
          {layout !== "SKIPPED" || data?.instagram ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setManageOpen(true)}
            >
              Manage connection
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void startInstagramOauth()}
            >
              Connect Instagram Standalone
            </Button>
          )}
        </div>
      </div>
      <p className="settings-meta-subline">Connected account: {handle}</p>
      <ul>
        <li>✓ Basic Profile Access</li>
        <li>
          {layout === "FULL_INSTAGRAM" ? "✓" : "○"} Engagement & Performance
          Insights
        </li>
      </ul>
    </SettingsSectionCard>
  );

  return (
    <>
      <div className="settings-page-stack">
        {error ? (
          <Alert tone="warning" title="Integrations">
            {error}
          </Alert>
        ) : null}
        {message ? (
          <Alert tone="success" title="Integrations">
            {message}
          </Alert>
        ) : null}

        <Alert tone="warning" title="Unverified deep discovery">
          Website analysis identified handle <strong>{handle}</strong>.
          Authenticate Instagram below for performance tracking.
        </Alert>

        <div className="settings-instagram-connection">{instagramCard}</div>
      </div>

      <SideDrawer
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
        title="Manage Connection"
        closeLabel="Close manage connection"
        subtitle="Permission layers and connection lifecycle"
      >
        <p>
          Disconnect stops future ingestion. Removing connection credentials
          also clears stored permissions. Historical analytics, Intelligence,
          and campaign evidence are retained.
        </p>
        <div
          className="bob-stack settings-instagram-manage"
          style={{ marginTop: "1rem", gap: "0.5rem" }}
        >
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void manage("RECONNECT")}
          >
            Reconnect
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void manage("DISCONNECT_INTEGRATION")}
          >
            Disconnect Integration
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void manage("DELETE_INGESTED_DATA")}
          >
            Disconnect and remove connection credentials
          </Button>
        </div>
      </SideDrawer>

      {conflict ? (
        <div
          role="dialog"
          className="settings-instagram-conflict"
          aria-modal="true"
          aria-labelledby="identity-conflict-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "grid",
            placeItems: "center",
            zIndex: 60,
            padding: "1rem",
          }}
        >
          <div
            ref={conflictPanel}
            tabIndex={-1}
            className="settings-instagram-conflict__panel"
            style={{
              background: "var(--color-surface, #fff)",
              borderRadius: 12,
              maxWidth: 520,
              width: "100%",
              padding: "1.5rem",
              display: "grid",
              gap: "0.75rem",
            }}
          >
            <h2
              id="identity-conflict-title"
              style={{ margin: 0, fontSize: "1.25rem" }}
            >
              Meta Identity Conflict Detected
            </h2>
            <p>
              The inbound authenticated Meta handle does not match the active
              Instagram handle tracked in Brand Center.
            </p>
            <p>
              <strong>Active Platform Identity Vector:</strong>{" "}
              {conflict.currentPlatformHandle}
              <br />
              <strong>Inbound Authenticated Identity Vector:</strong>{" "}
              {conflict.inboundOauthHandle}
            </p>
            <p>
              All active campaign briefs, creator negotiation pipelines, escrow
              milestones, and verification logs depend on maintaining a single,
              consistent identity track. Overwriting this context will alter
              your global profile parameters.
            </p>
            <div
              className="bob-inline settings-instagram-conflict__actions"
              style={{ justifyContent: "flex-end", gap: "0.5rem" }}
            >
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void resolveConflict("CANCEL_CONNECT")}
              >
                Cancel Handshake & Reconnect Correct Profile
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={busy}
                onClick={() => void resolveConflict("OVERWRITE_HANDLE")}
              >
                Overwrite & Use New Identity
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
