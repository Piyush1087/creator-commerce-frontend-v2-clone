import { useEffect, useMemo, useState } from "react";

import { Alert, Badge, Button, Card } from "../../../design-system/aurora";
import {
  approveCampaignApplication,
  composeCampaignOutreach,
  fetchCampaignApplicationsView,
  fetchCampaignCreatorProfile,
  fetchCampaignDiscoveryView,
  fetchCampaignPageView,
  fetchCampaignReporting,
  goLiveCampaign,
  patchCampaignStatus,
  publishCampaign,
  rejectCampaignApplication,
} from "../api/brand-uce-client";
import type { CampaignReportingResponse } from "../contracts/brand-uce.contracts";
import { CampaignDetailsDrawer } from "./CampaignDetailsDrawer";
import { CreatorCard } from "./CreatorCard";
import { CreatorProfileDrawer } from "./CreatorProfileDrawer";
import { OutreachComposerDrawer } from "./OutreachComposerDrawer";
import { ReportingDrawer } from "./ReportingDrawer";
import type {
  ApplicantsWorkspaceView,
  CampaignDetailsView,
  CampaignPageView,
  Capability,
  CreatorProfileView,
  DiscoveryWorkspaceView,
  OutreachComposerView,
} from "./types";
import "./campaign-page.css";

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
  const [busy, setBusy] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string>();
  const [details, setDetails] = useState<CampaignDetailsView | undefined>(view.details);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string>();
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfileView>();

  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachError, setOutreachError] = useState<string>();
  const [outreachComposer, setOutreachComposer] = useState<OutreachComposerView>();
  const [outreachSubject, setOutreachSubject] = useState("");
  const [outreachBody, setOutreachBody] = useState("");

  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string>();
  const [report, setReport] = useState<CampaignReportingResponse>();

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
      void fetchCampaignDiscoveryView(view.campaign.id)
        .then((data) => setDiscovery(data as DiscoveryWorkspaceView))
        .catch((error) =>
          setNotice(error instanceof Error ? error.message : "Discovery failed."),
        );
    }
    if (workspace === "APPLICANTS" && !applicants) {
      void fetchCampaignApplicationsView(view.campaign.id)
        .then((data) => setApplicants(data as ApplicantsWorkspaceView))
        .catch((error) =>
          setNotice(error instanceof Error ? error.message : "Applicants failed."),
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

  const openCampaignDetails = async () => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError(undefined);
    try {
      const refreshed = (await fetchCampaignPageView(view.campaign.id)) as CampaignPageView;
      setDetails(refreshed.details);
    } catch (error) {
      setDetailsError(
        error instanceof Error ? error.message : "Campaign details failed.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const openCreatorProfile = async (campaignCreatorId: string) => {
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileError(undefined);
    setCreatorProfile(undefined);
    try {
      const data = (await fetchCampaignCreatorProfile(
        view.campaign.id,
        campaignCreatorId,
      )) as CreatorProfileView;
      setCreatorProfile(data);
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Creator profile failed.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const openOutreach = async (campaignCreatorId: string) => {
    setOutreachOpen(true);
    setOutreachLoading(true);
    setOutreachError(undefined);
    setOutreachComposer(undefined);
    setOutreachSubject("");
    setOutreachBody("");
    try {
      const data = (await composeCampaignOutreach(
        view.campaign.id,
        campaignCreatorId,
      )) as OutreachComposerView;
      setOutreachComposer(data);
      setOutreachSubject(data.subject ?? "");
      setOutreachBody(data.body);
    } catch (error) {
      setOutreachError(
        error instanceof Error ? error.message : "Outreach compose failed.",
      );
    } finally {
      setOutreachLoading(false);
    }
  };

  const openReport = async () => {
    setReportOpen(true);
    setReportLoading(true);
    setReportError(undefined);
    try {
      setReport(await fetchCampaignReporting(view.campaign.id));
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : "Campaign reporting failed.",
      );
    } finally {
      setReportLoading(false);
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
          {canRender(view.campaign.capabilities.view) && (
            <Button
              disabled={!isEnabled(view.campaign.capabilities.view) || busy}
              onClick={() => void openCampaignDetails()}
              variant="outline"
            >
              View
            </Button>
          )}
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
          Post-live readiness blocked. Restore Product/Brief readiness to continue
          execution.
        </Alert>
      )}

      <div className="canonical-campaign-page__layout">
        <div className="canonical-campaign-page__primary">
          <Card title="Campaign Overview">
            <div className="canonical-campaign-page__overview-row">
              <div>
                <p className="canonical-campaign-page__empty">Objective</p>
                <strong>{view.details?.objective ?? "—"}</strong>
              </div>
              <div>
                <p className="canonical-campaign-page__empty">Creation source</p>
                <strong>{view.campaign.creationSource}</strong>
              </div>
              <Button onClick={() => void openCampaignDetails()} variant="outline">
                View details
              </Button>
            </div>
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
              <div className="canonical-campaign-page__stack">
                <div className="canonical-campaign-page__metrics">
                  {view.performanceSummary.metrics.map((metric) => (
                    <div key={metric.metricId}>
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                  ))}
                </div>
                {canRender(view.performanceSummary.capability) ? (
                  <Button
                    disabled={!isEnabled(view.performanceSummary.capability) || busy}
                    onClick={() => void openReport()}
                    variant="outline"
                  >
                    View report
                  </Button>
                ) : null}
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
                        onPrimaryAction={() => void openOutreach(creator.campaignCreatorId)}
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
                  {applicants?.state === "READY" ? (
                    <div className="canonical-campaign-page__stack">
                      {applicants.applicants.map((applicant) => (
                        <Button
                          key={`profile-${applicant.applicationId}`}
                          onClick={() => void openCreatorProfile(applicant.campaignCreatorId)}
                          size="sm"
                          variant="ghost"
                        >
                          View {applicant.name} profile
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
              {workspace === item.workspace && item.workspace === "COLLABORATIONS" ? (
                <p className="canonical-campaign-page__empty">
                  Collaboration detail remains independently owned by the Collaboration module.
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      </div>

      <CampaignDetailsDrawer
        campaignName={view.campaign.name}
        creationSource={view.campaign.creationSource}
        details={details}
        error={detailsError}
        isOpen={detailsOpen}
        lifecycleStatus={view.campaign.lifecycleStatus}
        loading={detailsLoading}
        onClose={() => setDetailsOpen(false)}
      />

      <CreatorProfileDrawer
        error={profileError}
        isOpen={profileOpen}
        loading={profileLoading}
        onClose={() => setProfileOpen(false)}
        profile={creatorProfile}
      />

      <OutreachComposerDrawer
        body={outreachBody}
        composer={outreachComposer}
        error={outreachError}
        isOpen={outreachOpen}
        loading={outreachLoading}
        onBodyChange={setOutreachBody}
        onClose={() => setOutreachOpen(false)}
        onSubjectChange={setOutreachSubject}
        subject={outreachSubject}
      />

      <ReportingDrawer
        error={reportError}
        isOpen={reportOpen}
        loading={reportLoading}
        onClose={() => setReportOpen(false)}
        report={report}
      />
    </section>
  );
}
