import { useState } from "react";
import { History } from "lucide-react";
import { Link } from "react-router-dom";

import { Alert, Button } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import type {
  ActiveCollaborationRow,
  PendingCollaborationRowApi,
} from "../contracts/creator-campaigns.contracts";
import { useCreatorCampaignsWorkspace } from "../hooks/use-creator-campaigns-workspace";
import { displayValue } from "../utils/display-value";
import { OptionalMedia } from "./OptionalMedia";

import "../creator-campaigns.css";

type CommandView = "active" | "pending";

function collaborationHref(workflowId: string | null): string {
  if (workflowId) {
    return `${AUTH_ROUTES.creatorCollaborations}?collaboration=${encodeURIComponent(workflowId)}`;
  }
  return AUTH_ROUTES.creatorCollaborations;
}

function pendingCampaignHref(row: PendingCollaborationRowApi): string {
  const base = `${AUTH_ROUTES.creatorMarketplace}/${row.campaign_id}`;
  if (row.kind === "invitation" && row.invitation_token) {
    return `${base}?invite_token=${encodeURIComponent(row.invitation_token)}`;
  }
  return base;
}

function ProductionTable({ rows }: { rows: ActiveCollaborationRow[] }) {
  return (
    <div className="cc-production-table-wrap">
      <h2>Active Production Workspace</h2>
      {rows.length === 0 ? (
        <p className="cc-muted">-</p>
      ) : (
        <>
          <table className="cc-production-table">
            <thead>
              <tr>
                <th>Brand Identity</th>
                <th>Campaign &amp; Track</th>
                <th>Milestone Track Pipeline</th>
                <th>Phase</th>
                <th>Action role</th>
                <th>Deadline</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.collaboration_id}>
                  <td>
                    <div className="cc-row-brand">
                      <OptionalMedia
                        src={row.brand_avatar_url}
                        className="cc-row-brand__avatar"
                        placeholderClassName="cc-media-placeholder cc-row-brand__avatar"
                      />
                      <strong>{displayValue(row.brand_name)}</strong>
                    </div>
                  </td>
                  <td>
                    <strong>{displayValue(row.campaign_name)}</strong>
                    <p className="cc-row-sub">{displayValue(row.content_format)}</p>
                  </td>
                  <td>
                    <p className="cc-row-milestone">{displayValue(row.milestone_label)}</p>
                    <p className="cc-row-sub">{displayValue(row.milestone_subtext)}</p>
                  </td>
                  <td>{displayValue(row.current_phase)}</td>
                  <td>{displayValue(row.action_required_by_role)}</td>
                  <td>{displayValue(row.production_deadline_at)}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link to={collaborationHref(row.workflow_collaboration_id)}>
                      <Button
                        variant={
                          row.cta_variant === "primary"
                            ? "primary"
                            : row.cta_variant === "disabled"
                              ? "disabled"
                              : row.cta_variant === "ghost"
                                ? "ghost"
                                : "outline"
                        }
                        size="sm"
                      >
                        {displayValue(row.cta_label)}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cc-mobile-rows">
            {rows.map((row) => (
              <div key={row.collaboration_id} className="cc-mobile-row">
                <div className="cc-mobile-row__main">
                  <OptionalMedia
                    src={row.brand_avatar_url}
                    className="cc-row-brand__avatar"
                    placeholderClassName="cc-media-placeholder cc-row-brand__avatar"
                  />
                  <div className="cc-mobile-row__text">
                    <strong>{displayValue(row.brand_name)}</strong>
                    <span>
                      {displayValue(row.content_format)} · {displayValue(row.milestone_label)}
                    </span>
                  </div>
                </div>
                <Link to={collaborationHref(row.workflow_collaboration_id)}>
                  <Button
                    variant={row.cta_variant === "primary" ? "primary" : "outline"}
                    size="sm"
                  >
                    {displayValue(row.cta_label)}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PendingTable({ rows }: { rows: PendingCollaborationRowApi[] }) {
  return (
    <div className="cc-production-table-wrap">
      <h2>Pending Applications Pipeline</h2>
      {rows.length === 0 ? (
        <p className="cc-muted">-</p>
      ) : (
        <>
          <table className="cc-production-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Campaign</th>
                <th>Status</th>
                <th>Phase</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.collaboration_id}>
                  <td>
                    <div className="cc-row-brand">
                      <OptionalMedia
                        src={row.brand_avatar_url}
                        className="cc-row-brand__avatar"
                        placeholderClassName="cc-media-placeholder cc-row-brand__avatar"
                      />
                      <strong>{displayValue(row.brand_name)}</strong>
                    </div>
                  </td>
                  <td>
                    <strong>{displayValue(row.campaign_name)}</strong>
                  </td>
                  <td>
                    <p className="cc-row-milestone">{displayValue(row.status_label)}</p>
                    <p className="cc-row-sub">{displayValue(row.context_copy)}</p>
                  </td>
                  <td>{displayValue(row.current_phase)}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link to={pendingCampaignHref(row)}>
                      <Button
                        variant={row.kind === "invitation" ? "primary" : "ghost"}
                        size="sm"
                      >
                        {displayValue(row.cta_label)}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cc-mobile-rows">
            {rows.map((row) => (
              <div key={row.collaboration_id} className="cc-mobile-row">
                <div className="cc-mobile-row__main">
                  <OptionalMedia
                    src={row.brand_avatar_url}
                    className="cc-row-brand__avatar"
                    placeholderClassName="cc-media-placeholder cc-row-brand__avatar"
                  />
                  <div className="cc-mobile-row__text">
                    <strong>{displayValue(row.brand_name)}</strong>
                    <span>{displayValue(row.status_label)}</span>
                  </div>
                </div>
                <Link to={pendingCampaignHref(row)}>
                  <Button variant={row.kind === "invitation" ? "primary" : "ghost"} size="sm">
                    {displayValue(row.cta_label)}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function CommandCenterWorkspace() {
  const [view, setView] = useState<CommandView>("active");
  const { workspace, loading, error } = useCreatorCampaignsWorkspace({
    currentView: view === "active" ? "ACTIVE_PRODUCTION" : "PENDING_APPLICATIONS",
  });
  const showVelocity = view === "active";

  const activeCount = workspace?.active_count ?? 0;
  const pendingCount = workspace?.pending_count ?? 0;
  const completedCount = workspace?.completed_count ?? 0;
  const velocityAlerts = workspace?.velocity_alerts ?? [];
  const activeRows = workspace?.active_rows ?? [];
  const pendingRows = workspace?.pending_rows ?? [];

  return (
    <div className="cc-workspace">
      <header className="cc-command-header">
        <h1 className="cc-page-title">Campaigns Command Center</h1>
        <Link to={AUTH_ROUTES.creatorCampaignsHistory}>
          <Button variant="outline">
            <History size={18} style={{ marginRight: 8 }} aria-hidden />
            View History ({completedCount})
          </Button>
        </Link>
      </header>

      {error ? (
        <div className="cc-alert-block">
          <Alert tone="error" title="Could not load workspace">
            {error}
          </Alert>
        </div>
      ) : null}

      {loading ? <p className="cc-muted">Loading workspace…</p> : null}

      <div className="cc-view-switcher" role="tablist" aria-label="Workspace view">
        <button
          type="button"
          role="tab"
          aria-selected={view === "active"}
          className={`cc-view-switcher__btn ${view === "active" ? "cc-view-switcher__btn--active" : ""}`}
          onClick={() => setView("active")}
        >
          <span className="cc-view-switcher__pulse" />
          Active Production ({activeCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "pending"}
          className={`cc-view-switcher__btn ${view === "pending" ? "cc-view-switcher__btn--active" : ""}`}
          onClick={() => setView("pending")}
        >
          Pending Applications ({pendingCount})
        </button>
      </div>

      {showVelocity && !loading ? (
        <section className="cc-velocity-panel" aria-label="Critical velocity alerts">
          {velocityAlerts.length === 0 ? (
            <p className="cc-muted">No velocity alerts.</p>
          ) : (
            velocityAlerts.map((alert) => (
              <div
                key={alert.collaboration_id}
                className={`cc-velocity-alert ${alert.tone === "critical" ? "cc-velocity-alert--critical" : ""}`}
              >
                <div>
                  <h3>{displayValue(alert.headline)}</h3>
                  <p>{displayValue(alert.body)}</p>
                </div>
                <Link
                  to={
                    alert.campaign_id
                      ? `${AUTH_ROUTES.creatorMarketplace}/${alert.campaign_id}`
                      : AUTH_ROUTES.creatorCampaigns
                  }
                >
                  <Button variant={alert.tone === "critical" ? "secondary" : "primary"}>
                    {displayValue(alert.cta_label)}
                  </Button>
                </Link>
              </div>
            ))
          )}
        </section>
      ) : null}

      {!loading && view === "active" ? <ProductionTable rows={activeRows} /> : null}
      {!loading && view === "pending" ? <PendingTable rows={pendingRows} /> : null}
    </div>
  );
}
