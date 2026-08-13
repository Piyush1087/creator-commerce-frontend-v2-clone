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
import { EMPTY_FIELD } from "../utils/display-field";
import {
  formatCommercialFinancialTerms,
  formatCommercialLogistics,
  formatCurrency,
  formatDynamicDaysLimit,
  formatIsoDateRange,
  formatObjective,
  formatPlatformDeliverables,
  formatStatus,
  formatStringList,
  formatTargetingOperationalScope,
} from "../utils/uce-format";

type CampaignWorkspaceZone1Props = {
  shell: CampaignShellResponse | null;
  onOpenShareRouter?: () => void;
  onStatusChange?: (nextActive: boolean) => void;
  onOpenEdit?: () => void;
  statusUpdating?: boolean;
};

function timelineLabel(shell: CampaignShellResponse | null): string {
  const z = shell?.zone_1_master;
  if (!z) return EMPTY_FIELD;
  if (z.timeline_type === "FIXED_DATES") return "Fixed dates";
  if (z.timeline_type === "DYNAMIC_MILESTONES") return "Dynamic milestones";
  return z.timeline_type.replace(/_/g, " ");
}

export function CampaignWorkspaceZone1({
  shell,
  onOpenShareRouter,
  onStatusChange,
  onOpenEdit,
  statusUpdating = false,
}: CampaignWorkspaceZone1Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isActive = shell?.current_status === "LIVE";

  useEffect(() => {
    if (shell?.current_status) {
      /* sync external status */
    }
  }, [shell?.current_status]);

  const campaignName = shell?.campaign_name ?? EMPTY_FIELD;
  const spend = shell?.performance_aggregate?.total_spend_to_date;
  const allocated = shell?.zone_1_master?.budget_pool;
  const inventoryTotal = shell?.total_inventory_allocated ?? 0;
  const productCount = shell?.zone_2_tactics?.products.length ?? 0;
  const canEdit = shell?.can_edit_essentials ?? false;
  const targeting = shell?.zone_1_targeting;
  const commercials = shell?.zone_1_commercials;

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
              <p className="uce-zone1-inventory-line">
                Inventory Allocated:{" "}
                <strong>{inventoryTotal}</strong>
                {productCount > 0 ? (
                  <span className="uce-zone1-budget-muted">
                    {" "}
                    unit{inventoryTotal === 1 ? "" : "s"} across {productCount} product
                    {productCount === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span className="uce-zone1-budget-muted"> — no products linked</span>
                )}
              </p>
            </div>
          </div>

          <div className="uce-zone1-controls">
            <label className="uce-active-toggle">
              <input
                type="checkbox"
                checked={isActive}
                disabled={!shell || statusUpdating || shell.current_status === "COMPLETED" || shell.current_status === "ARCHIVED"}
                onChange={(e) => onStatusChange?.(e.target.checked)}
              />
              <span className="uce-active-toggle-track" />
              <span className="uce-active-toggle-label">
                {formatStatus(shell?.current_status)}
              </span>
            </label>
            <button
              type="button"
              className="uce-zone1-icon-btn"
              title={
                canEdit
                  ? "Edit campaign name, budget, and inventory"
                  : "Locked after creator applications or active collaborations"
              }
              disabled={!shell || !canEdit}
              onClick={onOpenEdit}
            >
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
                    : EMPTY_FIELD}
                </p>
              </div>
              <div>
                <p className="uce-field-label">Dynamic days limit</p>
                <p className="uce-field-value">
                  {formatDynamicDaysLimit(
                    shell?.zone_1_master?.timeline_type,
                    shell?.zone_1_master?.dynamic_days_limit,
                  )}
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
                <p className="uce-field-value">
                  {formatStringList(targeting?.creator_archetypes)}
                </p>
              </div>
              <div>
                <p className="uce-field-label">Operational Scope</p>
                <p className="uce-field-value">
                  {formatTargetingOperationalScope(targeting)}
                </p>
              </div>
              <div>
                <p className="uce-field-label">Geographies</p>
                <p className="uce-field-value">
                  {formatStringList(targeting?.target_locations)}
                </p>
              </div>
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
                <p className="uce-field-value">
                  {formatCommercialLogistics(commercials)}
                </p>
              </div>
              <div className="uce-commercial-col">
                <p className="uce-field-label uce-field-label--section">
                  Financial Terms
                </p>
                <p className="uce-field-value">
                  {formatCommercialFinancialTerms(commercials)}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
