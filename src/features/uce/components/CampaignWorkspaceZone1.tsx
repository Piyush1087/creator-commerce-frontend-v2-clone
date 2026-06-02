import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AUTH_ROUTES } from "../../../features/auth/constants";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Share2,
  Lightbulb,
  UserSearch,
  Wallet,
} from "lucide-react";
import type { CampaignShellResponse } from "../contracts/brand-uce.contracts";
import { displayField, EMPTY_FIELD } from "../utils/display-field";
import {
  formatCurrency,
  formatIsoDateRange,
  formatObjective,
  formatStatus,
} from "../utils/uce-format";

type CampaignWorkspaceZone1Props = {
  shell: CampaignShellResponse | null;
  onOpenShareRouter?: () => void;
  onStatusChange?: (nextActive: boolean) => void;
  statusUpdating?: boolean;
};

function formatPlatformDeliverables(value: unknown): string {
  if (!value || typeof value !== "object") return EMPTY_FIELD;
  if (!Array.isArray(value)) return EMPTY_FIELD;
  const parts = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const platform = (entry as { platform?: string }).platform;
      const formats = (entry as { formats?: string[] }).formats;
      if (!platform) return null;
      const fmt =
        formats && formats.length > 0 ? formats.join(", ") : EMPTY_FIELD;
      return `${platform}: ${fmt}`;
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : EMPTY_FIELD;
}

function timelineLabel(shell: CampaignShellResponse | null): string {
  const z = shell?.zone_1_master;
  if (!z) return EMPTY_FIELD;
  if (z.timeline_type === "FIXED_DATES") return "Fixed dates";
  if (z.timeline_type === "DYNAMIC_MILESTONES") return "Dynamic milestones";
  return displayField(z.timeline_type);
}

export function CampaignWorkspaceZone1({
  shell,
  onOpenShareRouter,
  onStatusChange,
  statusUpdating = false,
}: CampaignWorkspaceZone1Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isActive = shell?.current_status === "ACTIVE";

  useEffect(() => {
    if (shell?.current_status) {
      /* sync external status */
    }
  }, [shell?.current_status]);

  const campaignName = shell?.campaign_name ?? EMPTY_FIELD;
  const spend = shell?.performance_aggregate?.total_spend_to_date;
  const allocated = shell?.zone_1_master?.budget_pool;

  const dash = EMPTY_FIELD;

  return (
    <div className={`uce-zone1 ${isExpanded ? "" : "uce-zone1--collapsed"}`}>
      <nav className="uce-zone1-breadcrumb" aria-label="Breadcrumb">
        <Link to={AUTH_ROUTES.brandUceCampaigns}>Campaigns</Link>
        <span aria-hidden="true">›</span>
        <span className="uce-zone1-breadcrumb-current">{campaignName}</span>
      </nav>

      {shell?.pause_warning ? (
        <p className="uce-zone1-pause-warning">{shell.pause_warning}</p>
      ) : null}

      <section className="uce-glass-card uce-zone1-hero">
        <div className="uce-zone1-hero-inner">
          <div className="uce-zone1-hero-main">
            <div className="uce-zone1-title-row">
              <h1 className="uce-zone1-title">{campaignName}</h1>
              <span
                className={`uce-zone1-status-pulse ${isActive ? "uce-zone1-status-pulse--live" : "uce-zone1-status-pulse--paused"}`}
                title={formatStatus(shell?.current_status)}
              />
            </div>
            <div className="uce-zone1-meta-row">
              <span className="uce-zone1-objective-pill">
                {formatObjective(shell?.zone_1_master?.core_objective)}
              </span>
              <p className="uce-zone1-budget-line">
                Budget Spent: <strong>{formatCurrency(spend)}</strong>
                <span className="uce-zone1-budget-sep">/</span>
                Allocated Limit:{" "}
                <span className="uce-zone1-budget-muted">
                  {formatCurrency(allocated)}
                </span>
              </p>
            </div>
          </div>

          <div className="uce-zone1-controls">
            <label className="uce-active-toggle">
              <input
                type="checkbox"
                checked={isActive}
                disabled={!shell || statusUpdating || shell.current_status === "COMPLETED"}
                onChange={(e) => onStatusChange?.(e.target.checked)}
              />
              <span className="uce-active-toggle-track" />
              <span className="uce-active-toggle-label">
                {formatStatus(shell?.current_status)}
              </span>
            </label>
            <button type="button" className="uce-zone1-icon-btn" title="Edit (not wired)">
              <Pencil size={18} />
            </button>
            <button
              type="button"
              className="uce-zone1-icon-btn"
              title="Open Universal Router"
              onClick={onOpenShareRouter}
            >
              <Share2 size={18} />
            </button>
            <button
              type="button"
              className="uce-zone1-icon-btn uce-zone1-icon-btn--collapse"
              title={isExpanded ? "Collapse strategy" : "Expand strategy"}
              onClick={() => setIsExpanded((v) => !v)}
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>
      </section>

      {isExpanded && (
        <div className="uce-zone1-panels">
          <section className="uce-glass-card uce-zone1-panel">
            <header className="uce-zone1-panel-head">
              <div className="uce-zone1-panel-icon uce-zone1-panel-icon--indigo">
                <Lightbulb size={20} />
              </div>
              <h3>Strategy</h3>
            </header>
            <div className="uce-zone1-panel-body uce-zone1-grid-4">
              <div>
                <p className="uce-field-label">Deadline Tracking</p>
                <p className="uce-field-value">{timelineLabel(shell)}</p>
              </div>
              <div>
                <p className="uce-field-label">Target Date Range</p>
                <p className="uce-field-value">
                  {shell?.zone_1_master
                    ? formatIsoDateRange(
                        shell.zone_1_master.fixed_start_date,
                        shell.zone_1_master.fixed_end_date,
                      )
                    : dash}
                </p>
              </div>
              <div>
                <p className="uce-field-label">Dynamic days limit</p>
                <p className="uce-field-value">
                  {shell?.zone_1_master?.dynamic_days_limit != null
                    ? String(shell.zone_1_master.dynamic_days_limit)
                    : dash}
                </p>
              </div>
              <div>
                <p className="uce-field-label">Channels</p>
                <p className="uce-field-value">
                  {formatPlatformDeliverables(
                    shell?.zone_1_master?.platform_deliverables,
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="uce-glass-card uce-zone1-panel">
            <header className="uce-zone1-panel-head">
              <div className="uce-zone1-panel-icon uce-zone1-panel-icon--emerald">
                <UserSearch size={20} />
              </div>
              <h3>Targeting</h3>
            </header>
            <div className="uce-zone1-panel-body uce-zone1-grid-3">
              <div>
                <p className="uce-field-label">Archetype Vectors</p>
                <p className="uce-field-value">{dash}</p>
              </div>
              <div>
                <p className="uce-field-label">Operational Scope</p>
                <p className="uce-field-value">{dash}</p>
              </div>
              <div>
                <p className="uce-field-label">Geographies</p>
                <p className="uce-field-value">{dash}</p>
              </div>
              <p className="uce-field-hint">
                Targeting is stored on create but not returned in campaign shell API yet.
              </p>
            </div>
          </section>

          <section className="uce-glass-card uce-zone1-panel">
            <header className="uce-zone1-panel-head">
              <div className="uce-zone1-panel-icon uce-zone1-panel-icon--amber">
                <Wallet size={20} />
              </div>
              <h3>Commercials &amp; Escrow</h3>
            </header>
            <div className="uce-zone1-panel-body uce-zone1-grid-2">
              <div className="uce-commercial-col">
                <p className="uce-field-label uce-field-label--section">
                  Logistics &amp; Inventory
                </p>
                <p className="uce-field-value">{dash}</p>
              </div>
              <div className="uce-commercial-col">
                <p className="uce-field-label uce-field-label--section">
                  Financial Terms
                </p>
                <p className="uce-field-value">{dash}</p>
              </div>
              <p className="uce-field-hint">
                Commercial breakdown not in shell API; budget pool shown in hero only.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
