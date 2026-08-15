import { useState } from "react";

import {
  Alert,
  Button,
  Card,
  SelectField,
  TextField,
  Toggle,
} from "../../../design-system/aurora";
import { createCanonicalCampaignBrief } from "../api/brand-uce-client";
import type {
  CampaignAssetProjection,
  CanonicalCampaignBrief,
} from "../contracts/brand-uce.contracts";

type Props = {
  campaignId: string;
  assets: CampaignAssetProjection[];
  briefs: CanonicalCampaignBrief[];
  canCreate: boolean;
  onCreated: () => Promise<void>;
};

export function CanonicalCampaignBriefsCard({
  campaignId,
  assets,
  briefs,
  canCreate,
  onCreated,
}: Props) {
  const [assetId, setAssetId] = useState("");
  const [title, setTitle] = useState("");
  const [requirements, setRequirements] = useState("");
  const [format, setFormat] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [publishingRequired, setPublishingRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    assetId.length > 0 &&
    title.trim().length >= 5 &&
    requirements.trim().length >= 10 &&
    format.trim().length >= 2 &&
    quantity > 0;

  return (
    <Card eyebrow="Campaign Briefs" title="Briefs & deliverables">
      {briefs.length === 0 ? (
        <p>No Brief has been created for a Campaign Asset.</p>
      ) : null}
      {briefs.map((brief) => (
        <article key={brief.brief_id}>
          <strong>{brief.title}</strong>
          <p>{brief.creative_requirements}</p>
          <ul>
            {brief.deliverables.map((deliverable) => (
              <li key={deliverable.deliverable_id}>
                {deliverable.quantity} × {deliverable.format}
                {deliverable.publishing_required
                  ? " · publishing required"
                  : ""}
              </li>
            ))}
          </ul>
        </article>
      ))}

      {canCreate ? (
        <div>
          <SelectField
            label="Campaign Asset"
            value={assetId}
            onChange={(event) => setAssetId(event.target.value)}
            options={[
              { value: "", label: "Choose the Asset this Brief belongs to" },
              ...assets.map((asset) => ({
                value: asset.campaign_asset_id,
                label: asset.label,
              })),
            ]}
            helperText="Asset ownership must be selected explicitly."
          />
          <TextField
            label="Brief title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <TextField
            multiline
            label="Creative requirements"
            value={requirements}
            onChange={(event) => setRequirements(event.target.value)}
          />
          <TextField
            label="Deliverable format"
            value={format}
            onChange={(event) => setFormat(event.target.value)}
          />
          <TextField
            label="Quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
          <Toggle
            label="Publishing is required"
            checked={publishingRequired}
            onChange={setPublishingRequired}
          />
          <Button
            type="button"
            disabled={!valid || saving}
            onClick={() => {
              setSaving(true);
              setError(null);
              void createCanonicalCampaignBrief(campaignId, {
                campaign_asset_id: assetId,
                title: title.trim(),
                creative_requirements: requirements.trim(),
                deliverables: [
                  {
                    format: format.trim(),
                    quantity,
                    creative_requirements: requirements.trim(),
                    publishing_required: publishingRequired,
                  },
                ],
              })
                .then(onCreated)
                .then(() => {
                  setTitle("");
                  setRequirements("");
                  setFormat("");
                  setQuantity(1);
                })
                .catch((cause: unknown) =>
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : "Brief could not be created.",
                  ),
                )
                .finally(() => setSaving(false));
            }}
          >
            {saving ? "Creating…" : "Create Brief"}
          </Button>
        </div>
      ) : (
        <Alert tone="warning" title="Brief creation unavailable">
          Link an active Brand Centre Asset before creating a Brief for this
          Campaign.
        </Alert>
      )}
      {error ? (
        <Alert tone="error" title="Could not create Brief">
          {error}
        </Alert>
      ) : null}
    </Card>
  );
}
