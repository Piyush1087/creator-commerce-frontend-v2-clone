import { Alert, Button, Card } from "../../../design-system/aurora";
import { useAnalyticsPulse } from "../hooks/use-creator-centre";
import {
  displayValue,
  formatCurrencyUsd,
  formatPercent,
  formatReach,
} from "../utils/display-value";

import "../creator-centre.css";

export function AnalyticsPulseWorkspace() {
  const { analytics, loading, error } = useAnalyticsPulse(5);
  const pulses = analytics?.pulses ?? [];

  return (
    <div className="cctr-workspace">
      <div className="cctr-page-header">
        <div>
          <p className="cctr-sub" style={{ margin: 0 }}>
            Performance
          </p>
          <h1>Content Pulse</h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="outline" size="sm" disabled>
            Last 30 Days
          </Button>
          <Button variant="primary" size="sm" disabled>
            Export Report
          </Button>
        </div>
      </div>

      {error ? (
        <Alert tone="error" title="Could not load analytics">
          {error}
        </Alert>
      ) : null}
      {loading ? <p className="cctr-sub">Loading analytics…</p> : null}

      <div className="cctr-bento">
        <Card className="cctr-kpi">
          <span className="cctr-sub">Total Reach</span>
          <p className="cctr-kpi__value">
            {formatReach(analytics?.summary.totalReach ?? null)}
          </p>
          <span className="cctr-kpi__delta">-</span>
        </Card>
        <Card className="cctr-kpi">
          <span className="cctr-sub">Engagement Rate</span>
          <p className="cctr-kpi__value">
            {formatPercent(analytics?.summary.engagementRate ?? null)}
          </p>
          <span className="cctr-kpi__delta">-</span>
        </Card>
        <Card className="cctr-kpi">
          <span className="cctr-sub">Estimated Value</span>
          <p className="cctr-kpi__value">{formatCurrencyUsd(null)}</p>
        </Card>
        <Card className="cctr-kpi">
          <span className="cctr-sub">Top Location</span>
          <p className="cctr-kpi__value">{displayValue(analytics?.summary.topLocation)}</p>
        </Card>
      </div>

      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>Top performing posts</h2>
      <div className="cctr-table-wrap" style={{ marginTop: 12 }}>
        <table className="cctr-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Handle</th>
              <th>Reach</th>
              <th>CTR</th>
              <th>Status</th>
              <th>Post type</th>
              <th>Velocity</th>
              <th>AI insight</th>
            </tr>
          </thead>
          <tbody>
            {pulses.length === 0 ? (
              <tr>
                <td colSpan={8}>-</td>
              </tr>
            ) : (
              pulses.map((row) => (
                <tr key={row.id}>
                  <td>{displayValue(row.captionContent?.slice(0, 40))}</td>
                  <td>-</td>
                  <td>{formatReach(row.viewsCount)}</td>
                  <td>-</td>
                  <td>{displayValue(row.velocityLabel)}</td>
                  <td>{displayValue(row.postType)}</td>
                  <td>{displayValue(row.engagementDelta)}%</td>
                  <td>{displayValue(row.aiPerformanceNote)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="cctr-mobile-cards" style={{ marginTop: 12 }}>
        {pulses.length === 0 ? (
          <div className="cctr-mobile-card">-</div>
        ) : (
          pulses.map((row) => (
            <div key={row.id} className="cctr-mobile-card">
              <strong>{displayValue(row.postType)}</strong>
              <p className="cctr-sub" style={{ margin: "4px 0" }}>
                {formatReach(row.viewsCount)} views · {displayValue(row.velocityLabel)}
              </p>
              <span className="cctr-kpi__delta">{displayValue(row.aiPerformanceNote)}</span>
            </div>
          ))
        )}
      </div>

      <Card style={{ marginTop: 24, padding: "var(--space-lg)" }}>
        <strong>Strategic recommendation</strong>
        <p className="cctr-sub" style={{ margin: "8px 0 16px" }}>
          -
        </p>
        <Button variant="primary" size="sm" disabled>
          Implement Shift
        </Button>
      </Card>
    </div>
  );
}
