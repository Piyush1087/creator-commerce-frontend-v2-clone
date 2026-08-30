import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleAlert,
  Instagram,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Unplug,
} from "lucide-react";

import { Alert, Badge, Button } from "../../../../design-system/aurora";
import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";
import {
  cancelPendingInstagramAccountChange,
  connectInstagram,
  deleteInstagramConnectionData,
  disconnectInstagram,
  fetchInstagramIntegrations,
  getInstagramOAuthUrl,
  InstagramIntegrationsApiError,
} from "../../api/instagram-integrations-client";
import { fetchBrandGeneralSettings } from "../../api/brand-settings-client";
import type { BrandSettingsRole } from "../../contracts/brand-settings.contracts";
import type {
  InstagramAccountChangeRequired,
  InstagramConnectResponse,
  InstagramDeletionReceipt,
  InstagramIntegrationsReadModel,
  InstagramOAuthIntent,
} from "../../contracts/instagram-integrations.contracts";
import {
  INSTAGRAM_CONNECTION_PRESENTATION,
  callbackScrubbedPath,
  capabilityLabel,
  deletionBlocksInstagramConnection,
  deletionStatusCopy,
  friendlyInstagramError,
  hasPendingInstagramAccountChange,
  parseInstagramCallback,
} from "../../utils/instagram-integration-state";
import { SettingsSectionCard } from "../settings-section-card";

type Confirmation = "disconnect" | "delete" | null;

const SETTINGS_REDIRECT_PATH = "/brand/settings/integrations";

function directDisplayHandle(
  data: InstagramIntegrationsReadModel | null,
): string | null {
  return (
    data?.instagram?.currentProviderDisplayIdentity ??
    data?.instagram?.currentPlatformHandle ??
    null
  );
}

function accountChangeFromReadModel(
  data: InstagramIntegrationsReadModel | null,
): InstagramAccountChangeRequired | null {
  const row = data?.instagram;
  if (!row || !hasPendingInstagramAccountChange(row) || !row.inboundOauthHandle)
    return null;
  return {
    conflict: true,
    code: "ACCOUNT_CHANGE_REQUIRED",
    integrationId: row.id,
    currentPlatformHandle: row.currentPlatformHandle,
    inboundOauthHandle: row.inboundOauthHandle,
    message:
      "A different Instagram account requires Brand Owner authorization.",
  };
}

export function BrandIntegrationsSettings() {
  const [data, setData] = useState<InstagramIntegrationsReadModel | null>(null);
  const [role, setRole] = useState<BrandSettingsRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [accountChangeOpen, setAccountChangeOpen] = useState(false);
  const [callbackConflict, setCallbackConflict] =
    useState<InstagramAccountChangeRequired | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [receipt, setReceipt] = useState<InstagramDeletionReceipt | null>(null);
  const [callback] = useState(() =>
    parseInstagramCallback(new URLSearchParams(window.location.search)),
  );
  const callbackScrubbed = useRef(false);
  const connectRequest = useRef<Promise<InstagramConnectResponse> | null>(null);

  const redirectUri = `${window.location.origin}${SETTINGS_REDIRECT_PATH}`;

  const load = useCallback(async () => {
    const [integrations, general] = await Promise.all([
      fetchInstagramIntegrations(),
      fetchBrandGeneralSettings(),
    ]);
    setData(integrations);
    setRole(general.current_user_role);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } catch (caught) {
        if (!cancelled) setError(friendlyInstagramError(caught));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    if (callback.kind === "none") return;
    if (!callbackScrubbed.current) {
      window.history.replaceState(
        window.history.state,
        "",
        callbackScrubbedPath(window.location.href),
      );
      callbackScrubbed.current = true;
    }
    if (callback.kind === "error") {
      setError(callback.message);
      return;
    }
    if (!connectRequest.current) {
      connectRequest.current = connectInstagram({
        code: callback.code,
        state: callback.state,
        redirectUri,
      });
    }
    const request = connectRequest.current;
    let cancelled = false;
    void (async () => {
      setBusy(true);
      setError(null);
      try {
        const result = await request;
        if (cancelled) return;
        if (result.conflict) {
          setCallbackConflict(result);
          setAccountChangeOpen(true);
          setMessage(
            "A different Instagram account was selected. Review the pending account change.",
          );
          await load();
          return;
        }
        setMessage(
          result.authorizationHealth === "CONNECTED_FULL"
            ? "Instagram connected."
            : result.authorizationHealth === "PARTIALLY_CONNECTED"
              ? "Instagram connected with limited Insights access."
              : "Instagram authorization completed. Canonical connection status was refreshed.",
        );
        await load();
      } catch (caught) {
        if (cancelled) return;
        setError(friendlyInstagramError(caught));
        if (
          caught instanceof InstagramIntegrationsApiError &&
          (caught.code === "STALE_INSTAGRAM_AUTHORIZATION_GENERATION" ||
            caught.code === "STALE_INSTAGRAM_ACCOUNT_IDENTITY")
        ) {
          await load().catch(() => undefined);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [callback, load, redirectUri]);

  const startOAuth = async (intent: InstagramOAuthIntent) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await getInstagramOAuthUrl(redirectUri, intent);
      window.location.href = result.url;
    } catch (caught) {
      setError(friendlyInstagramError(caught));
      setBusy(false);
    }
  };

  const reload = async () => {
    setBusy(true);
    setError(null);
    try {
      await load();
    } catch (caught) {
      setError(friendlyInstagramError(caught));
    } finally {
      setBusy(false);
    }
  };

  const pendingConflict = useMemo(
    () => callbackConflict ?? accountChangeFromReadModel(data),
    [callbackConflict, data],
  );

  const cancelPendingAccountChange = async () => {
    if (
      !pendingConflict ||
      !pendingConflict.currentPlatformHandle ||
      (role !== "BRAND_OWNER" && role !== "CAMPAIGN_MANAGER")
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await cancelPendingInstagramAccountChange({
        integrationId: pendingConflict.integrationId,
        currentPlatformHandle: pendingConflict.currentPlatformHandle,
        inboundOauthHandle: pendingConflict.inboundOauthHandle,
      });
      setCallbackConflict(null);
      setAccountChangeOpen(false);
      setMessage(
        "Pending Instagram account change cancelled. The current connection was preserved.",
      );
      await load();
    } catch (caught) {
      setError(friendlyInstagramError(caught));
    } finally {
      setBusy(false);
    }
  };

  const confirmManageAction = async () => {
    const integration = data?.instagram;
    if (!integration || !confirmation) return;
    setBusy(true);
    setError(null);
    try {
      if (confirmation === "disconnect") {
        await disconnectInstagram(integration.id);
        setMessage(
          "Instagram disconnected. Existing Creator Shop business history was retained.",
        );
      } else {
        const deletionReceipt = await deleteInstagramConnectionData(
          integration.id,
        );
        setReceipt(deletionReceipt);
        setMessage(deletionStatusCopy(deletionReceipt.state));
      }
      setConfirmation(null);
      await load();
    } catch (caught) {
      setError(friendlyInstagramError(caught));
    } finally {
      setBusy(false);
    }
  };

  const row = data?.instagram ?? null;
  const deletion = data?.deletion ?? null;
  const deletionBlocking = deletion
    ? deletionBlocksInstagramConnection(deletion.state)
    : false;
  const legacyIdentity = Boolean(row && !row.providerAccountId);
  const displayHandle = directDisplayHandle(data);
  const presentation = row
    ? INSTAGRAM_CONNECTION_PRESENTATION[row.authorizationHealth]
    : null;
  const websiteHandleNeedsContext = Boolean(
    !row?.providerAccountId &&
      data?.scrapedHandle &&
      data.igHandleProvenance !== "META_DIRECT",
  );
  const canInitialConnect = !row && role === "BRAND_OWNER" && !deletionBlocking;
  const canReconnect = Boolean(
    row?.allowedActions.sameIdReconnect && !legacyIdentity && !deletionBlocking,
  );
  const showPrimaryReconnect = Boolean(
    canReconnect &&
      (row?.authorizationHealth === "PARTIALLY_CONNECTED" ||
        (row?.authorizationHealth === "NEEDS_REVALIDATION" &&
          row.humanActionRequired) ||
        row?.authorizationHealth === "DISCONNECTED"),
  );
  const canManageConnection = Boolean(
    canReconnect ||
      row?.allowedActions.disconnect ||
      row?.allowedActions.deleteMyData,
  );

  return (
    <div className="settings-page-stack settings-instagram-page">
      {error ? (
        <div role="alert">
          <Alert tone="error" title="Instagram connection">
            {error}
          </Alert>
        </div>
      ) : null}
      {message ? (
        <div role="status" aria-live="polite">
          <Alert tone="success" title="Instagram connection">
            {message}
          </Alert>
        </div>
      ) : null}

      {deletion ? (
        <div role="status" aria-live="polite">
          <Alert
            tone={deletion.state === "FAILED_TERMINAL" ? "error" : "warning"}
            title={`Deletion status: ${deletion.state.replace(/_/g, " ").toLowerCase()}`}
          >
            {deletionStatusCopy(deletion.state)} Requested{" "}
            {new Date(deletion.requestedAt).toLocaleString()}.
          </Alert>
        </div>
      ) : null}

      {receipt ? (
        <div role="status" aria-live="polite">
          <Alert
            tone={
              receipt.state === "COMPLETED"
                ? "success"
                : receipt.state === "FAILED_TERMINAL"
                  ? "error"
                  : "warning"
            }
            title="Deletion request recorded"
          >
            {deletionStatusCopy(receipt.state)} Request ID is available to
            support without exposing the confirmation secret.
          </Alert>
        </div>
      ) : null}

      {websiteHandleNeedsContext ? (
        <Alert tone="warning" title="Website-detected Instagram handle">
          {data?.scrapedHandle} came from website or legacy context and is not
          an authenticated Instagram account.
        </Alert>
      ) : null}

      {pendingConflict ? (
        <div>
          <Alert tone="warning" title="Pending Instagram account change">
            A different Instagram account ({pendingConflict.inboundOauthHandle})
            was selected. The current connection remains unchanged until the
            pending attempt is cancelled or a Brand Owner starts fresh
            account-change authorization.
          </Alert>
          <div className="settings-instagram-inline-actions">
            <Button
              variant="outline"
              onClick={() => setAccountChangeOpen(true)}
            >
              Review pending account change
            </Button>
          </div>
        </div>
      ) : null}

      <SettingsSectionCard
        title="Instagram profile connection"
        description="First-party profile and Insights access through Instagram Login for Professional accounts."
      >
        <div className="settings-meta-header">
          <div className="settings-meta-header__brand">
            <span className="settings-meta-header__icon" aria-hidden>
              <Instagram size={24} />
            </span>
            <div>
              <h3 className="settings-meta-header__title">Instagram</h3>
              <Badge tone={presentation?.tone ?? "neutral"}>
                {loading ? "Loading" : (presentation?.label ?? "Not connected")}
              </Badge>
            </div>
          </div>
          <div className="settings-meta-header__actions">
            {canInitialConnect ? (
              <Button
                disabled={busy || loading}
                onClick={() => void startOAuth("INITIAL_CONNECT")}
              >
                Connect Instagram
              </Button>
            ) : null}
            {showPrimaryReconnect ? (
              <Button
                disabled={busy}
                onClick={() => void startOAuth("RECONNECT")}
              >
                Reconnect same account
              </Button>
            ) : null}
            {row?.authorizationHealth === "UNKNOWN" ||
            row?.authorizationHealth === "PROVIDER_ACCESS_BLOCKED" ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void reload()}
              >
                <RefreshCw size={18} aria-hidden /> Reload status
              </Button>
            ) : null}
            {legacyIdentity &&
            row?.allowedActions.legacyIdentityReconciliation &&
            !deletionBlocking ? (
              <Button
                disabled={busy}
                onClick={() =>
                  void startOAuth("LEGACY_IDENTITY_RECONCILIATION")
                }
              >
                Reconcile legacy identity
              </Button>
            ) : null}
            {row ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setManageOpen(true)}
              >
                {canManageConnection ? "Manage connection" : "View connection"}
              </Button>
            ) : null}
          </div>
        </div>

        <div
          className="settings-instagram-status"
          role="status"
          aria-live="polite"
        >
          <div>
            <h4>{presentation?.heading ?? "No Instagram connection"}</h4>
            <p>
              {presentation?.description ??
                (role === "BRAND_OWNER"
                  ? "Connect a Professional Instagram account to enable first-party profile access."
                  : "Only a Brand Owner can create the first Instagram connection.")}
            </p>
          </div>
          <p className="settings-meta-subline">
            {displayHandle
              ? `Authenticated account: ${displayHandle}`
              : "No authenticated Instagram account"}
          </p>
        </div>

        {row ? (
          <>
            <dl
              className="settings-instagram-capabilities"
              aria-label="First-party Instagram capabilities"
            >
              <div>
                <dt>Profile access</dt>
                <dd>{capabilityLabel(row.capabilities.firstPartyProfile)}</dd>
              </div>
              <div>
                <dt>Insights</dt>
                <dd>{capabilityLabel(row.capabilities.firstPartyInsights)}</dd>
              </div>
            </dl>

            <div
              className="settings-instagram-separate-capabilities"
              aria-label="Separate Meta capabilities"
            >
              <h4>Separate provider capabilities</h4>
              <p>
                These are not granted by the Brand&apos;s first-party Instagram
                connection.
              </p>
              <dl>
                <div>
                  <dt>Business Discovery</dt>
                  <dd>{capabilityLabel(row.capabilities.businessDiscovery)}</dd>
                </div>
                <div>
                  <dt>Creator Marketplace Discovery</dt>
                  <dd>
                    {capabilityLabel(
                      row.capabilities.creatorMarketplaceDiscovery,
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <p className="settings-instagram-diagnostic">
              Sync health:{" "}
              {row.syncHealth === "NOT_CONFIGURED"
                ? "No separate sync automation configured"
                : row.syncHealth}
              {row.tokenLastRefreshedAt
                ? ` · Authorization last refreshed ${new Date(row.tokenLastRefreshedAt).toLocaleDateString()}`
                : ""}
            </p>

            {row.authorizationHealth === "NEEDS_REVALIDATION" &&
            row.humanActionRequired &&
            !canReconnect ? (
              <p className="settings-team__capacity-warning">
                Reconnect is required, but your workspace role has read-only
                access. Ask a Brand Owner or Campaign Manager.
              </p>
            ) : null}
            {legacyIdentity &&
            !row.allowedActions.legacyIdentityReconciliation ? (
              <p className="settings-team__capacity-warning">
                This legacy Instagram identity requires Brand Owner
                reconciliation before reconnecting.
              </p>
            ) : null}
          </>
        ) : null}
      </SettingsSectionCard>

      <SideDrawer
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
        title={
          canManageConnection
            ? "Manage Instagram connection"
            : "Instagram connection details"
        }
        closeLabel="Close Instagram connection details"
        subtitle="Authorization and connection-data controls"
      >
        <div className="settings-instagram-drawer">
          <p>
            Authorization health and synchronization health are separate.
            Provider IDs and permission strings stay hidden.
          </p>
          {canReconnect ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void startOAuth("RECONNECT")}
            >
              Reconnect same Instagram account
            </Button>
          ) : null}
          {row?.allowedActions.disconnect ? (
            <Button
              variant="outline"
              disabled={busy || deletionBlocking}
              onClick={() => {
                setManageOpen(false);
                setConfirmation("disconnect");
              }}
            >
              <Unplug size={18} aria-hidden /> Disconnect Instagram
            </Button>
          ) : null}
          {row?.allowedActions.deleteMyData ? (
            <Button
              variant="outline"
              disabled={busy || deletionBlocking}
              onClick={() => {
                setManageOpen(false);
                setConfirmation("delete");
              }}
            >
              <Trash2 size={18} aria-hidden /> Delete Instagram connection data
            </Button>
          ) : null}
          {!canReconnect &&
          !row?.allowedActions.disconnect &&
          !row?.allowedActions.deleteMyData ? (
            <Alert tone="warning" title="Read-only access">
              Your workspace role can view connection diagnostics but cannot
              change or delete this connection.
            </Alert>
          ) : null}
        </div>
      </SideDrawer>

      <SideDrawer
        isOpen={Boolean(confirmation)}
        onClose={() => setConfirmation(null)}
        title={
          confirmation === "delete"
            ? "Delete Instagram connection data"
            : "Disconnect Instagram"
        }
        closeLabel="Close confirmation"
        subtitle={
          confirmation === "delete"
            ? "Stronger than ordinary disconnect"
            : "Stop future Instagram ingestion"
        }
        footer={
          <div className="settings-drawer-footer">
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => void confirmManageAction()}
            >
              {confirmation === "delete"
                ? "Confirm deletion"
                : "Confirm disconnect"}
            </Button>
          </div>
        }
      >
        {confirmation === "delete" ? (
          <div className="settings-instagram-confirmation">
            <CircleAlert size={24} aria-hidden />
            <p>
              This removes or sanitizes the provider connection and
              authorization identity. Creator-owned data, campaign and
              collaboration business history, website/user-entered handles, and
              minimum audit records are retained.
            </p>
          </div>
        ) : (
          <div className="settings-instagram-confirmation">
            <Unplug size={24} aria-hidden />
            <p>
              This stops future Instagram ingestion and removes the active
              authorization. Existing Creator Shop business history is retained.
            </p>
          </div>
        )}
      </SideDrawer>

      <SideDrawer
        isOpen={accountChangeOpen && Boolean(pendingConflict)}
        onClose={() => setAccountChangeOpen(false)}
        title="Different Instagram account selected"
        closeLabel="Close account change review"
        subtitle="Stable provider identity protects the current Brand connection"
      >
        <div className="settings-instagram-drawer">
          <p>
            Current account:{" "}
            <strong>
              {pendingConflict?.currentPlatformHandle ??
                "Current Instagram account"}
            </strong>
          </p>
          <p>
            Pending account:{" "}
            <strong>{pendingConflict?.inboundOauthHandle}</strong>
          </p>
          <p>
            Changing the Brand&apos;s connected Instagram account requires fresh
            Brand Owner authorization. The current active connection remains
            preserved meanwhile.
          </p>
          {role === "BRAND_OWNER" &&
          row?.allowedActions.controlledAccountChange &&
          !deletionBlocking ? (
            <Button
              disabled={busy}
              onClick={() => void startOAuth("ACCOUNT_CHANGE")}
            >
              <ShieldCheck size={18} aria-hidden /> Authorize account change
            </Button>
          ) : (
            <Alert tone="warning" title="Brand Owner authorization required">
              Your role cannot authorize a different Instagram account.
            </Alert>
          )}
          {(role === "BRAND_OWNER" || role === "CAMPAIGN_MANAGER") &&
          pendingConflict?.currentPlatformHandle ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void cancelPendingAccountChange()}
            >
              Cancel pending account change
            </Button>
          ) : null}
        </div>
      </SideDrawer>
    </div>
  );
}
