import { Badge, Button, Card } from "../../../design-system/aurora";
import {
  MOCK_ANALYTICS_SUMMARY,
  MOCK_INSIGHTS_HEADER,
  MOCK_INSIGHTS_OPPORTUNITY,
  MOCK_INSIGHTS_PULSE_KPIS,
  MOCK_LATEST_POSTS,
  MOCK_STRATEGIC_RECOMMENDATION,
  MOCK_TOP_POSTS,
  MOCK_VISUAL_IMPACT,
} from "../mock-data/centre-mock";

import "../creator-centre.css";

/**
 * Insights / Content Pulse — Stitch
 * `Insights (Content Pulse) - Metrics & Content Update`
 * (`insights_content_pulse_metrics_content_update_2`)
 */
export function AnalyticsPulseWorkspace() {
  const header = MOCK_INSIGHTS_HEADER;
  const opportunity = MOCK_INSIGHTS_OPPORTUNITY;
  const summary = MOCK_ANALYTICS_SUMMARY;

  return (
    <div className="cctr-workspace cctr-insights cctr-canvas">
      <p className="cctr-demo-chip">Stitch · Metrics & Content Update</p>

      <div className="cctr-insights__inner">
        <header className="cctr-insights__header">
          <div>
            <h1 className="cctr-insights__title">
              <span aria-hidden="true">📊 </span>
              {header.title}
            </h1>
            <p className="cctr-insights__subtitle">{header.subtitle}</p>
            <p className="cctr-insights__updated">{header.lastUpdated}</p>
          </div>
          <div className="cctr-insights__header-actions">
            <Button variant="outline" size="sm" disabled>
              {header.rangeLabel}
            </Button>
            <Button variant="secondary" size="sm" disabled>
              Export Report
            </Button>
          </div>
        </header>

        <Card className="cctr-insights__opportunity">
          <p className="cctr-insights__opportunity-eyebrow">
            <span aria-hidden="true">{opportunity.emoji}</span> {opportunity.title}
          </p>
          <p className="cctr-insights__opportunity-body">
            {opportunity.bodyBefore}
            <strong>{opportunity.bodyHighlight}</strong>
            {opportunity.bodyAfter}
          </p>
          <p className="cctr-insights__opportunity-rec">
            {opportunity.recommendation}
          </p>
          <div className="cctr-insights__opportunity-actions">
            <Button variant="primary" size="sm" disabled>
              {opportunity.primaryCta}
            </Button>
            <button type="button" className="cctr-text-link" disabled>
              {opportunity.secondaryCta}
            </button>
          </div>
        </Card>

        <div className="cctr-insights__kpi-row">
          {MOCK_INSIGHTS_PULSE_KPIS.map((kpi) => (
            <Card key={kpi.id} className="cctr-insights__kpi">
              <p className="cctr-insights__kpi-label">
                <span aria-hidden="true">{kpi.emoji}</span> {kpi.label}
              </p>
              <p className="cctr-insights__kpi-value">{kpi.value}</p>
              <p
                className={`cctr-insights__kpi-detail cctr-insights__kpi-detail--${kpi.detailTone}`}
              >
                {kpi.detail}
              </p>
            </Card>
          ))}
        </div>

        <section className="cctr-insights__posts">
          <div className="cctr-section-head cctr-section-head--row">
            <div>
              <h2>Your Latest Posts</h2>
              <p className="cctr-insights__section-sub">
                See how your recent content is performing.
              </p>
            </div>
            <div className="cctr-insights__filters">
              <Button variant="outline" size="sm" disabled>
                Sort by: Recent
              </Button>
              <Button variant="outline" size="sm" disabled>
                Filters: Reels
              </Button>
            </div>
          </div>
          <ul className="cctr-insights__post-list">
            {MOCK_LATEST_POSTS.map((post) => (
              <li key={post.id} className="cctr-insights__post-card">
                <span
                  className={`cctr-insights__post-thumb cctr-insights__post-thumb--${post.id}`}
                  aria-hidden="true"
                />
                <div className="cctr-insights__post-body">
                  <strong>{post.title}</strong>
                  <span className="cctr-insights__post-metrics">{post.metrics}</span>
                  <div className="cctr-insights__post-badges">
                    <Badge tone="neutral">Score: {post.score}</Badge>
                    <Badge tone={post.statusTone}>{post.status}</Badge>
                  </div>
                </div>
                <button type="button" className="cctr-text-link" disabled>
                  View Insights →
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="cctr-insights__analytics">
          <Card className="cctr-insights__reach">
            <p className="cctr-insights__kpi-label">Total Reach</p>
            <div className="cctr-insights__reach-row">
              <p className="cctr-insights__kpi-value cctr-insights__kpi-value--xl">
                {summary.totalReach}
              </p>
              <span className="cctr-insights__delta">{summary.reachDelta}</span>
            </div>
            <div className="cctr-mini-chart" aria-hidden>
              {summary.chartHeights.map((height, index) => (
                <div
                  key={index}
                  className={`cctr-mini-chart__bar${index === 5 ? " cctr-mini-chart__bar--peak" : ""}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </Card>
          <Card className="cctr-insights__kpi">
            <p className="cctr-insights__kpi-label">Engagement Rate</p>
            <div className="cctr-insights__reach-row">
              <p className="cctr-insights__kpi-value">{summary.engagementRate}</p>
              <span className="cctr-insights__delta">
                {summary.engagementDelta}
              </span>
            </div>
            <div className="cctr-meter">
              <div className="cctr-meter__fill" style={{ width: "68%" }} />
            </div>
          </Card>
          <Card className="cctr-insights__value-card">
            <p className="cctr-insights__kpi-label cctr-insights__kpi-label--on-dark">
              Estimated Value
            </p>
            <p className="cctr-insights__kpi-value cctr-insights__kpi-value--on-dark">
              {summary.estimatedValue}
            </p>
            <p className="cctr-insights__value-note">{summary.estimatedNote}</p>
          </Card>
        </div>

        <section className="cctr-insights__table-section">
          <div className="cctr-section-head cctr-section-head--row">
            <h2>Top Performing Creators</h2>
            <button type="button" className="cctr-text-link" disabled>
              View All
            </button>
          </div>
          <div className="cctr-table-wrap">
            <table className="cctr-table">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Campaign</th>
                  <th>Impressions</th>
                  <th>CTR</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TOP_POSTS.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.creator}</strong>
                      <div className="cctr-insights__handle">{row.handle}</div>
                    </td>
                    <td>{row.campaign}</td>
                    <td>{row.impressions}</td>
                    <td>{row.ctr}</td>
                    <td>
                      <Badge
                        tone={row.status === "Active" ? "success" : "pending"}
                      >
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cctr-mobile-cards">
            {MOCK_TOP_POSTS.map((row) => (
              <div key={row.id} className="cctr-mobile-card">
                <strong>{row.creator}</strong>
                <p className="cctr-insights__handle">
                  {row.campaign} · {row.impressions} · {row.ctr} CTR
                </p>
                <Badge tone={row.status === "Active" ? "success" : "pending"}>
                  {row.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        <div className="cctr-insights__bottom">
          <Card className="cctr-visual-impact">
            <h2>{MOCK_VISUAL_IMPACT.title}</h2>
            <p className="cctr-insights__section-sub">
              {MOCK_VISUAL_IMPACT.subtitle}
            </p>
            <div className="cctr-visual-impact__grid">
              {MOCK_VISUAL_IMPACT.tiles.map((tile) => (
                <div
                  key={tile.label}
                  className={`cctr-visual-tile cctr-visual-tile--${tile.tone}`}
                >
                  <strong>{tile.label}</strong>
                  <span>{tile.detail}</span>
                </div>
              ))}
            </div>
            <p className="cctr-visual-impact__quote">{MOCK_VISUAL_IMPACT.quote}</p>
          </Card>

          <Card className="cctr-strategy-card">
            <h2>{MOCK_STRATEGIC_RECOMMENDATION.title}</h2>
            <p className="cctr-insights__section-sub">
              {MOCK_STRATEGIC_RECOMMENDATION.body}
            </p>
            <Button variant="secondary" size="sm" disabled>
              {MOCK_STRATEGIC_RECOMMENDATION.cta}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
