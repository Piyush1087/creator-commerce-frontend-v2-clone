import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Share2,
  Lightbulb,
  UserSearch,
  Wallet,
  Cake,
  Flower2,
  User,
} from "lucide-react";

type CampaignWorkspaceZone1Props = {
  campaignName?: string;
  onOpenShareRouter?: () => void;
};

const MOCK = {
  objective: "BRAND_AWARENESS",
  spend: 18_400,
  allocated: 25_000,
  isActive: true,
  strategy: {
    deadlineTracking: "Fixed Date",
    dateRange: "Jun 01 - Jul 31",
    kpiWeights: ["REACH", "IMPRESSIONS"],
    channels: "Instagram, TikTok",
  },
  targeting: {
    archetypes: "Lifestyle, Aesthetic, Fitness",
    scope: "10k – 250k followers",
    geographies: "North America, UK",
    demographics: [
      { icon: User, label: "Female-Skewing" },
      { icon: Cake, label: "18–34 years" },
      { icon: Flower2, label: "Skincare, Wellness" },
    ],
  },
  commercials: {
    logistics: [
      { label: "Physical Samples Required:", value: "Yes" },
      { label: "Fulfillment Structure:", value: "Routine Reset Bundle" },
      { label: "Budget Allocation:", value: "$15,000 Cap" },
    ],
    financial: [
      { label: "Campaign Ceiling:", value: "$50,000" },
      { label: "Compensation Engine:", value: "Fixed Fee" },
      { label: "Escrow Commitment:", value: "30% Advance" },
      {
        label: "Financial Release:",
        value: "Immediate Upon Approval",
        highlight: "success",
      },
    ],
  },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CampaignWorkspaceZone1({
  campaignName = "Spring Glow 2024",
  onOpenShareRouter,
}: CampaignWorkspaceZone1Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isActive, setIsActive] = useState(MOCK.isActive);

  return (
    <div className={`uce-zone1 ${isExpanded ? "" : "uce-zone1--collapsed"}`}>
      <section className="uce-glass-card uce-zone1-hero">
        <div className="uce-zone1-hero-inner">
          <div className="uce-zone1-hero-main">
            <div className="uce-zone1-title-row">
              <h1 className="uce-zone1-title">{campaignName}</h1>
              <span
                className={`uce-zone1-status-pulse ${isActive ? "uce-zone1-status-pulse--live" : "uce-zone1-status-pulse--paused"}`}
                title={isActive ? "Active" : "Paused"}
              />
            </div>
            <div className="uce-zone1-meta-row">
              <span className="uce-zone1-objective-pill">{MOCK.objective}</span>
              <p className="uce-zone1-budget-line">
                Budget Spent:{" "}
                <strong>{formatCurrency(MOCK.spend)}</strong>
                <span className="uce-zone1-budget-sep">/</span>
                Allocated Limit:{" "}
                <span className="uce-zone1-budget-muted">
                  {formatCurrency(MOCK.allocated)}
                </span>
              </p>
            </div>
          </div>

          <div className="uce-zone1-controls">
            <label className="uce-active-toggle">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="uce-active-toggle-track" />
              <span className="uce-active-toggle-label">Active</span>
            </label>
            <button
              type="button"
              className="uce-zone1-icon-btn"
              title="Edit Campaign Scope"
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
                <p className="uce-field-value">{MOCK.strategy.deadlineTracking}</p>
              </div>
              <div>
                <p className="uce-field-label">Target Date Range</p>
                <p className="uce-field-value">{MOCK.strategy.dateRange}</p>
              </div>
              <div>
                <p className="uce-field-label">KPI Weights</p>
                <div className="uce-kpi-tags">
                  {MOCK.strategy.kpiWeights.map((tag) => (
                    <span key={tag} className="uce-kpi-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="uce-field-label">Channels</p>
                <p className="uce-field-value">{MOCK.strategy.channels}</p>
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
            <div className="uce-zone1-panel-body">
              <div className="uce-zone1-grid-3 uce-zone1-grid-3--spaced">
                <div>
                  <p className="uce-field-label">Archetype Vectors</p>
                  <p className="uce-field-value">{MOCK.targeting.archetypes}</p>
                </div>
                <div>
                  <p className="uce-field-label">Operational Scope</p>
                  <p className="uce-field-value">{MOCK.targeting.scope}</p>
                </div>
                <div>
                  <p className="uce-field-label">Geographies</p>
                  <p className="uce-field-value">{MOCK.targeting.geographies}</p>
                </div>
              </div>
              <div className="uce-demographic-block">
                <p className="uce-field-label">Demographic Profile</p>
                <div className="uce-demographic-row">
                  {MOCK.targeting.demographics.map(({ icon: Icon, label }) => (
                    <div key={label} className="uce-demographic-item">
                      <Icon size={18} className="uce-demographic-icon" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
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
                <div className="uce-kv-list">
                  {MOCK.commercials.logistics.map((row) => (
                    <div key={row.label} className="uce-kv-row">
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="uce-commercial-col">
                <p className="uce-field-label uce-field-label--section">
                  Financial Terms
                </p>
                <div className="uce-kv-list">
                  {MOCK.commercials.financial.map((row) => (
                    <div key={row.label} className="uce-kv-row">
                      <span>{row.label}</span>
                      <strong
                        className={
                          row.highlight === "success"
                            ? "uce-kv-row--success"
                            : undefined
                        }
                      >
                        {row.value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
