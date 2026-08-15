import { useEffect, useMemo, useState } from "react";

import { Alert, Button, Card, SelectField } from "../../../design-system/aurora";
import {
  fetchSelectableCampaignAssets,
  selectCampaignAsset,
} from "../api/brand-uce-client";
import type {
  CampaignAssetProjection,
  SelectableCampaignAsset,
} from "../contracts/brand-uce.contracts";

type Props = {
  campaignId: string;
  assets: CampaignAssetProjection[];
  reconciliation: { required: boolean; title: string | null; message: string | null };
  canSelect: boolean;
  onLinked: () => Promise<void>;
};

export function CampaignAssetReconciliationCard({
  campaignId,
  assets,
  reconciliation,
  canSelect,
  onLinked,
}: Props) {
  const [choices, setChoices] = useState<SelectableCampaignAsset[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canSelect) return;
    void fetchSelectableCampaignAssets()
      .then((rows) => setChoices(rows))
      .catch(() => setError("Brand Centre Assets could not be loaded."));
  }, [canSelect]);

  const selectedChoice = useMemo(
    () => choices.find((choice) => `${choice.kind}:${choice.entity_id}` === selected),
    [choices, selected],
  );

  return (
    <Card eyebrow="Campaign Assets" title="Brand Centre Assets">
      {reconciliation.required ? (
        <Alert tone="warning" title={reconciliation.title ?? "Campaign setup needs reconciliation"}>
          {reconciliation.message ?? "Link the correct Brand Centre Asset before continuing this Campaign."}
        </Alert>
      ) : null}
      {assets.length > 0 ? (
        <ul>
          {assets.map((asset) => (
            <li key={asset.campaign_asset_id}>
              <strong>{asset.label}</strong>{asset.subtype ? ` · ${asset.subtype}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p>No Brand Centre Asset is linked yet.</p>
      )}
      {canSelect ? (
        <div>
          <SelectField
            label="Select the Brand Centre Asset this Campaign promotes"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            options={[
              { value: "", label: "Choose an Asset" },
              ...choices.map((choice) => ({
                value: `${choice.kind}:${choice.entity_id}`,
                label: `${choice.label}${choice.subtype ? ` (${choice.subtype})` : ""}`,
              })),
            ]}
            helperText="Choose explicitly. Creator Shop will not select an Asset automatically."
          />
          <Button
            type="button"
            disabled={!selectedChoice || saving}
            onClick={() => {
              if (!selectedChoice) return;
              setSaving(true);
              setError(null);
              void selectCampaignAsset(campaignId, {
                kind: selectedChoice.kind,
                entity_id: selectedChoice.entity_id,
              })
                .then(onLinked)
                .catch((cause: unknown) =>
                  setError(cause instanceof Error ? cause.message : "Asset could not be linked."),
                )
                .finally(() => setSaving(false));
            }}
          >
            {saving ? "Linking…" : "Link Asset"}
          </Button>
        </div>
      ) : null}
      {error ? <Alert tone="error" title="Could not link Asset">{error}</Alert> : null}
    </Card>
  );
}
