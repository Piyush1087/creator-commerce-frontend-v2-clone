import { useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { Alert } from "../../../../design-system/aurora";
import { fetchPipelineProspects } from "../../api/brand-uce-client";
import { PipelineDataTable } from "../PipelineDataTable";
import { useUceApiJson } from "../../hooks/use-uce-api-json";
import { displayField, EMPTY_FIELD } from "../../utils/display-field";
import { formatPercent } from "../../utils/uce-format";

type ProspectsTabPanelProps = {
  campaignId: string;
  campaignName: string;
};

export function ProspectsTabPanel({ campaignId, campaignName }: ProspectsTabPanelProps) {
  const fetcher = useCallback(
    () => fetchPipelineProspects(campaignId),
    [campaignId],
  );
  const { state } = useUceApiJson(Boolean(campaignId), fetcher);

  return (
    <div className="uce-tab-panel">
      <TabBreadcrumb campaignName={campaignName} tab="Prospects" />
      {state.status === "error" ? (
        <Alert tone="error" title="Could not load prospects">
          {state.message}
        </Alert>
      ) : null}
      <div className="uce-stat-row">
        <StatCard
          label="Active Pipeline"
          value={
            state.status === "ready"
              ? String(state.data.overview.total)
              : state.status === "loading"
                ? "…"
                : EMPTY_FIELD
          }
        />
        <StatCard
          label="Mean match score"
          value={
            state.status === "ready"
              ? formatPercent(state.data.overview.mean_match_score)
              : EMPTY_FIELD
          }
        />
        <StatCard label="Meta sourcing" value={EMPTY_FIELD} />
      </div>
      {state.status === "loading" ? (
        <p>Loading prospects…</p>
      ) : state.status === "ready" ? (
        <PipelineDataTable rows={state.data.rows} />
      ) : null}
    </div>
  );
}

function TabBreadcrumb({
  campaignName,
  tab,
}: {
  campaignName: string;
  tab: string;
}) {
  return (
    <nav className="uce-tab-crumb">
      <span>Campaigns</span>
      <ChevronRight size={12} />
      <span>{displayField(campaignName)}</span>
      <ChevronRight size={12} />
      <span className="uce-tab-crumb-active">{tab}</span>
    </nav>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="uce-stat-card">
      <span className="uce-stat-label">{label}</span>
      <strong className="uce-stat-value">{value}</strong>
    </div>
  );
}
