import { useEffect, useState } from "react";

import { fetchCampaignPageView } from "../api/brand-uce-client";
import { CampaignDetailsDrawer } from "./CampaignDetailsDrawer";
import type { CampaignPageView } from "./types";

type CampaignContextState =
  | { status: "idle" | "loading" }
  | { status: "ready"; view: CampaignPageView }
  | { status: "error"; message: string };

export function CampaignContextDetailsDrawer({
  campaignId,
  campaignName,
  isOpen,
  onClose,
}: {
  campaignId: string;
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<CampaignContextState>({ status: "idle" });

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setState({ status: "loading" });
    void fetchCampaignPageView(campaignId)
      .then((view) => {
        if (!active) return;
        if (view.campaign.id !== campaignId || !view.details) {
          throw new Error("Campaign detail is not available for this reference.");
        }
        setState({ status: "ready", view });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setState({
          status: "error",
          message: cause instanceof Error ? cause.message : "Campaign details could not be loaded.",
        });
      });
    return () => {
      active = false;
    };
  }, [campaignId, isOpen]);

  const view = state.status === "ready" ? state.view : undefined;
  return (
    <CampaignDetailsDrawer
      campaignName={view?.campaign.name ?? campaignName}
      lifecycleStatus={view?.campaign.lifecycleStatus ?? "Campaign"}
      creationSource={view?.campaign.creationSource ?? "Read only"}
      details={view?.details}
      loading={state.status === "idle" || state.status === "loading"}
      error={state.status === "error" ? state.message : undefined}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}
