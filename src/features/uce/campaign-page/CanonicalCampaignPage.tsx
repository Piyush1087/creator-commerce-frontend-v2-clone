import { useEffect, useMemo, useState } from "react";

import { Alert, Badge, Button, Card } from "../../../design-system/aurora";
import {
  approveCampaignApplication,
  composeCampaignOutreach,
  fetchCampaignApplicationsView,
  fetchCampaignCreatorProfile,
  fetchCampaignDiscoveryView,
  goLiveCampaign,
  patchCampaignStatus,
  publishCampaign,
  rejectCampaignApplication,
} from "../api/brand-uce-client";
import { CreatorCard } from "./CreatorCard";
import type {
  ApplicantsWorkspaceView,
  CampaignPageView,
  Capability,
  DiscoveryWorkspaceView,
} from "./types";
import "./campaign-page.css";

type CreatorProfileView = {
  state: string;
  campaignCreatorId: string;
  name: string;
  email?: string | null;
  platform: string;
  source: string;
  reviewState: string;
  applications: Array<{
    applicationId: string;
    status: string;
    source: string;
    appliedAt: string;
  }>;
};

function canRender(capability: Capability | undefined) {
  return capability && capability.presentation !== "HIDDEN";
}

function isEnabled(capability: Capability | undefined) {
  return Boolean(capability?.available && capability.presentation === "ENABLED");
}

export function CanonicalCampaignPage({
  view,
  onReload,
  onAddProduct,
  onAddBrief,
  onOpenProduct,
  onOpenBrief,
  onOpenShareFallback,
}: {
  view: CampaignPageView;
  onReload: () => void;
  onAddProduct: () => void;
  onAddBrief: (campaignAssetId: string) => void;
  onOpenProduct?: (campaignAssetId: string) => void | Promise<void>;
  onOpenBrief?: (
    briefId: string,
    campaignAssetId: string,
  ) => void | Promise<void>;
  onOpenShareFallback?: () => void;
}) {
  const [workspace, setWorkspace] = useState<"DISCOVERY" | "APPLICANTS" | "COLLABORATIONS">(
    () => {
      const visible = view.workspaces.filter((w) => w.visible);
      const focused = visible.find((w) => w.workspace === view.hydration.primaryFocus);
      return focused?.workspace ?? visible[0]?.workspace ?? "DISCOVERY";
    },
  );
  const [notice, setNotice] = useState<string>();
  const [discovery, setDiscovery] = useState<DiscoveryWorkspaceView>();
  const [applicants, setApplicants] = useState<ApplicantsWorkspaceView>();
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfileView>();
  const [busy, setBusy] = useState(false);

  const openCreatorProfile = async (campaignCreatorId: string) => {
    setBusy(true);
    try {
      const data = (await fetchCampaignCreatorProfile(
        view.campaign.id,
        campaignCreatorId,
      )) as CreatorProfileView;
      setCreatorProfile(data);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Creator profile failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const visibleWorkspaces = useMemo(
    () => view.workspaces.filter((w) => w.visible && w.expand.presentation !== "HIDDEN"),
    [view.workspaces],
  );

  useEffect(() => {
    const current = visibleWorkspaces.find((w) => w.workspace === workspace);
    if (!current) {
      setWorkspace(visibleWorkspaces[0]?.workspace ?? "DISCOVERY");
    }
  }, [visibleWorkspaces, workspace]);

  useEffect(() => {
    if (workspace === "DISCOVERY" && !discovery) {
      void fetchCampaignDiscoveryView(view.campaign.id).then((data) =>
        setDiscovery(data as DiscoveryWorkspaceView),
      );
    }
    if (workspace === "APPLICANTS" && !applicants) {
      void fetchCampaignApplicationsView(view.campaign.id).then((data) =>
        setApplicants(data as ApplicantsWorkspaceView),
      );
    }
  }, [workspace, discovery, applicants, view.campaign.id]);

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(true);
    setNotice(undefined);
    try {
      await action();
      onReload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `${label} failed.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="canonical-campaign-page">
      <header className="canonical-campaign-page__header">
        <div>
          <p className="canonical-campaign-page__eyebrow">Campaign</p>
          <div className="canonical-campaign-page__title-row">
            <h1>{view.campaign.name}</h1>
            <Badge>{view.campaign.lifecycleStatus}</Badge>
          </div>
          <p className="canonical-campaign-page__meta">
            {view.campaign.productCount} Products · {view.campaign.briefCount} Briefs ·{" "}
            {view.hydration.outcome}
          </p>
        </div>
        <div className="canonical-campaign-page__actions">
          {canRender(view.campaign.capabilities.publish) && (
            <Button
              disabled={!isEnabled(view.campaign.capabilities.publish) || busy}
              onClick={() => void run("Publish", () => publishCampaign(view.campaign.id))}
            >
              Publish
            </Button>
          )}
          {canRender(view.campaign.capabilities.goLive) && (
            <Button
              disabled={!isEnabled(view.campaign.capabilities.goLive) || busy}
              onClick={() => void run("Go live", () => goLiveCampaign(view.campaign.id))}
            >
              Go live
            </Button>
          )}
          {canRender(view.campaign.capabilities.pause) && (
            <Button
              disabled={!isEnabled(view.campaign.capabilities.pause) || busy}
              onClick={() =>
                void run("Pause", () => patchCampaignStatus(view.campaign.id, "PAUSED"))
              }
              variant="outline"
            >
              Pause
            </Button>
          )}
          {canRender(view.campaign.capabilities.resume) && (
            <Button
              disabled={!isEnabled(view.campaign.capabilities.resume) || busy}
              onClick={() =>
                void run("Resume", () => patchCampaignStatus(view.campaign.id, "LIVE"))
              }
              variant="outline"
            >
              Resume
            </Button>
          )}
          {canRender(view.share.capability) && (
            <Button
              disabled={!isEnabled(view.share.capability) || busy}
              onClick={() => onOpenShareFallback?.()}
            >
              Share
            </Button>
          )}
        </div>
      </header>

      {notice && (
        <Alert title="Campaign notice" tone="warning">
          {notice}
        </Alert>
      )}
      {view.hydration.postLiveReadinessBlocked && (
        <Alert title="Readiness blocked" tone="warning">
          Post-live readiness blocked. Restore Product/Brief/budget readiness to continue
          execution.
        </Alert>
      )}

      <div className="canonical-campaign-page__layout">
        <div className="canonical-campaign-page__primary">
          <Card title="Campaign Details">
            {view.details ? (
              <dl className="canonical-campaign-page__details">
                <div>
                  <dt>Objective</dt>
                  <dd>{view.details.objective ?? "—"}</dd>
                </div>
                <div>
                  <dt>Timeline</dt>
                  <dd>{view.details.timelineType ?? "—"}</dd>
                </div>
                <div>
                  <dt>Visibility</dt>
                  <dd>{view.details.visibilityScopes.join(", ") || "—"}</dd>
                </div>
                <div>
                  <dt>Compensation</dt>
                  <dd>{view.details.compensationType ?? "—"}</dd>
                </div>
                <div>
                  <dt>Budget pool</dt>
                  <dd>
                    {view.details.budgetPool != null ? view.details.budgetPool : "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p>Campaign details unavailable.</p>
            )}
          </Card>

          <Card title="Campaign Copilot">
            {view.copilotSummary.state === "READY" ? (
              <>
                <p>{view.copilotSummary.summary}</p>
                <div className="canonical-campaign-page__stack">
                  {view.copilotSummary.actions.map((action) => (
                    <Button
                      key={action.id}
                      onClick={() =>
                        setWorkspace(
                          action.action === "APPLICANTS" ? "APPLICANTS" : "DISCOVERY",
                        )
                      }
                      variant="outline"
                    >
                      {action.context ?? action.label}
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <p>Campaign Copilot is unavailable for this state.</p>
            )}
          </Card>

          <Card title="Performance">
            {view.performanceSummary.state === "READY" ? (
              <div className="canonical-campaign-page__metrics">
                {view.performanceSummary.metrics.map((metric) => (
                  <div key={metric.metricId}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p>Reporting is unavailable for this state.</p>
            )}
          </Card>

          <Card title="Products & Briefs">
            <div className="canonical-campaign-page__stack">
              {view.productsBriefsSummary.products.map((product) => (
                <article
                  className="canonical-campaign-page__asset"
                  key={product.campaignAssetId}
                >
                  <div className="canonical-campaign-page__asset-header">
                    <div className="canonical-campaign-page__asset-title">
                      <strong>{product.name}</strong>
                      {product.status ? <Badge tone="neutral">{product.status}</Badge> : null}
                    </div>
                    <Button
                      onClick={() => void onOpenProduct?.(product.campaignAssetId)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      View product
                    </Button>
                  </div>

                  <div className="canonical-campaign-page__brief-list">
                    {product.briefs.length === 0 ? (
                      <p className="canonical-campaign-page__empty">No briefs</p>
                    ) : (
                      product.briefs.map((brief) => (
                        <div
                          className="canonical-campaign-page__brief-row"
                          key={brief.briefId}
                        >
                          <div className="canonical-campaign-page__asset-title">
                            <span>{brief.name}</span>
                            {brief.status ? (
                              <Badge tone="neutral">{brief.status}</Badge>
                            ) : null}
                          </div>
                          <Button
                            onClick={() =>
                              void onOpenBrief?.(
                                brief.briefId,
                                product.campaignAssetId,
                              )
                            }
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            View brief
                          </Button>
                        </div>
                      ))
                    )}
                  </div>

                  <Button
                    onClick={() => onAddBrief(product.campaignAssetId)}
                    size="sm"
                    variant="outline"
                  >
                    Add Brief
                  </Button>
                </article>
              ))}
              <Button onClick={onAddProduct} fullWidthOnMobile>
                Add Product
              </Button>
            </div>
          </Card>
        </div>

        <div className="canonical-campaign-page__workspaces">
          {visibleWorkspaces.map((item) => (
            <Card
              key={item.workspace}
              title={`${item.workspace}${item.count != null ? ` (${item.count})` : ""}`}
            >
              <Button
                disabled={!item.expand.available}
                onClick={() => setWorkspace(item.workspace)}
                variant={workspace === item.workspace ? "primary" : "outline"}
              >
                {workspace === item.workspace ? "Expanded" : "Open"}
              </Button>
              {workspace === item.workspace && item.workspace === "DISCOVERY" && (
                <div className="canonical-campaign-page__stack">
                  {!discovery ? (
                    <p>Loading Discovery…</p>
                  ) : discovery.state !== "READY" ? (
                    <p>No prospects yet.</p>
                  ) : (
                    discovery.creators.map((creator) => (
                      <CreatorCard
                        key={creator.campaignCreatorId}
                        avatarInitials={creator.avatarInitials}
                        busy={busy}
                        category={creator.category}
                        contextLabel={creator.contextLabel}
                        engagement={creator.engagement}
                        followers={creator.followers}
                        name={creator.name}
                        onPrimaryAction={() =>
                          void run("Outreach compose", () =>
                            composeCampaignOutreach(
                              view.campaign.id,
                              creator.campaignCreatorId,
                            ),
                          )
                        }
                        onSecondaryAction={() =>
                          void openCreatorProfile(creator.campaignCreatorId)
                        }
                        primaryActionLabel="Outreach"
                        secondaryActionLabel="Profile"
                      />
                    ))
                  )}
                </div>
              )}
              {workspace === item.workspace && item.workspace === "APPLICANTS" && (
                <div className="canonical-campaign-page__stack">
                  {!applicants ? (
                    <p>Loading Applicants…</p>
                  ) : applicants.state !== "READY" ? (
                    <p>No applicants yet.</p>
                  ) : (
                    applicants.applicants.map((applicant) => (
                      <CreatorCard
                        key={applicant.applicationId}
                        applicationStatus={applicant.applicationStatus}
                        avatarInitials={applicant.avatarInitials}
                        busy={busy}
                        category={applicant.category}
                        engagement={applicant.engagement}
                        followers={applicant.followers}
                        name={applicant.name}
                        onPrimaryAction={() =>
                          void run("Approve", async () => {
                            await approveCampaignApplication(
                              view.campaign.id,
                              applicant.applicationId,
                            );
                            setApplicants(
                              (await fetchCampaignApplicationsView(
                                view.campaign.id,
                              )) as ApplicantsWorkspaceView,
                            );
                          })
                        }
                        onSecondaryAction={() =>
                          void run("Reject", async () => {
                            await rejectCampaignApplication(
                              view.campaign.id,
                              applicant.applicationId,
                              "Not a fit for this campaign",
                            );
                            setApplicants(
                              (await fetchCampaignApplicationsView(
                                view.campaign.id,
                              )) as ApplicantsWorkspaceView,
                            );
                          })
                        }
                        primaryActionLabel="Approve"
                        secondaryActionLabel="Reject"
                      />
                    ))
                  )}
                </div>
              )}
            </Card>
          ))}

          {creatorProfile ? (
            <Card title="Creator Profile (Campaign)">
              <p>
                <strong>{creatorProfile.name}</strong> · {creatorProfile.platform} ·{" "}
                {creatorProfile.source}
              </p>
              <p>{creatorProfile.email ?? "No email on file"}</p>
              <p>Review: {creatorProfile.reviewState}</p>
              <div className="canonical-campaign-page__stack">
                {creatorProfile.applications.map((app) => (
                  <p key={app.applicationId}>
                    {app.status} · {app.source} · {app.appliedAt}
                  </p>
                ))}
              </div>
              <Button onClick={() => setCreatorProfile(undefined)} variant="outline">
                Close profile
              </Button>
            </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}
