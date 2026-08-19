import {
  Alert,
  Badge,
  Button,
  SideDrawer,
} from "../../../design-system/aurora";
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
      closeLabel="Close Campaign Details drawer"
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
          <div className="canonical-campaign-drawer__context">
            <span>Campaign context</span>
            <strong>{campaignName}</strong>
            <div className="canonical-campaign-drawer__badges">
              <Badge>{lifecycleStatus}</Badge>
              <Badge tone="neutral">{creationSource}</Badge>
            </div>
          </div>
          <section className="canonical-campaign-drawer__panel">
            <h3 className="canonical-campaign-drawer__section-title">
              Campaign strategy
            </h3>
            <dl className="canonical-campaign-drawer__details">
              <div>
                <dt>Objective</dt>
                <dd>{details.objective ?? "—"}</dd>
              </div>
              <div>
                <dt>Timeline</dt>
                <dd>{details.timelineType ?? "—"}</dd>
              </div>
              <div>
                <dt>Visibility</dt>
                <dd>{details.visibilityScopes.join(", ") || "—"}</dd>
              </div>
              <div>
                <dt>Platforms</dt>
                <dd>
                  {details.platforms ? JSON.stringify(details.platforms) : "—"}
                </dd>
              </div>
            </dl>
          </section>
          <section className="canonical-campaign-drawer__panel">
            <h3 className="canonical-campaign-drawer__section-title">
              Commercial context
            </h3>
            <dl className="canonical-campaign-drawer__details">
              <div>
                <dt>Compensation</dt>
                <dd>{details.compensationType ?? "—"}</dd>
              </div>
              <div>
                <dt>Budget pool</dt>
                <dd>{details.budgetPool ?? "—"}</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : null}
    </SideDrawer>
  );
}
