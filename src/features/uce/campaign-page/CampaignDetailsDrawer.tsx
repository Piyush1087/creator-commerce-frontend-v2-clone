import { Alert, Badge, Button, SideDrawer } from "../../../design-system/aurora";
import type { CampaignDetailsView } from "./types";

export function CampaignDetailsDrawer({
  campaignName,
  lifecycleStatus,
  creationSource,
  details,
  loading,
  error,
  isOpen,
  onClose,
}: {
  campaignName: string;
  lifecycleStatus: string;
  creationSource: string;
  details?: CampaignDetailsView;
  loading: boolean;
  error?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Campaign Details"
      subtitle={campaignName}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {loading ? <p>Loading Campaign details…</p> : null}
      {error ? (
        <Alert title="Campaign details unavailable" tone="warning">
          {error}
        </Alert>
      ) : null}
      {!loading && !error && details ? (
        <div className="canonical-campaign-drawer__stack">
          <div className="canonical-campaign-drawer__badges">
            <Badge>{lifecycleStatus}</Badge>
            <Badge tone="neutral">{creationSource}</Badge>
          </div>
          <dl className="canonical-campaign-drawer__details">
            <div><dt>Objective</dt><dd>{details.objective ?? "—"}</dd></div>
            <div><dt>Timeline</dt><dd>{details.timelineType ?? "—"}</dd></div>
            <div><dt>Visibility</dt><dd>{details.visibilityScopes.join(", ") || "—"}</dd></div>
            <div><dt>Compensation</dt><dd>{details.compensationType ?? "—"}</dd></div>
            <div><dt>Budget pool</dt><dd>{details.budgetPool ?? "—"}</dd></div>
            <div>
              <dt>Platforms</dt>
              <dd>{details.platforms ? JSON.stringify(details.platforms) : "—"}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </SideDrawer>
  );
}
