import { Loader2 } from "lucide-react";

import { Alert } from "../../../design-system/aurora";

type IntelligenceRefreshStatusBannerProps = {
  jobStatus: string | null;
  jobId: string | null;
};

export function IntelligenceRefreshStatusBanner({
  jobStatus,
  jobId,
}: IntelligenceRefreshStatusBannerProps) {
  const detail =
    jobStatus === "RUNNING"
      ? "Gemini is analyzing your baseline and generating actionable insight cards."
      : "Your intelligence refresh is queued. Insight cards usually appear within a minute.";

  return (
    <div className="brand-centre-deep-scan-banner">
      <Alert tone="warning" title="Intelligence refresh in progress">
        <span className="brand-centre-deep-scan-banner__body">
          <Loader2
            size={16}
            className="brand-centre-deep-scan-banner__spinner"
            aria-hidden
          />
          <span>
            {detail} Opportunity cards will populate below when complete (
            {jobStatus ?? "QUEUED"}
            {jobId ? ` · job ${jobId.slice(0, 8)}…` : ""}).
          </span>
        </span>
      </Alert>
    </div>
  );
}
