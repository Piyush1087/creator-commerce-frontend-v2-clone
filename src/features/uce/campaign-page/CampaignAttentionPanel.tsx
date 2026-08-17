import { Alert, Button, Card } from "../../../design-system/aurora";
import {
  canCreateCanonicalBrief,
  canLinkCanonicalAsset,
} from "./campaign-page-model";
import type {
  CampaignPageView,
  CampaignWorkspaceId,
  CanonicalCampaignAsset,
} from "./types";

export function CampaignAttentionPanel({
  view,
  notice,
  onLinkAsset,
  onCreateBrief,
  onSelectWorkspace,
}: {
  view: CampaignPageView;
  notice?: string;
  onLinkAsset: () => void;
  onCreateBrief: (asset: CanonicalCampaignAsset) => void;
  onSelectWorkspace: (workspace: CampaignWorkspaceId) => void;
}) {
  const activeAsset = view.assetsBriefsSummary.assets.find(
    (asset) => asset.status === "ACTIVE",
  );
  const needsAsset = view.readiness.remediation.some(
    (item) => item.requirement === "campaign_asset",
  );
  const needsBrief = view.readiness.remediation.some(
    (item) => item.requirement === "canonical_brief",
  );

  return (
    <Card
      className="canonical-campaign-page__attention"
      compact
      eyebrow="Campaign attention"
      title={
        view.readiness.ready
          ? "Ready for operation"
          : "Setup requires attention"
      }
    >
      <div className="canonical-campaign-page__attention-grid">
        <div className="canonical-campaign-page__attention-primary">
          {notice ? (
            <Alert title="Campaign notice" tone="warning">
              {notice}
            </Alert>
          ) : null}

          {view.readiness.ready ? (
            <Alert title="Canonical prerequisites ready" tone="success">
              This Campaign has an active canonical Campaign Asset and a ready
              canonical Brief.
            </Alert>
          ) : (
            <Alert
              title={
                view.hydration.postLiveReadinessBlocked
                  ? "Post-live readiness blocked"
                  : "Readiness requirements"
              }
              tone="warning"
            >
              Lifecycle remains {view.campaign.lifecycleStatus}. Complete the
              backend-projected remediation below; readiness does not change
              Campaign lifecycle
              {view.hydration.postLiveReadinessBlocked
                ? ", including after the Campaign has gone live."
                : "."}
            </Alert>
          )}

          {view.readiness.remediation.length > 0 ? (
            <ul className="canonical-campaign-page__remediation">
              {view.readiness.remediation.map((item) => (
                <li key={item.requirement}>{item.message}</li>
              ))}
            </ul>
          ) : null}

          <div className="canonical-campaign-page__row">
            {needsAsset && canLinkCanonicalAsset(view) ? (
              <Button onClick={onLinkAsset}>Link Campaign Asset</Button>
            ) : null}
            {needsBrief && activeAsset && canCreateCanonicalBrief(view) ? (
              <Button
                onClick={() => onCreateBrief(activeAsset)}
                variant="outline"
              >
                Create Brief
              </Button>
            ) : null}
          </div>
        </div>

        <div className="canonical-campaign-page__attention-secondary">
          <details className="canonical-campaign-page__secondary-disclosure">
            <summary>
              <span id="campaign-copilot-heading">Campaign Copilot</span>
              <small>{view.copilotSummary.state}</small>
            </summary>
            <div aria-labelledby="campaign-copilot-heading">
              {view.copilotSummary.state === "READY" ? (
                <>
                  <p>{view.copilotSummary.summary}</p>
                  <div className="canonical-campaign-page__row">
                    {view.copilotSummary.actions.map((action) => (
                      <Button
                        key={action.id}
                        onClick={() =>
                          onSelectWorkspace(
                            action.action === "APPLICANTS"
                              ? "applicants"
                              : "discovery",
                          )
                        }
                        size="sm"
                        variant="outline"
                      >
                        {action.context ?? action.label}
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="canonical-campaign-page__empty">
                  Campaign Copilot is unavailable for this state.
                </p>
              )}
            </div>
          </details>

          <section aria-labelledby="campaign-reporting-heading">
            <h3 id="campaign-reporting-heading">Reporting</h3>
            <p className="canonical-campaign-page__empty">
              {view.performanceSummary.message ??
                "Canonical reporting is unavailable for this Campaign."}
            </p>
          </section>
        </div>
      </div>
    </Card>
  );
}
