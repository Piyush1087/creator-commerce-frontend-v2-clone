import { Loader2 } from "lucide-react";

import { Alert } from "../../../design-system/aurora";

type PlannerAggregateStatusBannerProps = {
  jobStatus: string | null;
};

export function PlannerAggregateStatusBanner({
  jobStatus,
}: PlannerAggregateStatusBannerProps) {
  const detail =
    jobStatus === "RUNNING"
      ? "Gemini is building your consolidated campaign draft from the approved insight."
      : "Your planner draft is queued. This usually takes under a minute.";

  return (
    <div className="brand-centre-deep-scan-banner">
      <Alert tone="warning" title="Campaign planner draft in progress">
        <span className="brand-centre-deep-scan-banner__body">
          <Loader2
            size={16}
            className="brand-centre-deep-scan-banner__spinner"
            aria-hidden
          />
          <span>
            {detail} Cards will appear below when consolidation completes (
            {jobStatus ?? "QUEUED"}).
          </span>
        </span>
      </Alert>
    </div>
  );
}
