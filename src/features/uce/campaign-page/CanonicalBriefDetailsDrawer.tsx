import { useEffect, useState } from "react";

import { Alert, Badge, Button, SideDrawer } from "../../../design-system/aurora";
import { fetchCanonicalCampaignBriefs } from "../api/brand-uce-client";
import type { CanonicalBriefRecord } from "./types";
import "./campaign-page.css";

type BriefState =
  | { status: "idle" | "loading" }
  | { status: "ready"; brief: CanonicalBriefRecord }
  | { status: "error"; message: string };

export function CanonicalBriefDetailsDrawer({
  campaignId,
  campaignAssetId,
  briefId,
  campaignName,
  isOpen,
  onClose,
}: {
  campaignId: string;
  campaignAssetId: string;
  briefId: string;
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<BriefState>({ status: "idle" });

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setState({ status: "loading" });
    void fetchCanonicalCampaignBriefs(campaignId)
      .then((briefs) => {
        if (!active) return;
        const brief = briefs.find(
          (item) => item.brief_id === briefId && item.campaign_asset_id === campaignAssetId,
        );
        if (!brief) throw new Error("Brief was not found beneath the referenced Campaign Asset.");
        setState({ status: "ready", brief });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setState({
          status: "error",
          message: cause instanceof Error ? cause.message : "Canonical Brief could not be loaded.",
        });
      });
    return () => {
      active = false;
    };
  }, [briefId, campaignAssetId, campaignId, isOpen]);

  const brief = state.status === "ready" ? state.brief : undefined;
  return (
    <SideDrawer
      closeLabel="Close canonical Brief details"
      isOpen={isOpen}
      onClose={onClose}
      title="Campaign Brief"
      subtitle={campaignName}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="canonical-campaign-drawer__stack">
        {state.status === "idle" || state.status === "loading" ? <p>Loading canonical Brief…</p> : null}
        {state.status === "error" ? <Alert title="Campaign Brief unavailable" tone="warning">{state.message}</Alert> : null}
        {brief ? (
          <>
            <div className="canonical-campaign-drawer__context">
              <span>Campaign Asset → Brief → Deliverables</span>
              <strong>{brief.title}</strong>
              <div className="canonical-campaign-drawer__badges">
                <Badge>{brief.is_active ? "Published" : "Paused"}</Badge>
                <Badge tone="neutral">Read only</Badge>
              </div>
            </div>
            <section className="canonical-campaign-drawer__panel">
              <h3 className="canonical-campaign-drawer__section-title">Brief details</h3>
              <p className="canonical-campaign-drawer__body">{brief.creative_requirements || "No creative requirements provided."}</p>
            </section>
            <section className="canonical-campaign-drawer__panel">
              <h3 className="canonical-campaign-drawer__section-title">Deliverables</h3>
              <div className="canonical-campaign-drawer__list">
                {brief.deliverables.map((deliverable, index) => (
                  <article className="canonical-campaign-drawer__list-item" key={deliverable.deliverable_id}>
                    <strong>Deliverable {index + 1}: {deliverable.format}</strong>
                    <p>{deliverable.creative_requirements}</p>
                    <span>{deliverable.quantity} required · Publishing {deliverable.publishing_required ? "required" : "not required"}</span>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </SideDrawer>
  );
}
