import { Badge, Button } from "../../../design-system/aurora";
import type { CampaignPageView } from "./types";

type HeaderAction = {
  label: string;
  disabled: boolean;
  onClick: () => void;
};

export function CampaignFeatureHeader({
  view,
  primaryAction,
  canViewDetails,
  onViewDetails,
  canShare,
  onShare,
  actionsDisabled,
}: {
  view: CampaignPageView;
  primaryAction?: HeaderAction;
  canViewDetails: boolean;
  onViewDetails: () => void;
  canShare: boolean;
  onShare: () => void;
  actionsDisabled: boolean;
}) {
  return (
    <header className="canonical-campaign-page__feature-header">
      <div className="canonical-campaign-page__feature-main">
        <p className="canonical-campaign-page__eyebrow">Campaign</p>
        <div className="canonical-campaign-page__title-row">
          <h1>{view.campaign.name}</h1>
          <Badge>{view.campaign.lifecycleStatus}</Badge>
          <Badge tone={view.readiness.ready ? "success" : "pending"}>
            {view.readiness.ready ? "Ready" : "Readiness required"}
          </Badge>
        </div>

        <dl className="canonical-campaign-page__feature-context">
          <div>
            <dt>Objective</dt>
            <dd>{view.details?.objective ?? "Not supplied"}</dd>
          </div>
          <div>
            <dt>Created from</dt>
            <dd>
              {view.campaign.creationSource === "AI_RECOMMENDED"
                ? "AI recommended"
                : "Manual"}
            </dd>
          </div>
          <div>
            <dt>Canonical setup</dt>
            <dd>
              {view.campaign.assetCount} Campaign Asset
              {view.campaign.assetCount === 1 ? "" : "s"} ·{" "}
              {view.campaign.canonicalBriefCount} ready Brief
              {view.campaign.canonicalBriefCount === 1 ? "" : "s"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="canonical-campaign-page__feature-actions">
        {primaryAction ? (
          <Button
            disabled={primaryAction.disabled}
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </Button>
        ) : null}
        <div className="canonical-campaign-page__secondary-actions">
          {canViewDetails ? (
            <Button
              disabled={actionsDisabled}
              onClick={onViewDetails}
              variant="outline"
            >
              View details
            </Button>
          ) : null}
          {canShare ? (
            <Button
              disabled={actionsDisabled}
              onClick={onShare}
              variant="ghost"
            >
              Share
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
