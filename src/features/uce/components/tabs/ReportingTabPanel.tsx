import { useCallback, useState } from "react";
import { ChevronRight, RefreshCw } from "lucide-react";
import { Alert } from "../../../../design-system/aurora";
import { Button } from "../../../../design-system/aurora/components/Button";
import {
  fetchCampaignReporting,
  refreshCampaignReportingSync,
} from "../../api/brand-uce-client";
import { useUceApiJson } from "../../hooks/use-uce-api-json";
import { displayField, EMPTY_FIELD } from "../../utils/display-field";
import { formatCurrency, formatNumber } from "../../utils/uce-format";

type ReportingTabPanelProps = {
  campaignId: string;
  campaignName: string;
};

export function ReportingTabPanel({
  campaignId,
  campaignName,
}: ReportingTabPanelProps) {
  const [syncError, setSyncError] = useState<string | null>(null);
  const fetcher = useCallback(
    () => fetchCampaignReporting(campaignId),
    [campaignId],
  );
  const { state, reload } = useUceApiJson(Boolean(campaignId), fetcher);

  const handleRefresh = async () => {
    setSyncError(null);
    try {
      await refreshCampaignReportingSync(campaignId);
      await reload({ silent: true });
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : "Could not refresh reporting sync.",
      );
    }
  };

  const roi =
    state.status === "ready" ? state.data.roi_summary_strip_payload : null;

  return (
    <div className="uce-tab-panel">
      <div className="uce-tab-intro uce-tab-intro--row">
        <div>
          <nav className="uce-tab-crumb">
            <span>Campaigns</span>
            <ChevronRight size={12} />
            <span>{displayField(campaignName)}</span>
            <ChevronRight size={12} />
            <span className="uce-tab-crumb-active">Reporting</span>
          </nav>
          <h2>Reporting &amp; Performance Intelligence</h2>
          <p>
            {state.status === "ready"
              ? state.data.elapsed_time_string
              : EMPTY_FIELD}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void handleRefresh()}>
          <RefreshCw size={16} />
          Refresh API Sync
        </Button>
      </div>

      {syncError ? (
        <Alert tone="error" title="Sync failed">
          {syncError}
        </Alert>
      ) : null}
      {state.status === "error" ? (
        <Alert tone="error" title="Could not load reporting">
          {state.message}
        </Alert>
      ) : null}

      <div className="uce-reporting-metrics">
        <MetricCard
          label="Total spend allocated"
          value={formatCurrency(roi?.total_spend_allocated)}
        />
        <MetricCard
          label="Earned media value"
          value={formatCurrency(roi?.total_earned_media_value)}
        />
        <MetricCard
          label="Verified impressions"
          value={formatNumber(
            typeof roi?.total_verified_impressions === "number"
              ? roi.total_verified_impressions
              : null,
          )}
        />
      </div>

      {state.status === "loading" ? <p>Loading reporting…</p> : null}

      {state.status === "ready" ? (
        <>
          <h3 className="uce-reporting-section-title">Leaderboard</h3>
          {state.data.leaderboard_rankings.length === 0 ? (
            <p>{EMPTY_FIELD}</p>
          ) : (
            <ul className="uce-reporting-leaderboard">
              {state.data.leaderboard_rankings.map((row) => (
                <li key={row.collaboration_id}>
                  #{row.rank_position} {displayField(row.instagram_handle)} — fee{" "}
                  {formatCurrency(row.assigned_fee_investment)} — impressions{" "}
                  {formatNumber(row.delivered_impressions_count)}
                </li>
              ))}
            </ul>
          )}

          <h3 className="uce-reporting-section-title">Creative gallery</h3>
          {state.data.creative_gallery_grid.length === 0 ? (
            <p>{EMPTY_FIELD}</p>
          ) : (
            <ul className="uce-reporting-gallery">
              {state.data.creative_gallery_grid.map((asset) => (
                <li key={asset.asset_id}>
                  {displayField(asset.instagram_handle)} — engagement{" "}
                  {asset.engagement_rate_percentage > 0
                    ? `${asset.engagement_rate_percentage}%`
                    : EMPTY_FIELD}
                </li>
              ))}
            </ul>
          )}

          <h3 className="uce-reporting-section-title">Hourly timeseries</h3>
          {state.data.timeseries_hourly_feed.length === 0 ? (
            <p>{EMPTY_FIELD}</p>
          ) : (
            <p>{state.data.timeseries_hourly_feed.length} hourly points loaded</p>
          )}
        </>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="uce-reporting-metric-card">
      <span className="uce-stat-label">{label}</span>
      <strong className="uce-stat-value">{value}</strong>
    </div>
  );
}
