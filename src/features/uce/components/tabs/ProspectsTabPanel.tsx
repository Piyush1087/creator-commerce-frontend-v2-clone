import { useState } from "react";
import {
  AlertTriangle,
  Archive,
  ChevronRight,
  Instagram,
  Lock,
  MessageCircle,
  Play,
  Search,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button } from "../../../../design-system/aurora/components/Button";

const CREATOR_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBhPsy4KMWgRB56itgMD0L96klzBRSqD5ud_llppR_EM57AH7qTm72xy6grORo3bbiQo2Isy8IVGvBcNCDaL641fIHvzNy1e4ttqCIcU5aidY85uAKz0qy5aKfwJUnmd3sm_5agt2prLtfsVXxQgbGk6hBWS3BFRFQNiz213M5PuYraXhjh_UXA6T5Mx6jpvw8-WDARDaBfcInPTd4b4-2qgRDiQTO_nfrHxHJn02bdJLuh37I_UvamAjHBD8ZpcMgO0CCj9TH_BQ";

const PROSPECT_ROWS = [
  {
    handle: "@elenarose_fit",
    brief: "Summer Skin Routine",
    source: "META_MARKETPLACE",
    sourceTone: "emerald" as const,
    audience: "42.5k – 120k",
    match: "94% Match",
    status: "No Outreach",
    statusTone: null,
    cta: "Priority DM",
  },
  {
    handle: "@clara_vibe",
    brief: "Summer Skin Routine",
    source: "MANUAL_IMPORT",
    sourceTone: "slate" as const,
    audience: "18k – 55k",
    match: "88% Match",
    status: "INVITE_SENT",
    statusTone: "blue" as const,
    cta: "Priority DM",
  },
];

type ProspectsView = "onboarding" | "grid";

export function ProspectsTabPanel() {
  const [view, setView] = useState<ProspectsView>("onboarding");
  const [showMetaWarning, setShowMetaWarning] = useState(true);
  const [showTokenWarning, setShowTokenWarning] = useState(true);

  if (view === "onboarding") {
    return (
      <div className="uce-tab-panel">
        <TabBreadcrumb tab="Prospects" />
        <div className="uce-stat-row">
          <StatCard label="Active Pipeline" value="0" />
          <StatCard label="Selected Creators" value="0" />
          <StatCard label="Archived History" value="12" />
        </div>

        {showMetaWarning && (
          <AlertRibbon
            tone="amber"
            icon={<AlertTriangle size={18} />}
            onDismiss={() => setShowMetaWarning(false)}
          >
            Automated AI Sourcing is inactive. Authorize your Meta Creator Marketplace
            link to unlock creators matching your active brief frameworks.{" "}
            <button type="button" className="uce-alert-link">
              Connect Meta Account →
            </button>
          </AlertRibbon>
        )}

        {showTokenWarning && (
          <AlertRibbon
            tone="red"
            icon={<Lock size={18} />}
            onDismiss={() => setShowTokenWarning(false)}
          >
            Authentication Interrupted: Your handshake with Meta Marketplace has
            timed out. Re-authorize to continue outbound priority communications.{" "}
            <button type="button" className="uce-alert-link">
              Re-Authenticate Connection
            </button>
          </AlertRibbon>
        )}

        <div className="uce-quota-chips">
          <QuotaChip icon={<Sparkles size={14} />} label="Meta API Discovery" value="0 / 20" hint="Profiles Checked" />
          <QuotaChip icon={<Search size={14} />} label="Business Discovery" value="0 / 50" hint="Lookups Executed" />
          <QuotaChip icon={<MessageCircle size={14} />} label="Outbound Priority DMs" value="0 / 10" hint="Dispatched Today" />
        </div>

        <div className="uce-onboarding-grid">
          <div className="uce-onboarding-card">
            <h3>See How Automated Prospecting Performs</h3>
            <p>
              Our AI-driven engine scans creator profiles across Meta&apos;s ecosystem
              to identify matches based on your brief requirements, engagement metrics,
              and audience demographics.
            </p>
            <div className="uce-video-placeholder">
              <div className="uce-video-play">
                <Play size={28} fill="currentColor" />
              </div>
              <span className="uce-video-duration">2:14</span>
            </div>
          </div>

          <div className="uce-onboarding-dark">
            <h3>Initialize Sourcing Channels</h3>
            <p>Choose an activation strategy to populate your current outreach matrix.</p>
            <div className="uce-source-options">
              <button type="button" className="uce-source-option" onClick={() => setView("grid")}>
                <div className="uce-source-option-head">
                  <Instagram size={22} />
                  <span className="uce-source-badge">Recommended</span>
                </div>
                <strong>Meta Creator Marketplace</strong>
                <span>Connect API for verified metrics and Priority DM access.</span>
                <ChevronRight size={18} className="uce-source-chevron" />
              </button>
              <button type="button" className="uce-source-option uce-source-option--muted" onClick={() => setView("grid")}>
                <div className="uce-source-option-head">
                  <Users size={22} />
                </div>
                <strong>Manual Handle Import</strong>
                <span>Paste social handles or upload CSV to track creators.</span>
                <ChevronRight size={18} className="uce-source-chevron" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="uce-tab-panel">
      <TabBreadcrumb tab="Prospects" />
      <div className="uce-stat-row">
        <StatCard label="Active Pipeline" value="2" />
        <StatCard label="Selected Creators" value="0" />
        <StatCard label="Archived History" value="12" />
      </div>

      <div className="uce-sourcing-bar">
        <button type="button" className="uce-sourcing-bar-btn">
          <Sparkles size={18} /> Automated Meta AI Sync
        </button>
        <button type="button" className="uce-sourcing-bar-btn">
          <UserPlus size={18} /> Add Profile Handle
        </button>
        <button type="button" className="uce-sourcing-bar-btn">
          <Archive size={18} /> Archived Ledger (12)
        </button>
      </div>

      <div className="uce-table-wrap uce-hide-on-mobile">
        <table className="uce-data-table">
          <thead>
            <tr>
              <th className="uce-th-check">
                <input type="checkbox" aria-label="Select all" />
              </th>
              <th>Creator Identity / Target Asset</th>
              <th>Sourcing Discovery Path</th>
              <th className="uce-hide-sm">Audience Range</th>
              <th>Brief Matching Grade</th>
              <th>Communication Status</th>
              <th>Primary Outreach Command</th>
            </tr>
          </thead>
          <tbody>
            {PROSPECT_ROWS.map((row) => (
              <tr key={row.handle}>
                <td>
                  <input type="checkbox" aria-label={`Select ${row.handle}`} />
                </td>
                <td>
                  <div className="uce-creator-cell">
                    <img src={CREATOR_IMG} alt="" className="uce-creator-avatar" />
                    <div>
                      <strong>{row.handle}</strong>
                      <span>Assigned Brief: {row.brief}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`uce-pill uce-pill--${row.sourceTone}`}>
                    {row.source}
                  </span>
                </td>
                <td className="uce-hide-sm">{row.audience}</td>
                <td>
                  <span className="uce-match-grade">
                    <span className="uce-match-dot" /> {row.match}
                  </span>
                </td>
                <td>
                  {row.statusTone ? (
                    <span className={`uce-pill uce-pill--${row.statusTone}`}>
                      {row.status}
                    </span>
                  ) : (
                    <span className="uce-text-muted">{row.status}</span>
                  )}
                </td>
                <td>
                  <Button variant="outline" size="sm">
                    {row.cta}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="uce-prospect-cards uce-show-on-mobile">
        {PROSPECT_ROWS.map((row) => (
          <article key={row.handle} className="uce-prospect-card">
            <div className="uce-prospect-card-head">
              <input type="checkbox" aria-label={`Select ${row.handle}`} />
              <img src={CREATOR_IMG} alt="" className="uce-creator-avatar" />
              <div>
                <strong>{row.handle}</strong>
                <span>Brief: {row.brief}</span>
              </div>
            </div>
            <div className="uce-prospect-card-meta">
              <span className={`uce-pill uce-pill--${row.sourceTone}`}>{row.source}</span>
              <span className="uce-match-grade">
                <span className="uce-match-dot" /> {row.match}
              </span>
            </div>
            <p className="uce-prospect-card-audience">{row.audience}</p>
            <div className="uce-prospect-card-foot">
              {row.statusTone ? (
                <span className={`uce-pill uce-pill--${row.statusTone}`}>{row.status}</span>
              ) : (
                <span className="uce-text-muted">{row.status}</span>
              )}
              <Button variant="outline" size="sm">
                {row.cta}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function TabBreadcrumb({ tab }: { tab: string }) {
  return (
    <div className="uce-tab-intro">
      <nav className="uce-tab-crumb">
        <span>Campaigns</span>
        <ChevronRight size={12} />
        <span>Spring Glow 2024</span>
        <ChevronRight size={12} />
        <span className="uce-tab-crumb-active">{tab}</span>
      </nav>
      <h2>{tab}</h2>
      <p>
        Curated list of potential high-impact creators for this active campaign
        milestone matrix.
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="uce-stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function AlertRibbon({
  tone,
  icon,
  children,
  onDismiss,
}: {
  tone: "amber" | "red";
  icon: React.ReactNode;
  children: React.ReactNode;
  onDismiss: () => void;
}) {
  return (
    <div className={`uce-alert uce-alert--${tone}`}>
      <div className="uce-alert-body">
        {icon}
        <p>{children}</p>
      </div>
      <button type="button" className="uce-alert-dismiss" onClick={onDismiss}>
        <X size={16} />
      </button>
    </div>
  );
}

function QuotaChip({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="uce-quota-chip">
      {icon}
      <span className="uce-quota-chip-label">{label}:</span>
      <strong>{value}</strong>
      <span className="uce-quota-chip-hint">{hint}</span>
    </div>
  );
}
