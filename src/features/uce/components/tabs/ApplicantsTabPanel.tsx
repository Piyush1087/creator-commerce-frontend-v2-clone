import { useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { Alert } from "../../../../design-system/aurora";
import { fetchCanonicalApplicants } from "../../api/brand-uce-client";
import { PipelineApplicantsTable } from "../PipelineApplicantsTable";
import { useUceApiJson } from "../../hooks/use-uce-api-json";
import { displayField, EMPTY_FIELD } from "../../utils/display-field";

type ApplicantsTabPanelProps = {
  campaignId: string;
  campaignName: string;
};

export function ApplicantsTabPanel({
  campaignId,
  campaignName,
}: ApplicantsTabPanelProps) {
  const fetcher = useCallback(
    () => fetchCanonicalApplicants(campaignId),
    [campaignId],
  );
  const { state, reload } = useUceApiJson(Boolean(campaignId), fetcher);

  return (
    <div className="uce-tab-panel">
      <nav className="uce-tab-crumb">
        <span>Campaigns</span>
        <ChevronRight size={12} />
        <span>{displayField(campaignName)}</span>
        <ChevronRight size={12} />
        <span className="uce-tab-crumb-active">Applicants</span>
      </nav>
      <h2>Applicants</h2>
      {state.status === "error" ? (
        <Alert tone="error" title="Could not load applicants">
          {state.message}
        </Alert>
      ) : null}
      <div className="uce-stat-row">
        <div className="uce-stat-card">
          <span className="uce-stat-label">Total</span>
          <strong>
            {state.status === "ready"
              ? String(state.data.applicants.length)
              : EMPTY_FIELD}
          </strong>
        </div>
        <div className="uce-stat-card">
          <span className="uce-stat-label">Pending</span>
          <strong>
            {state.status === "ready"
              ? String(state.data.applicants.filter((row) => row.applicationStatus === "PENDING").length)
              : EMPTY_FIELD}
          </strong>
        </div>
      </div>
      {state.status === "loading" ? (
        <p>Loading applicants…</p>
      ) : state.status === "ready" ? (
        <PipelineApplicantsTable
          campaignId={campaignId}
          rows={state.data.applicants}
          onChanged={() => void reload()}
        />
      ) : null}
    </div>
  );
}
