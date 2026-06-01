import { ChevronRight, RefreshCw, Shield, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "../../../../design-system/aurora/components/Button";

const CREATOR_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBhPsy4KMWgRB56itgMD0L96klzBRSqD5ud_llppR_EM57AH7qTm72xy6grORo3bbiQo2Isy8IVGvBcNCDaL641fIHvzNy1e4ttqCIcU5aidY85uAKz0qy5aKfwJUnmd3sm_5agt2prLtfsVXxQgbGk6hBWS3BFRFQNiz213M5PuYraXhjh_UXA6T5Mx6jpvw8-WDARDaBfcInPTd4b4-2qgRDiQTO_nfrHxHJn02bdJLuh37I_UvamAjHBD8ZpcMgO0CCj9TH_BQ";

const GALLERY = [
  { handle: "@elenarose_fit", views: "124k", emv: "$4.2k" },
  { handle: "@clara_vibe", views: "89k", emv: "$2.8k" },
  { handle: "@marcus_vlogs", views: "210k", emv: "$6.1k" },
  { handle: "@sophia_creates", views: "56k", emv: "$1.9k" },
];

export function ReportingTabPanel() {
  return (
    <div className="uce-tab-panel">
      <div className="uce-tab-intro uce-tab-intro--row">
        <div>
          <nav className="uce-tab-crumb">
            <span>Campaigns</span>
            <ChevronRight size={12} />
            <span>Spring Glow 2024</span>
            <ChevronRight size={12} />
            <span className="uce-tab-crumb-active">Reporting</span>
          </nav>
          <h2>Reporting &amp; Performance Intelligence</h2>
          <p>
            AI-verified reach, EMV, and conversion telemetry synced from authenticated
            creator APIs.
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw size={16} />
          Refresh API Sync
        </Button>
      </div>

      <div className="uce-reporting-metrics">
        <MetricCard
          label="Total Reach"
          value="1.2M"
          delta="+14%"
          deltaUp
          footnote="AI VERIFIED"
        />
        <MetricCard
          label="Est. EMV"
          value="$84.5k"
          delta="+8.1%"
          deltaUp
          footnote="API SYNCED"
        />
        <MetricCard
          label="Conversion Value"
          value="$12,400"
          delta="-2.4%"
          footnote="OAUTH ACTIVE"
        />
      </div>

      <div className="uce-reporting-grid">
        <div className="uce-reporting-card">
          <h3>Capital Burn Allocation</h3>
          <p className="uce-reporting-eyebrow">Financial Exposure</p>
          <div className="uce-donut">
            <div className="uce-donut-inner">
              <strong>$20k</strong>
              <span>Settled</span>
            </div>
          </div>
          <ul className="uce-legend">
            <li>
              <span className="uce-legend-dot uce-legend-dot--primary" />
              Settled Payouts <strong>$12.4k</strong>
            </li>
            <li>
              <span className="uce-legend-dot uce-legend-dot--secondary" />
              Committed Escrow <strong>$6.1k</strong>
            </li>
            <li>
              <span className="uce-legend-dot uce-legend-dot--muted" />
              Unallocated <strong>$1.5k</strong>
            </li>
          </ul>
        </div>

        <div className="uce-reporting-card uce-reporting-card--wide">
          <h3>Partnership Leaderboard</h3>
          <p className="uce-reporting-eyebrow">Performance Index</p>
          <div className="uce-table-wrap">
            <table className="uce-data-table">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>ROI Yield</th>
                  <th>Sync Status</th>
                  <th>API</th>
                </tr>
              </thead>
              <tbody>
                {["4.2x", "3.8x", "2.9x"].map((roi, i) => (
                  <tr key={roi}>
                    <td>
                      <div className="uce-creator-cell">
                        <img src={CREATOR_IMG} alt="" className="uce-creator-avatar" />
                        <strong>@creator_{i + 1}</strong>
                      </div>
                    </td>
                    <td>
                      <strong>{roi}</strong>
                    </td>
                    <td>
                      <div className="uce-sync-bar">
                        <div className="uce-sync-fill" style={{ width: `${85 - i * 10}%` }} />
                      </div>
                    </td>
                    <td>
                      <span className="uce-pill uce-pill--emerald">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="uce-reporting-card">
        <h3>Content Performance Gallery</h3>
        <p className="uce-reporting-eyebrow">Top Performing Native Assets</p>
        <div className="uce-gallery-grid">
          {GALLERY.map((item) => (
            <div key={item.handle} className="uce-gallery-tile">
              <img src={CREATOR_IMG} alt="" />
              <div className="uce-gallery-meta">
                <strong>{item.handle}</strong>
                <span>{item.views} views</span>
                <span className="uce-gallery-emv">{item.emv} EMV</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  deltaUp,
  footnote,
}: {
  label: string;
  value: string;
  delta: string;
  deltaUp?: boolean;
  footnote: string;
}) {
  return (
    <div className="uce-metric-card">
      <p className="uce-metric-label">{label}</p>
      <div className="uce-metric-value-row">
        <strong>{value}</strong>
        <span className={`uce-metric-delta ${deltaUp ? "is-up" : "is-down"}`}>
          {deltaUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {delta}
        </span>
      </div>
      <span className="uce-metric-foot">
        <Shield size={10} />
        {footnote}
      </span>
    </div>
  );
}
