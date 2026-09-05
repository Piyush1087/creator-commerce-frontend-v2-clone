import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, SideDrawer } from "../../../design-system/aurora";
import { useCreatorWorkspaceActorState } from "../../../shared/creator/creator-workspace-actor-context-value";
import { fetchApplication } from "../api/c03-client";
import type {
  Asset,
  AuthorizedOpportunity,
  Brief,
  Receipt,
} from "../contracts/c03.contracts";
import { messageForError, messageForReason } from "../utils/c03-errors";
import { useCampaignScope } from "./CampaignAuthority";
import {
  AssetContent,
  BriefContent,
  CommercialContent,
  DateValue,
  SafeReference,
  assetName,
} from "./CampaignContent";
import { OptionalMedia } from "./OptionalMedia";
import { OpportunityApply } from "./OpportunityApply";

export function OpportunityDossier({
  opportunity,
  refresh,
}: {
  opportunity: AuthorizedOpportunity;
  refresh: () => void;
}) {
  const scope = useCampaignScope();
  const actor = useCreatorWorkspaceActorState();
  const [overlay, setOverlay] = useState<
    | { kind: "asset"; asset: Asset }
    | { kind: "brief"; brief: Brief }
    | { kind: "apply"; briefId?: string }
    | null
  >(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [receiptError, setReceiptError] = useState<unknown>(null);
  const allowed =
    opportunity.canApply &&
    actor?.status === "READY" &&
    actor.actorContext.allowedActions.includes("CAMPAIGN_APPLICATION_APPLY");
  const { campaign } = opportunity;
  const success = async (value: Receipt) => {
    setOverlay(null);
    setReceipt(value);
    setReceiptError(null);
    try {
      await fetchApplication(scope, value.applicationId);
      scope.assertCurrent();
    } catch (error) {
      if (!scope.signal.aborted) setReceiptError(error);
    }
    if (!scope.signal.aborted) refresh();
  };
  return (
    <div className="c03-content">
      <article className="cc-detail-hero">
        <div className="cc-detail-hero__top">
          <OptionalMedia
            src={campaign.brand?.logoUrl}
            alt=""
            className="cc-detail-product-thumb"
            placeholderClassName="cc-media-placeholder cc-detail-product-thumb"
          />
          <div>
            <p className="cc-muted">
              {campaign.brand?.name ?? "Brand not provided"}
            </p>
            <h1 className="cc-page-title">{campaign.name}</h1>
            <p>
              {campaign.brand?.description ?? "Brand description not provided"}
            </p>
            <SafeReference value={campaign.brand?.domain ?? null} />
          </div>
        </div>
        <div className="cc-detail-telemetry">
          <div>
            <h2>Campaign objective</h2>
            <p>{campaign.objective ?? "Not provided"}</p>
          </div>
          <div>
            <h2>Platforms</h2>
            <p>{campaign.platforms.join(" · ") || "Not provided"}</p>
          </div>
        </div>
      </article>
      {receipt && (
        <section className="cc-detail-panel">
          <p role="status">Application submitted. Status: {receipt.status}.</p>
          <Link
            className="aurora-button aurora-button--outline"
            to={`/creator/campaigns/applications/${receipt.applicationId}`}
          >
            View this Application
          </Link>
          {!!receiptError && (
            <p role="alert">
              The command succeeded, but its detail could not be loaded.{" "}
              {messageForError(receiptError)}
            </p>
          )}
          <Button variant="outline" onClick={refresh}>
            Refresh opportunity
          </Button>
        </section>
      )}
      <div className="cc-detail-layout">
        <section className="cc-detail-panel">
          <h2>Publishing &amp; application timing</h2>
          <dl className="c03-definition">
            <div>
              <dt>Publishing starts</dt>
              <dd>
                <DateValue value={campaign.publishingStart} />
              </dd>
            </div>
            <div>
              <dt>Publishing ends</dt>
              <dd>
                <DateValue value={campaign.publishingEnd} />
              </dd>
            </div>
            <div>
              <dt>Application deadline</dt>
              <dd>
                <DateValue value={opportunity.applicationDeadline} />
              </dd>
            </div>
          </dl>
          <p>
            {opportunity.applicationsOpen
              ? "Applications open"
              : "Applications closed"}
          </p>
        </section>
        <CommercialContent commercial={campaign.commercial} />
      </div>
      {!opportunity.canApply && (
        <p role="status">{messageForReason(opportunity.applyBlockedReason)}</p>
      )}
      <section className="c03-content">
        <h2>Assets &amp; Briefs</h2>
        {opportunity.assets.length === 0 && <p>No Assets are available.</p>}
        {opportunity.assets.map((asset) => (
          <article className="cc-detail-panel" key={asset.id}>
            <h3>{assetName(asset)}</h3>
            <p>
              {asset.status === "ACTIVE" ? "Active Asset" : "Asset unavailable"}
            </p>
            <Button
              variant="outline"
              onClick={() => setOverlay({ kind: "asset", asset })}
            >
              View {assetName(asset)} details
            </Button>
            <ul className="c03-list">
              {asset.briefs.map((brief) => (
                <li key={brief.id}>
                  <h4>{brief.definition.briefName ?? "Brief"}</h4>
                  <p>
                    {brief.definition.platform ?? "Platform not provided"} ·{" "}
                    {brief.definition.deliverables.length} deliverables
                  </p>
                  {brief.applicationSelection.state === "UNAVAILABLE" && (
                    <p>{messageForReason(brief.applicationSelection.reason)}</p>
                  )}
                  <div className="cc-detail-cta-row">
                    <Button
                      variant="outline"
                      onClick={() => setOverlay({ kind: "brief", brief })}
                    >
                      Read {brief.definition.briefName ?? "Brief"}
                    </Button>
                    {allowed &&
                      asset.status === "ACTIVE" &&
                      brief.status === "PUBLISHED" &&
                      brief.applicationSelection.state === "AVAILABLE" && (
                        <Button
                          onClick={() =>
                            setOverlay({ kind: "apply", briefId: brief.id })
                          }
                        >
                          Apply to this Brief
                        </Button>
                      )}
                  </div>
                </li>
              ))}
            </ul>
            {asset.briefs.length === 0 && (
              <p>No Briefs are available for this Asset.</p>
            )}
          </article>
        ))}
      </section>
      <div className="cc-detail-cta-row">
        {allowed && (
          <Button onClick={() => setOverlay({ kind: "apply" })}>
            Apply to Campaign
          </Button>
        )}
        <Link
          className="aurora-button aurora-button--outline"
          to="/creator/campaigns/applications"
        >
          My Applications
        </Link>
      </div>
      {overlay?.kind === "apply" && (
        <OpportunityApply
          opportunity={opportunity}
          initialBriefId={overlay.briefId}
          onClose={() => setOverlay(null)}
          onRefresh={() => {
            setOverlay(null);
            refresh();
          }}
          onSuccess={(value) => void success(value)}
        />
      )}
      {overlay?.kind === "asset" && (
        <SideDrawer
          isOpen
          title="Asset details"
          onClose={() => setOverlay(null)}
        >
          <div className="c03-content">
            <AssetContent asset={overlay.asset} />
          </div>
        </SideDrawer>
      )}
      {overlay?.kind === "brief" && (
        <SideDrawer
          isOpen
          title="Brief details"
          onClose={() => setOverlay(null)}
        >
          <div className="c03-content">
            <BriefContent definition={overlay.brief.definition} />
          </div>
        </SideDrawer>
      )}
    </div>
  );
}
