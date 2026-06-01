import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, Edit2, Download, PlusCircle, Archive } from "lucide-react";
import { Button } from "../../../design-system/aurora/components/Button";
import { Card } from "../../../design-system/aurora/components/Card";
import { Badge } from "../../../design-system/aurora/components/Badge";
import { Toggle } from "../../../design-system/aurora/components/Toggle";
import { buildCampaignDetailPath, MOCK_CAMPAIGNS, MOCK_SPEND_REPORT } from "../mock-data/campaigns";
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
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);

  const visibleCampaigns = campaigns.filter((c) =>
    showArchived ? c.status === "ARCHIVED" : c.status !== "ARCHIVED",
  );

  const toggleStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "LIVE" ? "PAUSED" : "LIVE" }
          : c,
      ),
    );
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
      setSelectedIds(new Set(visibleCampaigns.map((c) => c.id)));
    }
  };

  const budgetPct = (consumed: number, total: number) =>
    total > 0 ? Math.round((consumed / total) * 100) : 0;

  return (
    <div className="operations-tab">
      <div className="operations-tab__filters">
        <div className="search-box">
          <Search size={18} className="text-muted" />
          <input type="text" placeholder="Search campaigns by name or ID..." />
        </div>
        <div className="filter-group">
          <select className="aurora-select" defaultValue="">
            <option value="">All Objectives</option>
            <option value="awareness">Awareness</option>
            <option value="sales">Sales</option>
            <option value="traffic">Traffic</option>
          </select>
          <select className="aurora-select" defaultValue="">
            <option value="">All Timeline Rules</option>
            <option value="fixed">Fixed Duration</option>
            <option value="ongoing">Ongoing Pipeline</option>
          </select>
          <Button variant="outline" className="filter-btn">
            <Filter size={16} />
            More Filters
          </Button>
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
                <th>Launch Timeline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="operations-empty-row">
                    No {showArchived ? "archived" : "active"} campaigns in this view.
                  </td>
                </tr>
              ) : (
                visibleCampaigns.map((campaign) => {
                  const pct = budgetPct(
                    campaign.budget.consumed,
                    campaign.budget.total,
                  );
                  const [p1, p2, p3] = campaign.pipelineBar;
                  return (
                    <tr
                      key={campaign.id}
                      className={`campaign-row-clickable ${selectedIds.has(campaign.id) ? "is-selected" : ""}`}
                      onClick={() => navigate(buildCampaignDetailPath(campaign.id))}
                    >
                      <td className="ops-td-check" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${campaign.name}`}
                          checked={selectedIds.has(campaign.id)}
                          onChange={() => toggleRowSelected(campaign.id)}
                        />
                      </td>
                      <td className="campaign-name">
                        <div className="campaign-context-cell">
                          <div>
                            <strong>{campaign.name}</strong>
                            <span className="campaign-id-line">{campaign.id}</span>
                          </div>
                          <div className="campaign-context-chips">
                            <span className="uce-objective-pill">{campaign.objective}</span>
                            <span className="uce-products-chip">
                              {campaign.productsConnected} Product
                              {campaign.productsConnected === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="status-toggle-cell">
                          <Toggle
                            checked={campaign.status === "LIVE"}
                            onChange={() => toggleStatus(campaign.id)}
                            label={campaign.status}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="ops-pipeline-cell">
                          <div
                            className="ops-mini-bar ops-mini-bar--pipeline"
                            role="img"
                            aria-label={`Pipeline: ${campaign.influencerCount} creators`}
                          >
                            {p1 > 0 && (
                              <span style={{ width: `${p1}%` }} className="seg-prospects" />
                            )}
                            {p2 > 0 && (
                              <span style={{ width: `${p2}%` }} className="seg-applicants" />
                            )}
                            {p3 > 0 && (
                              <span style={{ width: `${p3}%` }} className="seg-active" />
                            )}
                          </div>
                          <span className="ops-mini-label">
                            {campaign.influencerCount} Creators
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="ops-budget-cell">
                          <div className="ops-mini-bar ops-mini-bar--budget">
                            <span style={{ width: `${pct}%` }} />
                          </div>
                          <span className="ops-budget-text">
                            ${(campaign.budget.consumed / 1000).toFixed(1)}k / $
                            {(campaign.budget.total / 1000).toFixed(1)}k
                          </span>
                          <small>({pct}%)</small>
                        </div>
                      </td>
                      <td>
                        <div className="ops-timeline-cell">
                          <span className="ops-timeline-rule">{campaign.timelineRule}</span>
                          <span className="ops-timeline-date">Ends {campaign.endDate}</span>
                        </div>
                      </td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          title="Open campaign workspace"
                          onClick={() => navigate(buildCampaignDetailPath(campaign.id))}
                        >
                          <Eye size={18} />
                        </button>
                        <button type="button" title="Edit campaign">
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
      </Card>
    </div>
  );
}

function FinancialTab() {
  const data = MOCK_SPEND_REPORT;

  return (
    <div className="financial-tab">
      {/* SECTION A: PERIOD & CONTROL STRIP AREA */}
      <div className="financial-control-strip">
        <div className="period-toggle">
          <button className="period-btn">7D</button>
          <button className="period-btn active">30D</button>
          <button className="period-btn">90D</button>
          <button className="period-btn">Custom Range</button>
        </div>
        <Button variant="outline" className="download-btn">
          <Download size={18} />
          <span>Download Snapshot Report (CSV)</span>
        </Button>
      </div>

      {/* SECTION B: VISUAL INSIGHTS ENGINE */}
      <div className="financial-insights-grid">
        {/* Card 1: CAPITAL BURN ALLOCATION */}
        <Card className="insight-card">
          <h3 className="insight-eyebrow">CAPITAL BURN ALLOCATION</h3>
          <div className="donut-chart-wrap">
            <div className="donut-chart">
              <span className="donut-value">$20,000</span>
            </div>
          </div>
          <div className="insight-legend">
            <div className="legend-item">
              <span className="dot dot-primary"></span>
              <span>Settled Payouts</span>
              <strong>$12,400</strong>
            </div>
            <div className="legend-item">
              <span className="dot dot-fixed-dim"></span>
              <span>Committed Escrow</span>
              <strong>$6,100</strong>
            </div>
            <div className="legend-item">
              <span className="dot dot-container"></span>
              <span>Unallocated Cap Floor</span>
              <strong>$1,500</strong>
            </div>
          </div>
        </Card>

        {/* Card 2: LOGISTICS & OPERATIONAL SAFETY */}
        <Card className="insight-card">
          <h3 className="insight-eyebrow">LOGISTICS & OPERATIONAL SAFETY</h3>
          <div className="logistics-metrics">
            <div className="metric-unit">
              <span>In-Transit Transit Milestone Tracking</span>
              <strong>12 Shipments</strong>
            </div>
            <div className="metric-unit">
              <span>Delivered Customs Gateways Clear</span>
              <strong>28 Shipments</strong>
            </div>
            <div className="metric-unit">
              <span>Stalled Pipeline Exceptions</span>
              <div className="alert-wrap">
                <strong>3 Delayed Shipments</strong>
                <Badge tone="error" className="amber-alert">Amber Alert</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: AUDIENCE REACH DISTRIBUTION */}
        <Card className="insight-card">
          <h3 className="insight-eyebrow">AUDIENCE REACH DISTRIBUTION</h3>
          <div className="reach-metrics">
            <div className="reach-unit">
              <div className="unit-header">
                <span>Macro-Influencer Footprint Threshold</span>
                <strong>15%</strong>
              </div>
              <div className="unit-bar"><div style={{ width: "15%" }}></div></div>
            </div>
            <div className="reach-unit">
              <div className="unit-header">
                <span>Mid-Tier Catalyst Footprint Threshold</span>
                <strong>35%</strong>
              </div>
              <div className="unit-bar"><div style={{ width: "35%" }}></div></div>
            </div>
            <div className="reach-unit">
              <div className="unit-header">
                <span>Micro-Amplifier Footprint Threshold</span>
                <strong>50%</strong>
              </div>
              <div className="unit-bar"><div style={{ width: "50%" }}></div></div>
            </div>
          </div>
        </Card>

        {/* Card 4: PRODUCT OPERATIONAL VELOCITY */}
        <Card className="insight-card">
          <h3 className="insight-eyebrow">PRODUCT OPERATIONAL VELOCITY</h3>
          <div className="velocity-stack">
            <div className="velocity-item">
              <span className="v-label">Rapid Clear Spot Gel</span>
              <strong>Volume: 18 Slots Live</strong>
            </div>
            <div className="velocity-item">
              <span className="v-label">Routine Reset Bundle</span>
              <strong>Volume: 12 Slots Live</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION C: PERFORMANCE LEDGER MATRIX */}
      <Card title="Performance Ledger Matrix" className="ledger-matrix-card" compact>
        <div className="table-overflow">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Creator Profile Entity</th>
                <th>Content Delivery Status</th>
                <th>Disbursed Capital Outlays</th>
                <th>Media Gross Yield</th>
                <th>Calculated System Efficiency</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="creator-cell-modern">
                    <div className="avatar-js">JS</div>
                    <strong>@janedoe_creative</strong>
                  </div>
                </td>
                <td><Badge tone="success">Approved</Badge></td>
                <td className="font-mono">$1,250.00</td>
                <td><strong>42.5K</strong> <span className="text-muted">Views</span></td>
                <td>
                  <div className="efficiency-cell">
                    <strong>$0.02 CPA</strong>
                    <span className="text-muted">ROI: 4.2x</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="creator-cell-modern">
                    <div className="avatar-am">AM</div>
                    <strong>@alex_market</strong>
                  </div>
                </td>
                <td><Badge tone="pending">Reviewing</Badge></td>
                <td className="font-mono">$800.00</td>
                <td><strong>12.1K</strong> <span className="text-muted">Interactions</span></td>
                <td><span className="text-muted">Calculating...</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* PROTECTION LEDGER SECTION */}
      <Card className="protection-ledger-final">
        <h3 className="protection-title">🔒 MULTI-TENANT FINANCIAL PROTECTION LEDGER</h3>
        <div className="protection-grid-final">
          <div className="p-unit">
            <span className="p-val">$50,000</span>
            <span className="p-desc">Global Master Budget Limit Allocation</span>
          </div>
          <div className="p-unit">
            <span className="p-val">$15,000</span>
            <span className="p-desc">Product Sub-Ceiling Limit Consumption Threshold</span>
          </div>
          <div className="p-unit">
            <span className="p-val text-primary">$6,100</span>
            <span className="p-desc">Secured Funds (Escrow Protected Value)</span>
          </div>
          <div className="p-status">
            <span className="status-indicator"></span>
            <span>[System Status: Active - Protection Guard Engaged]</span>
          </div>
        </div>
      </Card>

      {/* Quick Draft Placeholder */}
      <div className="quick-draft-zone">
        <PlusCircle size={32} className="text-primary" />
        <strong>Quick Draft</strong>
        <span>New Concept</span>
      </div>
    </div>
  );
}
