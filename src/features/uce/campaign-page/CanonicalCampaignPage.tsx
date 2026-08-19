import { useCallback, useEffect, useMemo, useState } from "react";

import { Alert } from "../../../design-system/aurora";
import {
  approveCampaignApplication,
  composeCampaignOutreach,
  fetchCampaignApplicationsView,
  fetchCampaignCreatorProfile,
  fetchCampaignDiscoveryView,
  fetchCampaignPageView,
  goLiveCampaign,
  patchCampaignStatus,
  publishCampaign,
  rejectCampaignApplication,
} from "../api/brand-uce-client";
import { CampaignDetailsDrawer } from "./CampaignDetailsDrawer";
import { CampaignAttentionPanel } from "./CampaignAttentionPanel";
import { CampaignAssetsBriefsPanel } from "./CampaignAssetsBriefsPanel";
import { CampaignFeatureHeader } from "./CampaignFeatureHeader";
import {
  ApplicantsWorkspaceContent,
  CollaborationWorkspaceContent,
  DiscoveryWorkspaceContent,
} from "./CampaignWorkspaceContent";
import { CampaignWorkspaceShell } from "./CampaignWorkspaceShell";
import { CanonicalAssetDrawer } from "./CanonicalAssetDrawer";
import { CanonicalBriefDrawer } from "./CanonicalBriefDrawer";
import { CreatorProfileDrawer } from "./CreatorProfileDrawer";
import { OutreachComposerDrawer } from "./OutreachComposerDrawer";
import { ReportingDrawer } from "./ReportingDrawer";
import {
  canCreateCanonicalBrief,
  canEditCanonicalBrief,
  canLinkCanonicalAsset,
  isCapabilityEnabled,
  resolveInitialWorkspace,
  surfaceStateMessage,
} from "./campaign-page-model";
import type {
  ApplicantsWorkspaceView,
  CampaignDetailsView,
  CampaignPageView,
  CampaignWorkspaceId,
  CanonicalCampaignAsset,
  CanonicalCampaignBriefSummary,
  CreatorProfileView,
  DiscoveryWorkspaceView,
  OutreachComposerView,
} from "./types";
import { WorkspaceStatePanel } from "./WorkspaceStatePanel";
import "./campaign-page.css";

export function CanonicalCampaignPage({
  view,
  onReload,
  onOpenLegacyProduct,
  onOpenLegacyBrief,
  onOpenShareFallback,
}: {
  view: CampaignPageView;
  onReload: () => Promise<void>;
  onOpenLegacyProduct?: (campaignAssetId: string) => void | Promise<void>;
  onOpenLegacyBrief?: (
    briefId: string,
    campaignAssetId: string,
  ) => void | Promise<void>;
  onOpenShareFallback?: () => void;
}) {
  const [workspace, setWorkspace] = useState<CampaignWorkspaceId>(() =>
    resolveInitialWorkspace(view),
  );
  const [notice, setNotice] = useState<string>();
  const [discovery, setDiscovery] = useState<DiscoveryWorkspaceView>();
  const [discoveryError, setDiscoveryError] = useState<string>();
  const [applicants, setApplicants] = useState<ApplicantsWorkspaceView>();
  const [applicantsError, setApplicantsError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string>();
  const [details, setDetails] = useState<CampaignDetailsView | undefined>(
    view.details,
  );

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string>();
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfileView>();

  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachError, setOutreachError] = useState<string>();
  const [outreachComposer, setOutreachComposer] =
    useState<OutreachComposerView>();
  const [outreachSubject, setOutreachSubject] = useState("");
  const [outreachBody, setOutreachBody] = useState("");

  const [reportOpen, setReportOpen] = useState(false);
  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false);
  const [briefDrawer, setBriefDrawer] = useState<{
    asset: CanonicalCampaignAsset;
    brief?: CanonicalCampaignBriefSummary;
  }>();

  const visibleWorkspaces = useMemo(
    () => view.workspaces.filter((w) => w.visible),
    [view.workspaces],
  );

  const workspaceProjection = visibleWorkspaces.find(
    (item) => item.workspace === workspace,
  );

  useEffect(() => {
    const current = visibleWorkspaces.find((w) => w.workspace === workspace);
    if (!current) {
      setWorkspace(visibleWorkspaces[0]?.workspace ?? "discovery");
    }
  }, [visibleWorkspaces, workspace]);

  useEffect(() => {
    setDiscovery(undefined);
    setDiscoveryError(undefined);
    setApplicants(undefined);
    setApplicantsError(undefined);
  }, [view.campaign.id]);

  const loadDiscovery = useCallback(async () => {
    setDiscoveryError(undefined);
    setDiscovery(undefined);
    try {
      setDiscovery(await fetchCampaignDiscoveryView(view.campaign.id));
    } catch (error) {
      setDiscoveryError(
        error instanceof Error ? error.message : "Discovery failed.",
      );
    }
  }, [view.campaign.id]);

  const loadApplicants = useCallback(async () => {
    setApplicantsError(undefined);
    setApplicants(undefined);
    try {
      setApplicants(await fetchCampaignApplicationsView(view.campaign.id));
    } catch (error) {
      setApplicantsError(
        error instanceof Error ? error.message : "Applicants failed.",
      );
    }
  }, [view.campaign.id]);

  useEffect(() => {
    if (workspaceProjection?.state === "UNAVAILABLE") return;
    if (workspace === "discovery" && !discovery && !discoveryError) {
      void loadDiscovery();
    }
    if (workspace === "applicants" && !applicants && !applicantsError) {
      void loadApplicants();
    }
  }, [
    applicants,
    applicantsError,
    discovery,
    discoveryError,
    loadApplicants,
    loadDiscovery,
    workspace,
    workspaceProjection?.state,
  ]);

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(true);
    setNotice(undefined);
    try {
      await action();
      await onReload();
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
      const refreshed = await fetchCampaignPageView(view.campaign.id);
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

  const lifecycleActions = [
    {
      label: "Publish",
      capability: view.campaign.capabilities.publish,
      action: () => publishCampaign(view.campaign.id),
    },
    {
      label: "Go live",
      capability: view.campaign.capabilities.goLive,
      action: () => goLiveCampaign(view.campaign.id),
    },
    {
      label: "Pause",
      capability: view.campaign.capabilities.pause,
      action: () => patchCampaignStatus(view.campaign.id, "PAUSED"),
    },
    {
      label: "Resume",
      capability: view.campaign.capabilities.resume,
      action: () => patchCampaignStatus(view.campaign.id, "LIVE"),
    },
  ];
  const primaryLifecycleAction = lifecycleActions.find((item) =>
    isCapabilityEnabled(item.capability),
  );
  const terminalCampaign =
    view.campaign.lifecycleStatus === "COMPLETED" ||
    view.campaign.lifecycleStatus === "ARCHIVED";

  return (
    <section
      className={`canonical-campaign-page${terminalCampaign ? " canonical-campaign-page--read-only" : ""}`}
    >
      <CampaignFeatureHeader
        actionsDisabled={busy}
        canShare={isCapabilityEnabled(view.share.capability)}
        canViewDetails={isCapabilityEnabled(view.campaign.capabilities.view)}
        onShare={() => onOpenShareFallback?.()}
        onViewDetails={() => void openCampaignDetails()}
        primaryAction={
          primaryLifecycleAction
            ? {
                disabled: busy,
                label: primaryLifecycleAction.label,
                onClick: () =>
                  void run(
                    primaryLifecycleAction.label,
                    primaryLifecycleAction.action,
                  ),
              }
            : undefined
        }
        view={view}
      />

      {terminalCampaign ? (
        <Alert title="Read-only Campaign" tone="warning">
          This Campaign is {view.campaign.lifecycleStatus}. Backend capability
          rules keep operational changes unavailable.
        </Alert>
      ) : null}

      <CampaignAttentionPanel
        notice={notice}
        onCreateBrief={(asset) => setBriefDrawer({ asset })}
        onLinkAsset={() => setAssetDrawerOpen(true)}
        onSelectWorkspace={setWorkspace}
        view={view}
      />

      <CampaignAssetsBriefsPanel
        onCreateBrief={(asset) => setBriefDrawer({ asset })}
        onEditBrief={(asset, brief) => setBriefDrawer({ asset, brief })}
        onLinkAsset={() => setAssetDrawerOpen(true)}
        onOpenLegacyBrief={onOpenLegacyBrief}
        onOpenLegacyProduct={onOpenLegacyProduct}
        view={view}
      />

      <CampaignWorkspaceShell
        activeWorkspace={workspace}
        onSelect={setWorkspace}
        workspaces={visibleWorkspaces}
      >
        {workspaceProjection
          ? [workspaceProjection].map((item) => (
              <div
                className="canonical-campaign-page__workspace-content"
                key={item.workspace}
              >
                {item.state === "UNAVAILABLE" ? (
                  <WorkspaceStatePanel
                    kind="unavailable"
                    title={`${item.workspace[0].toUpperCase()}${item.workspace.slice(1)} unavailable`}
                  >
                    <p>
                      {surfaceStateMessage(
                        item.state,
                        `${item.workspace[0].toUpperCase()}${item.workspace.slice(1)}`,
                      ) ?? "This workspace is unavailable."}
                      {item.workspace === "applicants" && item.count
                        ? ` ${item.count} existing Application record(s) remain visible as compatibility context.`
                        : ""}
                    </p>
                  </WorkspaceStatePanel>
                ) : item.workspace === "discovery" ? (
                  <DiscoveryWorkspaceContent
                    busy={busy}
                    discovery={discovery}
                    error={discoveryError}
                    onOpenProfile={(campaignCreatorId) =>
                      void openCreatorProfile(campaignCreatorId)
                    }
                    onOpenOutreach={(campaignCreatorId) =>
                      void openOutreach(campaignCreatorId)
                    }
                    onRetry={() => void loadDiscovery()}
                  />
                ) : item.workspace === "applicants" ? (
                  <>
                    {item.pendingCount != null || item.rejectedCount != null ? (
                      <p className="canonical-campaign-page__workspace-summary">
                        {item.pendingCount ?? 0} pending ·{" "}
                        {item.rejectedCount ?? 0} rejected
                      </p>
                    ) : null}
                    <ApplicantsWorkspaceContent
                      applicants={applicants}
                      busy={busy}
                      error={applicantsError}
                      onApprove={(applicationId) =>
                        void run("Approve", async () => {
                          await approveCampaignApplication(
                            view.campaign.id,
                            applicationId,
                          );
                          setApplicants(
                            await fetchCampaignApplicationsView(
                              view.campaign.id,
                            ),
                          );
                        })
                      }
                      onOpenProfile={(campaignCreatorId) =>
                        void openCreatorProfile(campaignCreatorId)
                      }
                      onReject={(applicationId) =>
                        void run("Reject", async () => {
                          await rejectCampaignApplication(
                            view.campaign.id,
                            applicationId,
                            "Not a fit for this campaign",
                          );
                          setApplicants(
                            await fetchCampaignApplicationsView(
                              view.campaign.id,
                            ),
                          );
                        })
                      }
                      onRetry={() => void loadApplicants()}
                    />
                  </>
                ) : (
                  <CollaborationWorkspaceContent
                    count={item.count}
                    state={item.state}
                  />
                )}
              </div>
            ))
          : null}
      </CampaignWorkspaceShell>

      <CanonicalAssetDrawer
        campaignId={view.campaign.id}
        campaignName={view.campaign.name}
        canWrite={canLinkCanonicalAsset(view)}
        isOpen={assetDrawerOpen}
        onChanged={onReload}
        onClose={() => setAssetDrawerOpen(false)}
      />

      <CanonicalBriefDrawer
        asset={briefDrawer?.asset}
        brief={briefDrawer?.brief}
        campaignId={view.campaign.id}
        canWrite={
          briefDrawer?.brief
            ? canEditCanonicalBrief(view)
            : canCreateCanonicalBrief(view)
        }
        isOpen={Boolean(briefDrawer)}
        onChanged={onReload}
        onClose={() => setBriefDrawer(undefined)}
      />

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
        campaignName={view.campaign.name}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        performanceSummary={view.performanceSummary}
      />
    </section>
  );
}
