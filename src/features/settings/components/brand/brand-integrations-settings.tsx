import { useState } from "react";
import { AlertTriangle, Share2 } from "lucide-react";

import { Alert, Badge, Button } from "../../../../design-system/aurora";
import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";
import { BRAND_SETTINGS_MOCK } from "../../mock/brand-settings.mock";
import { SettingsSectionCard } from "../settings-section-card";

export function BrandIntegrationsSettings() {
  const mock = BRAND_SETTINGS_MOCK.integrations;
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [syncMetrics, setSyncMetrics] = useState(mock.meta.permissions.syncMetrics);
  const [enableDm, setEnableDm] = useState(mock.meta.permissions.enableDmOutreach);
  const [profileDiscovery, setProfileDiscovery] = useState(
    mock.meta.permissions.profileDiscovery,
  );
  const [disconnectConfirmed, setDisconnectConfirmed] = useState(false);

  return (
    <>
      <div className="settings-page-stack">
        <Alert tone="warning" title="Unverified deep discovery">
          Our AI-driven website analysis identified handle{" "}
          <strong>{mock.discoveredHandle}</strong>. Authenticate via Meta OAuth below to activate
          performance tracking and outreach synchronization.
        </Alert>

        <div className="settings-integrations-grid">
          <SettingsSectionCard
            title="Meta ecosystem sync"
            description="Securely link your brand's digital presence to automate influencer discovery and manage real-time creator campaign activations."
            className="settings-integrations-grid__main"
          >
            <div className="settings-meta-header">
              <div className="settings-meta-header__brand">
                <span className="settings-meta-header__icon" aria-hidden>
                  <Share2 size={24} />
                </span>
                <div>
                  <h3 className="settings-meta-header__title">Meta Graph API</h3>
                  <Badge tone="success">Connection active</Badge>
                </div>
              </div>
              <div className="settings-meta-header__actions">
                <Button variant="outline" onClick={() => setPermissionsOpen(true)}>
                  Manage scoping
                </Button>
                <Button variant="outline" onClick={() => setDisconnectOpen(true)}>
                  Disconnect
                </Button>
              </div>
            </div>

            <div className="settings-meta-stats">
              <div>
                <p className="settings-meta-stats__label">Synced metrics</p>
                <p className="settings-meta-stats__value">{mock.meta.syncedMetrics}</p>
              </div>
              <div>
                <p className="settings-meta-stats__label">Active creators</p>
                <p className="settings-meta-stats__value">{mock.meta.activeCreators}</p>
              </div>
              <div>
                <p className="settings-meta-stats__label">Identity track</p>
                <p className="settings-meta-stats__value">{mock.meta.handle}</p>
              </div>
            </div>

            <p className="settings-meta-subline">{mock.meta.authLevel}</p>

            <div className="settings-meta-paths">
              <div className="settings-meta-path settings-meta-path--primary">
                <h4>Path A: Complete workspace automation</h4>
                <ul>
                  <li>Automated persona discovery from Brand DNA signals</li>
                  <li>Priority outreach routing into creator inboxes</li>
                  <li>Unified metric ingestion for reels, posts, and stories</li>
                </ul>
                <Button variant="primary">Sync Meta Business Manager suite</Button>
              </div>
              <div className="settings-meta-path settings-meta-path--secondary">
                <h4>Path B: Standalone profile logs</h4>
                <ul>
                  <li>Read-only performance and engagement analytics</li>
                  <li>Does not support automated matchmaking or DM outreach</li>
                </ul>
                <Button variant="outline">Connect Instagram profile only</Button>
              </div>
            </div>
          </SettingsSectionCard>

          <aside className="settings-integrations-grid__side">
            <SettingsSectionCard
              title="Pending handshakes"
              description="Resolve identity conflicts before campaigns go live."
            >
              <div className="settings-handshake-alert">
                <AlertTriangle size={18} aria-hidden />
                <div>
                  <p className="settings-handshake-alert__title">Identity mismatch</p>
                  <p className="settings-handshake-alert__sub">Meta vs Instagram</p>
                </div>
                <button
                  type="button"
                  className="settings-team__action-link"
                  onClick={() => setConflictOpen(true)}
                >
                  Resolve
                </button>
              </div>
            </SettingsSectionCard>

            <div className="settings-health-card">
              <h3>Integration health</h3>
              <p>All systems nominal across global clusters.</p>
              <div className="settings-health-card__bar">
                <div className="settings-health-card__fill" style={{ width: "94%" }} />
              </div>
              <div className="settings-health-card__meta">
                <span>94.2% uptime</span>
                <span>Stable</span>
              </div>
            </div>
          </aside>
        </div>

        <div className="settings-roadmap-row">
          <SettingsSectionCard
            title="Gmail workspace sync"
            description="Link corporate email to manage influencer negotiation pipelines from your dashboard."
          >
            <Badge tone="pending">In pipeline</Badge>
          </SettingsSectionCard>
          <SettingsSectionCard
            title="Shopify commerce & analytics hub"
            description="Integrate storefront infrastructure and conversion tracking for localized creator campaigns."
          >
            <Badge tone="neutral">Roadmap</Badge>
          </SettingsSectionCard>
        </div>
      </div>

      <SideDrawer
        isOpen={permissionsOpen}
        onClose={() => setPermissionsOpen(false)}
        title="Data scoping permissions"
        subtitle="Review granular webhook communication and data ingestion tracks allowed by your Meta integration."
        width="460px"
        footer={
          <div className="settings-drawer-footer">
            <Button variant="ghost" onClick={() => setPermissionsOpen(false)}>
              Discard &amp; close
            </Button>
            <Button variant="primary" onClick={() => setPermissionsOpen(false)}>
              Save integration settings
            </Button>
          </div>
        }
      >
        <div className="settings-drawer-body">
          <label className="settings-checkbox-row">
            <input
              type="checkbox"
              checked={syncMetrics}
              onChange={(e) => setSyncMetrics(e.target.checked)}
            />
            <div>
              <strong>Sync creator campaign metric logs</strong>
              <p>Ingest impressions, reel view counts, story reach, and engagement statistics.</p>
            </div>
          </label>
          <label className="settings-checkbox-row">
            <input
              type="checkbox"
              checked={enableDm}
              onChange={(e) => setEnableDm(e.target.checked)}
            />
            <div>
              <strong>Enable automated direct message outreach</strong>
              <p>Allow platform dispatch into target creator priority inboxes.</p>
            </div>
          </label>
          <label className="settings-checkbox-row">
            <input
              type="checkbox"
              checked={profileDiscovery}
              onChange={(e) => setProfileDiscovery(e.target.checked)}
            />
            <div>
              <strong>Profile discovery engine ingestion</strong>
              <p>Authorize audience demographic scanning to optimize brand matching.</p>
            </div>
          </label>
          <Alert tone="warning" title="Operational notice">
            Modifying permission configurations during live recruitment cycles can pause ongoing
            creator communication tracks.
          </Alert>
        </div>
      </SideDrawer>

      {conflictOpen ? (
        <div className="settings-modal-overlay" role="presentation">
          <div className="settings-modal settings-modal--wide" role="dialog">
            <h3>Meta identity conflict detected</h3>
            <p>
              The inbound authenticated Meta Business Manager suite does not match the active
              Instagram handle in Brand Centre.
            </p>
            <div className="settings-conflict-grid">
              <div>
                <p className="settings-conflict-grid__label">Active platform identity</p>
                <p>{mock.meta.identityConflict.activeHandle}</p>
              </div>
              <div>
                <p className="settings-conflict-grid__label">Inbound authenticated identity</p>
                <p>{mock.meta.identityConflict.inboundHandle}</p>
              </div>
            </div>
            <div className="settings-modal__actions">
              <Button variant="ghost" onClick={() => setConflictOpen(false)}>
                Cancel handshake
              </Button>
              <Button variant="primary" onClick={() => setConflictOpen(false)}>
                Overwrite &amp; use new identity
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {disconnectOpen ? (
        <div className="settings-modal-overlay" role="presentation">
          <div className="settings-modal" role="dialog">
            <h3>Sever Meta ecosystem data sync?</h3>
            <p>
              You are about to terminate active communication tracks, data webhooks, and performance
              ingestion pipelines with the Meta Graph API.
            </p>
            <label className="settings-modal__confirm">
              <input
                type="checkbox"
                checked={disconnectConfirmed}
                onChange={(e) => setDisconnectConfirmed(e.target.checked)}
              />
              <span>
                I verify I have administrative authority to sever this integration and pause active
                outreach.
              </span>
            </label>
            <div className="settings-modal__actions">
              <Button variant="ghost" onClick={() => setDisconnectOpen(false)}>
                Maintain active connection
              </Button>
              <Button
                variant="primary"
                disabled={!disconnectConfirmed}
                onClick={() => setDisconnectOpen(false)}
              >
                Disconnect integration
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
