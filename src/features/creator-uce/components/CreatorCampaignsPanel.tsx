import { useCallback, useEffect, useState } from "react";

import { Alert, Button, Card } from "../../../design-system/aurora";
import {
  fetchCreatorOpenCampaigns,
  postCreatorApply,
} from "../api/creator-uce-client";
import type { CreatorOpenCampaignRow } from "../contracts/creator-uce.contracts";

export function CreatorCampaignsPanel() {
  const [campaigns, setCampaigns] = useState<CreatorOpenCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchCreatorOpenCampaigns();
      setCampaigns(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load campaigns.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApply = async (campaign: CreatorOpenCampaignRow) => {
    const brief = campaign.briefs[0];
    const canonicalAsset = campaign.canonical_assets.find(
      (asset) => asset.briefs.length > 0,
    );
    const canonicalBrief = canonicalAsset?.briefs[0];
    if (!brief) {
      setError("This campaign has no active brief to apply to.");
      return;
    }
    if (!canonicalAsset || !canonicalBrief) {
      setError(
        "This campaign is missing its canonical Campaign Asset or Brief and cannot accept applications.",
      );
      return;
    }
    setApplyingId(campaign.campaign_id);
    setNotice(null);
    setError(null);
    try {
      const stockedProduct = campaign.products.find((p) => p.inventory_count > 0);
      await postCreatorApply(campaign.campaign_id, {
        canonical_campaign_asset_id: canonicalAsset.campaign_asset_id,
        canonical_brief_id: canonicalBrief.canonical_brief_id,
        brief_id: brief.brief_id,
        ...(stockedProduct ? { product_id: stockedProduct.product_id } : {}),
      });
      setNotice(`Applied to ${campaign.campaign_name}. The brand will review your application.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not apply.");
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) {
    return <p className="bob-muted">Loading open campaigns…</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Open campaigns</h2>
      <p className="bob-muted" style={{ margin: 0 }}>
        Browse active brand campaigns and apply. After approval, open Chat to negotiate.
      </p>
      {error ? (
        <Alert tone="error" title="Campaigns">
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert tone="success" title="Application sent">
          {notice}
        </Alert>
      ) : null}
      {campaigns.length === 0 ? (
        <p className="bob-muted">No active campaigns right now.</p>
      ) : (
        campaigns.map((c) => (
          <Card key={c.campaign_id}>
            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{c.campaign_name}</p>
            <p className="bob-muted" style={{ margin: "0 0 12px", fontSize: 14 }}>
              {c.brand_name}
              {c.briefs[0] ? ` · ${c.briefs[0].internal_title}` : ""}
            </p>
            {c.already_applied ? (
              <span className="bob-muted">Application pending or in review</span>
            ) : (
              <Button
                disabled={
                  applyingId === c.campaign_id ||
                  c.briefs.length === 0 ||
                  !c.canonical_assets.some((asset) => asset.briefs.length > 0)
                }
                onClick={() => void handleApply(c)}
              >
                {applyingId === c.campaign_id ? "Applying…" : "Apply"}
              </Button>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
