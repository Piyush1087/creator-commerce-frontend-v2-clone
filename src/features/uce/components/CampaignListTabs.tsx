import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Edit2, Download, PlusCircle, Archive } from "lucide-react";
import { Alert } from "../../../design-system/aurora";
import { Button } from "../../../design-system/aurora/components/Button";
import { Card } from "../../../design-system/aurora/components/Card";
import { Toggle } from "../../../design-system/aurora/components/Toggle";
import {
  fetchCampaignList,
  fetchCampaignListAggregates,
  patchCampaignStatus,
} from "../api/brand-uce-client";
import type {
  CampaignListAggregates,
  CampaignListRow,
  UceCampaignObjective,
  UceCampaignStatus,
} from "../contracts/brand-uce.contracts";
import { useUceApiJson } from "../hooks/use-uce-api-json";
import { displayField, EMPTY_FIELD } from "../utils/display-field";
import {
  budgetPercent,
  buildCampaignDetailPath,
  formatCompactCurrency,
  formatCurrency,
  formatObjective,
  formatStatus,
  pipelineBarSegments,
} from "../utils/uce-format";
import "./CampaignListTabs.css";

type TabType = "operations" | "financial";

export function CampaignListTabs() {
  const [activeTab, setActiveTab] = useState<TabType>("operations");

  return (
    <div className="campaign-list-tabs">
      <div className="campaign-list-tabs__header">
        <div className="aurora-tabs" role="tablist">
          <button
            className={`aurora-tab ${activeTab === "operations" ? "aurora-tab--active" : ""}`}
            onClick={() => setActiveTab("operations")}
            role="tab"
            type="button"
          >
            Campaigns (Operations & Status)
          </button>
          <button
            className={`aurora-tab ${activeTab === "financial" ? "aurora-tab--active" : ""}`}
            onClick={() => setActiveTab("financial")}
            role="tab"
            type="button"
          >
            Spend Report (Financial Performance)
          </button>
        </div>
      </div>

      <div className="campaign-list-tabs__content">
        {activeTab === "operations" ? <OperationsTab /> : <FinancialTab />}
      </div>
    </div>
  );
}

function OperationsTab() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [objectiveFilter, setObjectiveFilter] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [localRows, setLocalRows] = useState<CampaignListRow[] | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLocalRows(null);
  }, [debouncedSearch, objectiveFilter, showArchived]);

  const listFetcher = useCallback(
    () =>
      fetchCampaignList({
        search: debouncedSearch.trim() || undefined,
        objective: objectiveFilter
          ? (objectiveFilter as UceCampaignObjective)
          : undefined,
        status: showArchived ? "ARCHIVED" : undefined,
      }),
    [debouncedSearch, objectiveFilter, showArchived],
  );

  const { state, reload } = useUceApiJson(true, listFetcher);

  const campaigns = localRows ?? (state.status === "ready" ? state.data : []);

  const visibleCampaigns = useMemo(
    () =>
      showArchived
        ? campaigns
        : campaigns.filter(
            (c) =>
              c.current_status !== "ARCHIVED" &&
              c.current_status !== "COMPLETED",
          ),
    [campaigns, showArchived],
  );

  const toggleStatus = async (row: CampaignListRow) => {
    setStatusError(null);
    const next: UceCampaignStatus =
      row.current_status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await patchCampaignStatus(row.campaign_id, next);
      setLocalRows((prev) => {
        const base = prev ?? campaigns;
        return base.map((c) =>
          c.campaign_id === row.campaign_id
            ? { ...c, current_status: next }
            : c,
        );
      });
      void reload({ silent: true });
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : "Could not update campaign status.",
      );
    }
  };

  const toggleRowSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleCampaigns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleCampaigns.map((c) => c.campaign_id)));
    }
  };

  return (
    <div className="operations-tab">
      {statusError ? (
        <Alert tone="error" title="Status update failed">
          {statusError}
        </Alert>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Could not load campaigns">
          {state.message}
        </Alert>
      ) : null}

      <div className="operations-tab__filters">
        <div className="search-box">
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder="Search campaigns by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            className="aurora-select"
            value={objectiveFilter}
            onChange={(e) => setObjectiveFilter(e.target.value)}
          >
            <option value="">All Objectives</option>
            <option value="BRAND_AWARENESS">Brand Awareness</option>
            <option value="TRAFFIC_CLICKS">Traffic & Clicks</option>
            <option value="SALES_CONVERSIONS">Sales & Conversions</option>
          </select>
          <button
            type="button"
            className={`operations-archived-btn ${showArchived ? "is-active" : ""}`}
            onClick={() => setShowArchived((v) => !v)}
          >
            <Archive size={16} />
            {showArchived ? "Back to Active List" : "View Archived"}
          </button>
        </div>
      </div>

      <Card className="operations-tab__table-card">
        {state.status === "loading" ? (
          <p className="operations-loading">Loading campaigns…</p>
        ) : (
          <div className="uce-table-scroll">
            <table className="performance-matrix">
              <thead>
                <tr>
                  <th className="ops-th-check">
                    <input
                      type="checkbox"
                      aria-label="Select all campaigns"
                      checked={
                        visibleCampaigns.length > 0 &&
                        selectedIds.size === visibleCampaigns.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Campaign Context</th>
                  <th>Status Toggle</th>
                  <th>Influencer Pipeline</th>
                  <th>Budget Consumption</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="operations-empty-row">
                      No {showArchived ? "completed" : "active"} campaigns in this view.
                    </td>
                  </tr>
                ) : (
                  visibleCampaigns.map((campaign) => {
                    const pct = budgetPercent(
                      campaign.total_spend_to_date,
                      campaign.budget_pool,
                    );
                    const [p1, p2, p3] = pipelineBarSegments(
                      campaign.prospects_count,
                      campaign.applicants_count,
                      campaign.active_collabs_count,
                    );
                    const pipelineTotal =
                      campaign.prospects_count +
                      campaign.applicants_count +
                      campaign.active_collabs_count;

                    return (
                      <tr
                        key={campaign.campaign_id}
                        className={`campaign-row-clickable ${selectedIds.has(campaign.campaign_id) ? "is-selected" : ""}`}
                        onClick={() =>
                          navigate(buildCampaignDetailPath(campaign.campaign_id))
                        }
                      >
                        <td
                          className="ops-td-check"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            aria-label={`Select ${campaign.campaign_name}`}
                            checked={selectedIds.has(campaign.campaign_id)}
                            onChange={() => toggleRowSelected(campaign.campaign_id)}
                          />
                        </td>
                        <td className="campaign-name">
                          <div className="campaign-context-cell">
                            <div>
                              <strong>{displayField(campaign.campaign_name)}</strong>
                            </div>
                            <div className="campaign-context-chips">
                              <span className="uce-objective-pill">
                                {formatObjective(campaign.core_objective)}
                              </span>
                              <span className="uce-products-chip">
                                {campaign.product_count} Product
                                {campaign.product_count === 1 ? "" : "s"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="status-toggle-cell">
                            {campaign.current_status === "COMPLETED" ||
                            campaign.current_status === "ARCHIVED" ||
                            campaign.current_status === "DRAFT" ? (
                              <span className="status-toggle-cell__static">
                                {formatStatus(campaign.current_status)}
                              </span>
                            ) : (
                              <Toggle
                                checked={campaign.current_status === "ACTIVE"}
                                onChange={() => void toggleStatus(campaign)}
                                label={formatStatus(campaign.current_status)}
                              />
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="ops-pipeline-cell">
                            <div
                              className="ops-mini-bar ops-mini-bar--pipeline"
                              role="img"
                              aria-label={`Pipeline: ${pipelineTotal} creators`}
                            >
                              {p1 > 0 && (
                                <span
                                  style={{ width: `${p1}%` }}
                                  className="seg-prospects"
                                />
                              )}
                              {p2 > 0 && (
                                <span
                                  style={{ width: `${p2}%` }}
                                  className="seg-applicants"
                                />
                              )}
                              {p3 > 0 && (
                                <span
                                  style={{ width: `${p3}%` }}
                                  className="seg-active"
                                />
                              )}
                            </div>
                            <span className="ops-mini-label">
                              {pipelineTotal > 0
                                ? `${pipelineTotal} Creators`
                                : EMPTY_FIELD}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="ops-budget-cell">
                            <div className="ops-mini-bar ops-mini-bar--budget">
                              <span style={{ width: `${pct}%` }} />
                            </div>
                            <span className="ops-budget-text">
                              {formatCompactCurrency(campaign.total_spend_to_date)} /{" "}
                              {formatCompactCurrency(campaign.budget_pool)}
                            </span>
                            <small>
                              ({campaign.budget_pool > 0 ? `${pct}%` : EMPTY_FIELD})
                            </small>
                          </div>
                        </td>
                        <td className="actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            title="Open campaign workspace"
                            onClick={() =>
                              navigate(buildCampaignDetailPath(campaign.campaign_id))
                            }
                          >
                            <Eye size={18} />
                          </button>
                          <button type="button" title="Edit campaign (not wired)">
                            <Edit2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function FinancialTab() {
  const aggregatesFetcher = useCallback(() => fetchCampaignListAggregates(), []);
  const { state } = useUceApiJson(true, aggregatesFetcher);
  const data: CampaignListAggregates | null =
    state.status === "ready" ? state.data : null;

  const dash = EMPTY_FIELD;

  return (
    <div className="financial-tab">
      {state.status === "error" ? (
        <Alert tone="error" title="Could not load aggregates">
          {state.message}
        </Alert>
      ) : null}

      <div className="financial-control-strip">
        <div className="period-toggle">
          <button type="button" className="period-btn" disabled>
            7D ({dash})
          </button>
          <button type="button" className="period-btn" disabled>
            30D ({dash})
          </button>
          <button type="button" className="period-btn" disabled>
            90D ({dash})
          </button>
          <button type="button" className="period-btn" disabled>
            Custom Range ({dash})
          </button>
        </div>
        <Button variant="outline" className="download-btn" disabled>
          <Download size={18} />
          <span>Download Snapshot Report (CSV) — {dash}</span>
        </Button>
      </div>

      <div className="financial-insights-grid">
        <Card className="insight-card">
          <h3 className="insight-eyebrow">ACTIVE CAMPAIGN SPEND (API)</h3>
          <p className="insight-metric-lg">
            {state.status === "loading"
              ? "Loading…"
              : formatCurrency(data?.total_active_spend)}
          </p>
          <p className="insight-metric-sub">
            Active campaigns:{" "}
            {data != null ? String(data.active_campaign_count) : dash}
          </p>
        </Card>

        <Card className="insight-card">
          <h3 className="insight-eyebrow">TOTAL IMPRESSIONS (API)</h3>
          <p className="insight-metric-lg">
            {state.status === "loading"
              ? "Loading…"
              : data
                ? new Intl.NumberFormat("en-US").format(
                    Number(data.total_impressions) || 0,
                  )
                : dash}
          </p>
          <p className="insight-metric-sub">
            Pipeline bottlenecks (applicants + active):{" "}
            {data != null ? String(data.pipeline_bottlenecks) : dash}
          </p>
        </Card>

        <Card className="insight-card">
          <h3 className="insight-eyebrow">CAPITAL BURN ALLOCATION</h3>
          <p className="insight-metric-lg">{dash}</p>
          <p className="insight-metric-sub">No brand-wide financial breakdown API yet.</p>
        </Card>

        <Card className="insight-card">
          <h3 className="insight-eyebrow">LOGISTICS & OPERATIONAL SAFETY</h3>
          <p className="insight-metric-lg">{dash}</p>
          <p className="insight-metric-sub">Not exposed on aggregates endpoint.</p>
        </Card>
      </div>

      <Card title="Performance Ledger Matrix" className="ledger-matrix-card" compact>
        <p className="uce-financial-placeholder">
          Creator-level ledger rows: {dash} (no financial ledger API).
        </p>
      </Card>

      <Card className="protection-ledger-final">
        <h3 className="protection-title">MULTI-TENANT FINANCIAL PROTECTION LEDGER</h3>
        <div className="protection-grid-final">
          <div className="p-unit">
            <span className="p-val">{dash}</span>
            <span className="p-desc">Global Master Budget Limit Allocation</span>
          </div>
          <div className="p-unit">
            <span className="p-val">{dash}</span>
            <span className="p-desc">Product Sub-Ceiling Limit Consumption Threshold</span>
          </div>
          <div className="p-unit">
            <span className="p-val">{dash}</span>
            <span className="p-desc">Secured Funds (Escrow Protected Value)</span>
          </div>
        </div>
      </Card>

      <div className="quick-draft-zone">
        <PlusCircle size={32} className="text-primary" />
        <strong>Quick Draft</strong>
        <span>New Concept ({dash})</span>
      </div>
    </div>
  );
}
