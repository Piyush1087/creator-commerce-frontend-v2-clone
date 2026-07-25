import { CreatorCentreShell } from "../../../features/creator-centre/components/creator-centre-shell";
import { AnalyticsPulseWorkspace } from "../../../features/creator-centre/components/analytics-pulse-workspace";
import "../../../features/creator-centre/creator-centre.css";

export function CreatorAnalyticsPage() {
  return (
    <CreatorCentreShell>
      <AnalyticsPulseWorkspace />
    </CreatorCentreShell>
  );
}
