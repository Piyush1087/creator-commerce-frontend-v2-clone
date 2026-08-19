import { useEffect, useState } from "react";

import { Alert, Badge, Button, SideDrawer } from "../../../design-system/aurora";
import { fetchCanonicalCampaignAssets } from "../api/brand-uce-client";
import type { LinkedCampaignAsset } from "./types";
import "./campaign-page.css";

type AssetState =
  | { status: "idle" | "loading" }
  | { status: "ready"; asset: LinkedCampaignAsset }
  | { status: "error"; message: string };

export function CanonicalAssetDetailsDrawer({
  campaignId,
  campaignAssetId,
  campaignName,
  isOpen,
  onClose,
}: {
  campaignId: string;
  campaignAssetId: string;
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<AssetState>({ status: "idle" });

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setState({ status: "loading" });
    void fetchCanonicalCampaignAssets(campaignId)
      .then((assets) => {
        if (!active) return;
        const asset = assets.find((item) => item.campaign_asset_id === campaignAssetId);
        if (!asset) throw new Error("Campaign Asset was not found in this Campaign.");
        setState({ status: "ready", asset });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setState({
          status: "error",
          message: cause instanceof Error ? cause.message : "Campaign Asset could not be loaded.",
        });
      });
    return () => {
      active = false;
    };
  }, [campaignAssetId, campaignId, isOpen]);

  const asset = state.status === "ready" ? state.asset : undefined;
  return (
    <SideDrawer
      closeLabel="Close Campaign Asset details"
      isOpen={isOpen}
      onClose={onClose}
      title="Campaign Asset"
      subtitle={campaignName}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="canonical-campaign-drawer__stack">
        {state.status === "idle" || state.status === "loading" ? <p>Loading Campaign Asset…</p> : null}
        {state.status === "error" ? <Alert title="Campaign Asset unavailable" tone="warning">{state.message}</Alert> : null}
        {asset ? (
          <>
            <div className="canonical-campaign-drawer__context canonical-campaign-drawer__asset-context">
              {asset.image_url ? <img src={asset.image_url} alt="" /> : <span className="canonical-campaign-drawer__asset-placeholder" aria-hidden="true">{asset.label.slice(0, 2).toUpperCase()}</span>}
              <div><span>Campaign-owned Asset</span><strong>{asset.label}</strong></div>
              <Badge>{asset.status}</Badge>
            </div>
            <section className="canonical-campaign-drawer__panel">
              <h3 className="canonical-campaign-drawer__section-title">Asset context</h3>
              <dl className="canonical-campaign-drawer__details">
                <div><dt>Type</dt><dd>{asset.kind}</dd></div>
                <div><dt>Subtype</dt><dd>{asset.subtype ?? "—"}</dd></div>
                <div><dt>Campaign</dt><dd>{campaignName}</dd></div>
                <div><dt>Access</dt><dd>Read only</dd></div>
              </dl>
            </section>
          </>
        ) : null}
      </div>
    </SideDrawer>
  );
}
