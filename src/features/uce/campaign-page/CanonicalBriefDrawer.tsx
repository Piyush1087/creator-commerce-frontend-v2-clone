import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Button,
  SideDrawer,
  TextField,
  Toggle,
} from "../../../design-system/aurora";
import {
  createCanonicalCampaignBrief,
  fetchCanonicalCampaignBriefs,
  updateCanonicalCampaignBrief,
} from "../api/brand-uce-client";
import { canDismissCanonicalWrite } from "./campaign-page-model";
import type {
  CanonicalBriefRecord,
  CanonicalBriefWriteBody,
  CanonicalCampaignAsset,
  CanonicalCampaignBriefSummary,
} from "./types";

type DeliverableDraft = CanonicalBriefWriteBody["deliverables"][number] & {
  localId: string;
};

let localSequence = 0;

function newDeliverable(): DeliverableDraft {
  localSequence += 1;
  return {
    localId: `canonical-deliverable-${localSequence}`,
    format: "",
    quantity: 1,
    creative_requirements: "",
    publishing_required: true,
  };
}

function fromSummary(brief: CanonicalCampaignBriefSummary): DeliverableDraft[] {
  return brief.deliverables.map((deliverable) => ({
    localId: deliverable.deliverableId,
    format: deliverable.format,
    quantity: deliverable.quantity,
    creative_requirements: deliverable.creativeRequirements,
    publishing_required: deliverable.publishingRequired,
  }));
}

function fromRecord(brief: CanonicalBriefRecord): DeliverableDraft[] {
  return brief.deliverables.map((deliverable) => ({
    localId: deliverable.deliverable_id,
    format: deliverable.format,
    quantity: deliverable.quantity,
    creative_requirements: deliverable.creative_requirements,
    publishing_required: deliverable.publishing_required,
  }));
}

export function CanonicalBriefDrawer({
  campaignId,
  asset,
  brief,
  canWrite,
  isOpen,
  onClose,
  onChanged,
}: {
  campaignId: string;
  asset?: CanonicalCampaignAsset;
  brief?: CanonicalCampaignBriefSummary;
  canWrite: boolean;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [requirements, setRequirements] = useState("");
  const [deliverables, setDeliverables] = useState<DeliverableDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [writeError, setWriteError] = useState<string>();

  const hydrate = useCallback(async () => {
    if (!asset) return;
    setLoading(true);
    setLoadError(undefined);
    try {
      const records = await fetchCanonicalCampaignBriefs(campaignId);
      if (brief) {
        const current = records.find(
          (record) => record.brief_id === brief.briefId,
        );
        if (!current || current.campaign_asset_id !== asset.campaignAssetId) {
          throw new Error(
            "Brief was not found beneath the selected Campaign Asset.",
          );
        }
        setTitle(current.title);
        setRequirements(current.creative_requirements);
        setDeliverables(fromRecord(current));
      }
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Canonical Briefs could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [asset, brief, campaignId]);

  useEffect(() => {
    if (!isOpen || !asset) return;
    setTitle(brief?.name ?? "");
    setRequirements(brief?.creativeRequirements ?? "");
    setDeliverables(brief ? fromSummary(brief) : [newDeliverable()]);
    setWriteError(undefined);
    void hydrate();
  }, [asset, brief, hydrate, isOpen]);

  const updateDeliverable = (
    localId: string,
    patch: Partial<Omit<DeliverableDraft, "localId">>,
  ) => {
    setDeliverables((current) =>
      current.map((deliverable) =>
        deliverable.localId === localId
          ? { ...deliverable, ...patch }
          : deliverable,
      ),
    );
  };

  const valid =
    title.trim().length >= 5 &&
    requirements.trim().length >= 10 &&
    deliverables.length > 0 &&
    deliverables.every(
      (item) =>
        item.format.trim().length >= 2 &&
        item.quantity > 0 &&
        item.creative_requirements.trim().length >= 5,
    );

  const requestClose = () => {
    if (canDismissCanonicalWrite(saving)) onClose();
  };

  const save = async () => {
    if (!asset || !valid || !canWrite || loadError) return;
    const body: CanonicalBriefWriteBody = {
      title: title.trim(),
      creative_requirements: requirements.trim(),
      deliverables: deliverables.map((deliverable) => ({
        format: deliverable.format.trim(),
        quantity: deliverable.quantity,
        creative_requirements: deliverable.creative_requirements.trim(),
        publishing_required: deliverable.publishing_required,
      })),
    };
    setSaving(true);
    setWriteError(undefined);
    try {
      if (brief) {
        await updateCanonicalCampaignBrief(campaignId, brief.briefId, body);
      } else {
        await createCanonicalCampaignBrief(campaignId, {
          campaign_asset_id: asset.campaignAssetId,
          ...body,
        });
      }
      await onChanged();
      onClose();
    } catch (error) {
      setWriteError(
        error instanceof Error
          ? error.message
          : "Canonical Brief could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer
      closeLabel={
        brief
          ? "Close Edit Canonical Brief drawer"
          : "Close Create Brief drawer"
      }
      isOpen={isOpen}
      onClose={requestClose}
      title={brief ? "Edit Canonical Brief" : "Create Canonical Brief"}
      subtitle={
        asset ? `Campaign Asset: ${asset.name}` : "Campaign Asset required"
      }
      footer={
        <div className="canonical-campaign-drawer__footer-actions">
          <Button disabled={saving} onClick={requestClose} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={
              !asset ||
              !canWrite ||
              !valid ||
              loading ||
              Boolean(loadError) ||
              saving
            }
            onClick={() => void save()}
          >
            {saving ? "Saving…" : brief ? "Save Brief" : "Create Brief"}
          </Button>
        </div>
      }
    >
      <div className="canonical-campaign-drawer__stack">
        <div className="canonical-campaign-drawer__context">
          <span>Campaign Asset → Brief → Deliverables</span>
          <strong>{asset?.name ?? "Campaign Asset required"}</strong>
          <p>
            This Campaign Asset is immutable ownership context. Editing cannot
            move the Brief to another Asset or Campaign.
          </p>
        </div>
        {!canWrite ? (
          <Alert title="Campaign is read-only" tone="warning">
            The backend capability projection does not allow this Brief change.
          </Alert>
        ) : null}
        {loading ? <p>Loading canonical Briefs…</p> : null}
        {loadError ? (
          <>
            <Alert title="Canonical Briefs unavailable" tone="error">
              {loadError}
            </Alert>
            <Button onClick={() => void hydrate()} size="sm" variant="outline">
              Retry
            </Button>
          </>
        ) : null}
        {!loading ? (
          <>
            {!valid ? (
              <p className="canonical-campaign-page__empty">
                A Brief requires a 5-character title, 10-character creative
                requirements, and at least one valid Deliverable.
              </p>
            ) : null}
            <section className="canonical-campaign-drawer__panel">
              <h3 className="canonical-campaign-drawer__section-title">
                Brief details
              </h3>
              <TextField
                label="Brief title"
                minLength={5}
                maxLength={255}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <TextField
                label="Creative requirements"
                minLength={10}
                maxLength={8000}
                multiline
                rows={5}
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
              />
            </section>
            <section className="canonical-campaign-drawer__panel">
              <h3 className="canonical-campaign-drawer__section-title">
                Deliverables
              </h3>
              {deliverables.map((deliverable, index) => (
                <article
                  className="canonical-campaign-drawer__list-item"
                  key={deliverable.localId}
                >
                  <strong>Deliverable {index + 1}</strong>
                  <TextField
                    label="Format"
                    minLength={2}
                    maxLength={80}
                    value={deliverable.format}
                    onChange={(event) =>
                      updateDeliverable(deliverable.localId, {
                        format: event.target.value,
                      })
                    }
                  />
                  <TextField
                    label="Quantity"
                    min={1}
                    type="number"
                    value={deliverable.quantity}
                    onChange={(event) =>
                      updateDeliverable(deliverable.localId, {
                        quantity: Number(event.target.value),
                      })
                    }
                  />
                  <TextField
                    label="Deliverable requirements"
                    minLength={5}
                    maxLength={4000}
                    multiline
                    rows={3}
                    value={deliverable.creative_requirements}
                    onChange={(event) =>
                      updateDeliverable(deliverable.localId, {
                        creative_requirements: event.target.value,
                      })
                    }
                  />
                  <Toggle
                    checked={deliverable.publishing_required}
                    label="Publishing required"
                    onChange={(publishing_required) =>
                      updateDeliverable(deliverable.localId, {
                        publishing_required,
                      })
                    }
                  />
                  {deliverables.length > 1 ? (
                    <Button
                      onClick={() =>
                        setDeliverables((current) =>
                          current.filter(
                            (item) => item.localId !== deliverable.localId,
                          ),
                        )
                      }
                      size="sm"
                      variant="ghost"
                    >
                      Remove deliverable
                    </Button>
                  ) : null}
                </article>
              ))}
              <Button
                onClick={() =>
                  setDeliverables((current) => [...current, newDeliverable()])
                }
                size="sm"
                variant="outline"
              >
                Add deliverable
              </Button>
            </section>
          </>
        ) : null}
        {writeError ? (
          <Alert title="Brief was not saved" tone="error">
            {writeError}
          </Alert>
        ) : null}
      </div>
    </SideDrawer>
  );
}
