import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button } from "../../../design-system/aurora";
import { useCreatorWorkspaceActorState } from "../../../shared/creator/creator-workspace-actor-context-value";
import { fetchApplication } from "../api/c03-client";
import type { CampaignScope } from "../api/c03-scope";
import { idSchema } from "../contracts/c03.contracts";
import { useCampaignResource } from "../hooks/use-c03-resource";
import { messageForError } from "../utils/c03-errors";
import {
  AssetContent,
  BriefContent,
  CommercialContent,
  DateValue,
} from "./CampaignContent";
import { ApplicationWithdraw } from "./ApplicationWithdraw";
import { BriefPackDownload } from "./BriefPackDownload";

export function ApplicationWorkspace() {
  const { applicationId } = useParams();
  return idSchema.safeParse(applicationId).success ? (
    <ApplicationResource key={applicationId} applicationId={applicationId!} />
  ) : (
    <section>
      <h1>Application unavailable</h1>
      <p>Open an Application from My Applications.</p>
    </section>
  );
}
function ApplicationResource({ applicationId }: { applicationId: string }) {
  const load = useCallback(
    (scope: CampaignScope) => fetchApplication(scope, applicationId),
    [applicationId],
  );
  const resource = useCampaignResource(load);
  const actor = useCreatorWorkspaceActorState();
  const [withdraw, setWithdraw] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const refresh = () => {
    setWithdraw(false);
    void resource.refresh();
  };
  const application = resource.data;
  if (!application)
    return (
      <section className="c03-content">
        <h1>Application</h1>
        {resource.loading ? (
          <p role="status">Loading Application…</p>
        ) : (
          <>
            <p role="alert">{messageForError(resource.error)}</p>
            <Button onClick={refresh}>Retry</Button>
          </>
        )}
      </section>
    );
  const canWithdraw =
    application.status === "PENDING" &&
    application.canWithdrawPending &&
    actor?.status === "READY" &&
    actor.actorContext.allowedActions.includes(
      "CAMPAIGN_APPLICATION_WITHDRAW_PENDING",
    );
  return (
    <article className="c03-content">
      <header className="cc-detail-hero">
        <p className="cc-muted">
          {application.campaign.brand?.name ?? "Brand not provided"}
        </p>
        <h1 className="cc-page-title">
          {application.campaign.name ?? "Campaign"} — Application
        </h1>
        <p>Application {application.applicationId}</p>
        <Badge tone="neutral">{application.status}</Badge>
        <p>
          Applied: <DateValue value={application.appliedAt} />
        </p>
        {application.terminalAt && (
          <p>
            Outcome recorded: <DateValue value={application.terminalAt} />
          </p>
        )}
      </header>
      {notice && <p role="status">{notice}</p>}
      {resource.loading && <p role="status">Refreshing Application…</p>}
      <p className="cc-muted">
        These details were recorded when this Application was submitted.
      </p>
      <BriefPackDownload applicationId={application.applicationId} />
      <section className="cc-detail-panel">
        <h2>Campaign snapshot</h2>
        <p>{application.campaign.objective ?? "Objective not provided"}</p>
        <p>
          {application.campaign.platforms?.join(" · ") ||
            "Platforms not provided"}
        </p>
        <p>
          Publishing starts:{" "}
          <DateValue value={application.campaign.publishingStart} />
        </p>
        <p>
          Publishing ends:{" "}
          <DateValue value={application.campaign.publishingEnd} />
        </p>
        <p>
          Application deadline:{" "}
          <DateValue value={application.campaign.applicationDeadline} />
        </p>
      </section>
      <section className="cc-detail-panel">
        <h2>Selected Asset &amp; Brief</h2>
        {application.asset.kind ? (
          <AssetContent
            asset={{ ...application.asset, kind: application.asset.kind }}
          />
        ) : (
          <p>Asset details not provided</p>
        )}
        <BriefContent definition={application.brief} />
      </section>
      <CommercialContent commercial={application.commercial} />
      {application.status === "APPROVED" && (
        <section className="cc-detail-panel">
          <h2>Collaboration</h2>
          {application.collaborationId ? (
            <Link
              className="aurora-button aurora-button--primary"
              to={`/creator/collaborations?thread=${encodeURIComponent(application.collaborationId)}`}
            >
              Open Collaboration
            </Link>
          ) : (
            <p role="status">
              The Collaboration link is currently unavailable. Contact support.
            </p>
          )}
        </section>
      )}
      <div className="cc-detail-cta-row">
        <Link
          className="aurora-button aurora-button--outline"
          to="/creator/campaigns/applications"
        >
          My Applications
        </Link>
        <Button variant="outline" disabled={resource.loading} onClick={refresh}>
          Refresh Application
        </Button>
        {canWithdraw && (
          <Button
            variant="outline"
            disabled={resource.loading}
            onClick={() => setWithdraw(true)}
          >
            Withdraw Application
          </Button>
        )}
      </div>
      {withdraw && canWithdraw && (
        <ApplicationWithdraw
          application={application}
          onClose={() => setWithdraw(false)}
          onRefresh={refresh}
          onWithdrawn={() => {
            setNotice("Withdraw confirmed by the server.");
            refresh();
          }}
        />
      )}
    </article>
  );
}
