import { useState } from "react";
import {
  CircleAlert,
  Instagram,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from "lucide-react";

import { Alert, Badge, Button } from "../../../../design-system/aurora";
import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";
import { saveCreatorInstagramFlowMode } from "../../../creator-onboarding/utils/creator-entry-oauth-session";
import { useCreatorInstagramSettings } from "../../hooks/use-creator-instagram-settings";
import {
  CREATOR_INSTAGRAM_PRESENTATION,
  creatorInstagramCapabilityLabel,
} from "../../utils/creator-instagram-settings-state";
import {
  saveCreatorInstagramSettingsFlow,
  saveCreatorInstagramSettingsReconnect,
} from "../../utils/creator-instagram-settings-oauth-session";
import { SettingsSectionCard } from "../settings-section-card";
import "./creator-instagram-settings.css";

export function CreatorInstagramSettings() {
  const {
    data,
    loading,
    busy,
    error,
    message,
    reload,
    revalidate,
    authorizeInitial,
    authorizeReconnect,
    disconnect,
  } = useCreatorInstagramSettings();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const presentation = data
    ? CREATOR_INSTAGRAM_PRESENTATION[data.lifecycleState]
    : null;

  const startReconnect = async () => {
    try {
      const authorization = await authorizeReconnect();
      saveCreatorInstagramSettingsReconnect();
      window.location.assign(authorization.authorizationUrl);
    } catch {
      // The hook exposes a safe, actionable error in the page alert.
    }
  };

  const startInitialConnect = async () => {
    try {
      const authorization = await authorizeInitial();
      saveCreatorInstagramFlowMode("INITIAL_CONNECT");
      saveCreatorInstagramSettingsFlow("INITIAL_CONNECT");
      window.location.assign(authorization.authorizationUrl);
    } catch {
      // C01 remains initial-connect authority; the hook surfaces its safe error.
    }
  };

  const confirmDisconnectAction = async () => {
    try {
      await disconnect();
      setConfirmDisconnect(false);
    } catch {
      // The hook exposes a safe, actionable error in the page alert.
    }
  };

  return (
    <div className="creator-instagram-settings settings-page-stack">
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

      <SettingsSectionCard
        title="Instagram connection"
        description="Manage the permanent Instagram identity and its current provider authorization."
      >
        <div className="creator-instagram-settings__header">
          <div className="creator-instagram-settings__identity">
            <span className="creator-instagram-settings__icon" aria-hidden>
              <Instagram size={24} />
            </span>
            <div className="creator-instagram-settings__identity-copy">
              <h3>Instagram</h3>
              <Badge tone={presentation?.tone ?? "neutral"}>
                {loading ? "Loading" : (presentation?.badge ?? "Unavailable")}
              </Badge>
            </div>
          </div>

          <div className="creator-instagram-settings__actions">
            {data?.allowedActions.initialConnect ? (
              <Button
                disabled={busy || loading}
                onClick={() => void startInitialConnect()}
              >
                Connect Instagram
              </Button>
            ) : null}
            {data?.allowedActions.revalidate ? (
              <Button
                variant="outline"
                disabled={busy || loading}
                onClick={() => void revalidate()}
              >
                <RefreshCw size={18} aria-hidden /> Revalidate
              </Button>
            ) : null}
            {data?.allowedActions.sameIdReconnect ? (
              <Button
                disabled={busy || loading}
                onClick={() => void startReconnect()}
              >
                Reconnect same account
              </Button>
            ) : null}
            {data?.allowedActions.disconnect ? (
              <Button
                variant="outline"
                disabled={busy || loading}
                onClick={() => setConfirmDisconnect(true)}
              >
                <Unplug size={18} aria-hidden /> Disconnect
              </Button>
            ) : null}
            {!data && !loading ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void reload()}
              >
                <RefreshCw size={18} aria-hidden /> Retry
              </Button>
            ) : null}
          </div>
        </div>

        <div
          className="creator-instagram-settings__status"
          role="status"
          aria-live="polite"
          aria-busy={loading}
        >
          <div>
            <h4>{loading ? "Checking Instagram…" : presentation?.title}</h4>
            <p>
              {loading
                ? "Reading the canonical provider-health state."
                : presentation?.description}
            </p>
          </div>
          {data?.identity.retained ? (
            <p className="creator-instagram-settings__handle">
              Permanent account: {data.identity.handle ?? "Identity retained"}
            </p>
          ) : null}
        </div>

        {data ? (
          <>
            <dl
              className="creator-instagram-settings__capabilities"
              aria-label="Instagram authorization capabilities"
            >
              <div>
                <dt>Profile access</dt>
                <dd>
                  {creatorInstagramCapabilityLabel(
                    data.authorization.basicCapability,
                  )}
                </dd>
              </div>
              <div>
                <dt>Insights access</dt>
                <dd>
                  {creatorInstagramCapabilityLabel(
                    data.authorization.insightsCapability,
                  )}
                </dd>
              </div>
            </dl>

            <div className="creator-instagram-settings__identity-policy">
              <ShieldCheck size={20} aria-hidden />
              <p>
                A reconnect must return the same permanent Instagram identity. A
                different account is blocked and requires manual support review.
              </p>
            </div>
          </>
        ) : null}
      </SettingsSectionCard>

      <SideDrawer
        isOpen={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        title="Disconnect Instagram"
        subtitle="Keep the permanent identity for safe recovery"
        closeLabel="Close Instagram disconnect confirmation"
        footer={
          <div className="creator-instagram-settings__drawer-actions">
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setConfirmDisconnect(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={() => void confirmDisconnectAction()}
            >
              Confirm disconnect
            </Button>
          </div>
        }
      >
        <div className="creator-instagram-settings__confirmation">
          <CircleAlert size={24} aria-hidden />
          <p>
            Active authorization will be marked revoked and future Instagram
            access will stop. The permanent provider identity and Creator Shop
            business history remain so only the same account can reconnect.
          </p>
        </div>
      </SideDrawer>
    </div>
  );
}
