import { useCallback, useEffect, useState } from "react";
import { Share2, Instagram } from "lucide-react";

import { Alert, Badge, Button } from "../../../../design-system/aurora";
import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";
import { env } from "../../../../shared/config/env";
import { authAuthorizationHeader } from "../../../../shared/auth/auth-session";
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
 * Meta Suite CTA remains placeholder until marketplace OAuth ships.
 */
export function BrandIntegrationsSettings() {
  const [data, setData] = useState<IntegrationsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<IdentityConflict | null>(null);

  const authHeaders = (): HeadersInit => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    ...authAuthorizationHeader(),
  });

  const redirectUri = () =>
    `${window.location.origin}/brand/settings/integrations`;

  const load = useCallback(async () => {
    const res = await fetch(`${env.apiUrl}/api/v1/brand/settings/integrations`, {
      headers: authHeaders(),
    });
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
        setError(err instanceof Error ? err.message : "Failed to load integrations.");
      }
    })();
  }, [load]);

  useEffect(() => {
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
          `${env.apiUrl}/api/v1/brand/settings/integrations/instagram/connect`,
          {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ code, redirectUri: redirectUri() }),
          },
        );
        const json = (await res.json()) as {
          conflict?: boolean;
          integrationId?: string;
          currentPlatformHandle?: string;
          inboundOauthHandle?: string;
          connected?: boolean;
        };
        window.history.replaceState({}, "", window.location.pathname);
        if (!res.ok) {
          throw new Error(nestErrorMessage(json, "Instagram connect failed."));
        }
        if (cancelled) {
          return;
        }
        if (json.conflict && json.integrationId && json.currentPlatformHandle && json.inboundOauthHandle) {
          setConflict({
            integrationId: json.integrationId,
            currentPlatformHandle: json.currentPlatformHandle,
            inboundOauthHandle: json.inboundOauthHandle,
          });
          return;
        }
        setMessage("Instagram connected.");
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Instagram connect failed.");
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
  }, [load]);

  const startInstagramOauth = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `${env.apiUrl}/api/v1/brand/settings/integrations/instagram/oauth-url?redirectUri=${encodeURIComponent(redirectUri())}`,
        { headers: authHeaders() },
      );
      const json = (await res.json()) as { url?: string };
      if (!res.ok || !json.url) {
        throw new Error(nestErrorMessage(json, "Could not start Instagram OAuth."));
      }
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Instagram OAuth.");
      setBusy(false);
    }
  };

  const resolveConflict = async (resolution: "OVERWRITE_HANDLE" | "CANCEL_CONNECT") => {
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
        throw new Error(nestErrorMessage(json, "Could not resolve identity conflict."));
      }
      setConflict(null);
      setMessage(
        resolution === "OVERWRITE_HANDLE"
          ? "Handle overwritten. Instagram connection activated."
          : "Handshake cancelled. Reconnect with the correct profile when ready.",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conflict resolution failed.");
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
      const res = await fetch(`${env.apiUrl}/api/v1/brand/settings/integrations/manage`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          integrationId: data.instagram.id,
          action,
          confirmDeleteData: action === "DELETE_INGESTED_DATA",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(nestErrorMessage(json, "Manage action failed."));
      }
      setManageOpen(false);
      setMessage(
        action === "DELETE_INGESTED_DATA"
          ? "Connection cleared (analytics purge deferred)."
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
  const handle = data?.scrapedHandle ?? data?.instagram?.currentPlatformHandle ?? "@handle";
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
              {tokenExpired ? "Re-authenticate" : "Reconnect to Enable Insights"}
            </Button>
          ) : null}
          {layout !== "SKIPPED" || data?.instagram ? (
            <Button variant="outline" onClick={() => setManageOpen(true)}>
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
          {layout === "FULL_INSTAGRAM" ? "✓" : "○"} Engagement & Performance Insights
        </li>
      </ul>
    </SettingsSectionCard>
  );

  const metaCard = (
    <SettingsSectionCard
      title="Meta Business Suite — Creator Marketplace"
      description="Settings-only upgrade for DMs, discovery, and campaign tracking. Not part of onboarding signup."
      className="settings-integrations-grid__main"
    >
      <div className="settings-meta-header">
        <div className="settings-meta-header__brand">
          <span className="settings-meta-header__icon" aria-hidden>
            <Share2 size={24} />
          </span>
          <div>
            <h3 className="settings-meta-header__title">Meta Business Suite</h3>
            <Badge tone={data?.metaBusinessSuite ? "success" : "neutral"}>
              {data?.metaBusinessSuite ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </div>
        <Button variant="primary" disabled title="Meta marketplace OAuth not wired yet">
          Connect Meta Business Suite →
        </Button>
      </div>
      <ul>
        <li>Targeted outreach (priority DMs)</li>
        <li>Automated influencer discovery</li>
        <li>Enhanced campaign tracking</li>
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
          Website analysis identified handle <strong>{handle}</strong>. Authenticate Instagram
          below for performance tracking. Meta Business Suite remains optional in Settings.
        </Alert>

        <div className="settings-integrations-grid">
          {layout === "SKIPPED" ? (
            <>
              {metaCard}
              <div className="settings-integrations-grid__side">
                <p style={{ textAlign: "center", opacity: 0.7 }}>— OR —</p>
                {instagramCard}
              </div>
            </>
          ) : (
            <>
              <div className="settings-integrations-grid__side">{instagramCard}</div>
              {metaCard}
            </>
          )}
        </div>
      </div>

      <SideDrawer
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
        title="Manage Connection"
        subtitle="Permission layers and connection lifecycle"
      >
        <p>Disconnect pauses live sync while keeping historical campaign logs.</p>
        <div className="bob-stack" style={{ marginTop: "1rem", gap: "0.5rem" }}>
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
            Delete Ingested Social Data
          </Button>
        </div>
      </SideDrawer>

      {conflict ? (
        <div
          role="dialog"
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
            <h2 id="identity-conflict-title" style={{ margin: 0, fontSize: "1.25rem" }}>
              Meta Identity Conflict Detected
            </h2>
            <p>
              The inbound authenticated Meta handle does not match the active Instagram handle
              tracked in Brand Center.
            </p>
            <p>
              <strong>Active Platform Identity Vector:</strong> {conflict.currentPlatformHandle}
              <br />
              <strong>Inbound Authenticated Identity Vector:</strong>{" "}
              {conflict.inboundOauthHandle}
            </p>
            <p>
              All active campaign briefs, creator negotiation pipelines, escrow milestones, and
              verification logs depend on maintaining a single, consistent identity track.
              Overwriting this context will alter your global profile parameters.
            </p>
            <div className="bob-inline" style={{ justifyContent: "flex-end", gap: "0.5rem" }}>
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
