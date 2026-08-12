import { Alert, Badge, Button, SideDrawer } from "../../../design-system/aurora";
import type { CampaignReportingResponse } from "../contracts/brand-uce.contracts";

export function ReportingDrawer({
  report,
  loading,
  error,
  isOpen,
  onClose,
}: {
  report?: CampaignReportingResponse;
  loading: boolean;
  error?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const summaryEntries = report ? Object.entries(report.roi_summary_strip_payload) : [];

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Campaign Report"
      subtitle={report?.campaign_name ?? "Reporting detail"}
      width="720px"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {loading ? <p>Loading Campaign report…</p> : null}
      {error ? (
        <Alert title="Reporting unavailable" tone="warning">
          {error}
        </Alert>
      ) : null}
      {!loading && !error && report ? (
        <div className="canonical-campaign-drawer__stack">
          <div className="canonical-campaign-drawer__badges">
            <Badge>{report.primary_objective}</Badge>
            <Badge tone="neutral">{report.elapsed_time_string}</Badge>
          </div>
          <p className="canonical-campaign-page__empty">
            Last synced {new Date(report.last_api_sync_timestamp).toLocaleString()}
          </p>
          <section>
            <h3 className="canonical-campaign-drawer__section-title">Performance summary</h3>
            {summaryEntries.length ? (
              <div className="canonical-campaign-page__metrics">
                {summaryEntries.map(([key, value]) => (
                  <div key={key}>
                    <span>{key.replaceAll("_", " ")}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="canonical-campaign-page__empty">No report summary is available yet.</p>
            )}
          </section>
          <section>
            <h3 className="canonical-campaign-drawer__section-title">Creator leaderboard</h3>
            {report.leaderboard_rankings.length ? (
              <div className="canonical-campaign-drawer__list">
                {report.leaderboard_rankings.map((row) => (
                  <article className="canonical-campaign-drawer__list-item" key={row.collaboration_id}>
                    <strong>#{row.rank_position} {row.instagram_handle}</strong>
                    <p>Impressions {row.delivered_impressions_count} · CPE {row.cost_per_engagement_value} · ROI index {row.roi_performance_index_score}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="canonical-campaign-page__empty">No ranked creators yet.</p>
            )}
          </section>
          <section>
            <h3 className="canonical-campaign-drawer__section-title">Creative assets</h3>
            <p className="canonical-campaign-page__empty">
              {report.creative_gallery_grid.length} reporting asset{report.creative_gallery_grid.length === 1 ? "" : "s"} available.
            </p>
          </section>
        </div>
      ) : null}
    </SideDrawer>
  );
}
