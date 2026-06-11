import { useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { Alert } from "../../../../design-system/aurora";
import { fetchPipelineActiveCollabs } from "../../api/brand-uce-client";
import { PipelineActiveCollabsTable } from "../PipelineActiveCollabsTable";
import { useUceApiJson } from "../../hooks/use-uce-api-json";
import { displayField, EMPTY_FIELD } from "../../utils/display-field";
import { formatPercent } from "../../utils/uce-format";

type ActiveCollabsTabPanelProps = {
  campaignId: string;
  campaignName: string;
};

export function ActiveCollabsTabPanel({
  campaignId,
  campaignName,
}: ActiveCollabsTabPanelProps) {
  const fetcher = useCallback(
    () => fetchPipelineActiveCollabs(campaignId),
    [campaignId],
  );
  const { state } = useUceApiJson(Boolean(campaignId), fetcher);

  return (
    <div className="uce-tab-panel">
      <nav className="uce-tab-crumb">
        <span>Campaigns</span>
        <ChevronRight size={12} />
        <span>{displayField(campaignName)}</span>
        <ChevronRight size={12} />
        <span className="uce-tab-crumb-active">Active Collabs</span>
      </nav>
      <h2>Active collaborations</h2>
      {state.status === "error" ? (
        <Alert tone="error" title="Could not load active collabs">
          {state.message}
        </Alert>
      ) : null}
      <div className="uce-stat-row">
        <div className="uce-stat-card">
          <span className="uce-stat-label">Total</span>
          <strong>
            {state.status === "ready"
              ? String(state.data.overview.total)
              : EMPTY_FIELD}
          </strong>
        </div>
        <div className="uce-stat-card">
          <span className="uce-stat-label">Mean match</span>
          <strong>
            {state.status === "ready"
              ? formatPercent(state.data.overview.mean_match_score)
              : EMPTY_FIELD}
          </strong>
        </div>
      </div>
      {state.status === "loading" ? (
        <p>Loading active collaborations…</p>
      ) : state.status === "ready" ? (
        <PipelineActiveCollabsTable rows={state.data.rows} />
      ) : null}
    </div>
  );
}
