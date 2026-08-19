import { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, Button, SideDrawer } from "../../../design-system/aurora";
import {
  fetchCanonicalCampaignAssets,
  fetchSelectableCampaignAssets,
  linkCanonicalCampaignAsset,
} from "../api/brand-uce-client";
import { canDismissCanonicalWrite } from "./campaign-page-model";
import { canonicalAssetKindLabel } from "./campaign-page-presentation";
import type { LinkedCampaignAsset, SelectableCampaignAsset } from "./types";

type CatalogState =
  | { status: "idle" | "loading" }
  | {
      status: "ready";
      selectable: SelectableCampaignAsset[];
      linked: LinkedCampaignAsset[];
    }
  | { status: "error"; message: string };

function optionKey(asset: Pick<SelectableCampaignAsset, "kind" | "entity_id">) {
  return `${asset.kind}:${asset.entity_id}`;
}

export function CanonicalAssetDrawer({
  campaignId,
  campaignName,
  isOpen,
  canWrite,
  onClose,
  onChanged,
}: {
  campaignId: string;
  campaignName: string;
  isOpen: boolean;
  canWrite: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [catalog, setCatalog] = useState<CatalogState>({ status: "idle" });
  const [selection, setSelection] = useState("");
  const [saving, setSaving] = useState(false);
  const [writeError, setWriteError] = useState<string>();

  const load = useCallback(async () => {
    setCatalog({ status: "loading" });
    setWriteError(undefined);
    try {
      const [selectable, linked] = await Promise.all([
        fetchSelectableCampaignAssets(),
        fetchCanonicalCampaignAssets(campaignId),
      ]);
      setCatalog({ status: "ready", selectable, linked });
    } catch (error) {
      setCatalog({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Campaign Assets could not be loaded.",
      });
    }
  }, [campaignId]);

  useEffect(() => {
    if (!isOpen) return;
    setSelection("");
    void load();
  }, [isOpen, load]);

  const available = useMemo(() => {
    if (catalog.status !== "ready") return [];
    const linked = new Set(catalog.linked.map(optionKey));
    return catalog.selectable.filter((asset) => !linked.has(optionKey(asset)));
  }, [catalog]);

  const selected = available.find((asset) => optionKey(asset) === selection);
  const requestClose = () => {
    if (canDismissCanonicalWrite(saving)) onClose();
  };

  const link = async () => {
    if (!selected || !canWrite) return;
    setSaving(true);
    setWriteError(undefined);
    try {
      await linkCanonicalCampaignAsset(campaignId, {
        kind: selected.kind,
        entity_id: selected.entity_id,
      });
      await onChanged();
      onClose();
    } catch (error) {
      setWriteError(
        error instanceof Error
          ? error.message
          : "Campaign Asset could not be linked.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer
      closeLabel="Close Link Campaign Asset drawer"
      isOpen={isOpen}
      onClose={requestClose}
      title="Link Campaign Asset"
      subtitle={campaignName}
      footer={
        <div className="canonical-campaign-drawer__footer-actions">
          <Button disabled={saving} onClick={requestClose} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={!selected || !canWrite || saving}
            onClick={() => void link()}
          >
            {saving ? "Linking…" : "Link Asset"}
          </Button>
        </div>
      }
    >
      <div className="canonical-campaign-drawer__stack">
        <div className="canonical-campaign-drawer__context">
          <span>Campaign</span>
          <strong>{campaignName}</strong>
          <p>
            Select one explicit Brand Centre entity. Legacy Campaign Products
            are never converted or linked automatically.
          </p>
        </div>
        {!canWrite ? (
          <Alert title="Campaign is read-only" tone="warning">
            The backend capability projection does not allow Campaign Asset
            changes.
          </Alert>
        ) : null}
        {catalog.status === "loading" || catalog.status === "idle" ? (
          <p>Loading selectable Brand Centre entities…</p>
        ) : null}
        {catalog.status === "error" ? (
          <>
            <Alert title="Campaign Assets unavailable" tone="error">
              {catalog.message}
            </Alert>
            <Button onClick={() => void load()} size="sm" variant="outline">
              Retry
            </Button>
          </>
        ) : null}
        {catalog.status === "ready" ? (
          available.length > 0 ? (
            <section aria-labelledby="select-campaign-asset-heading">
              <h3
                className="canonical-campaign-drawer__section-title"
                id="select-campaign-asset-heading"
              >
                Select a Brand Centre entity
              </h3>
              <div className="canonical-campaign-drawer__selection-list">
                {available.map((asset) => {
                  const key = optionKey(asset);
                  const isSelected = selection === key;
                  return (
                    <button
                      aria-pressed={isSelected}
                      className="canonical-campaign-drawer__selection-card"
                      disabled={saving || !canWrite}
                      key={key}
                      onClick={() => setSelection(key)}
                      type="button"
                    >
                      {asset.image_url ? (
                        <img alt="" src={asset.image_url} />
                      ) : (
                        <span
                          aria-hidden
                          className="canonical-campaign-drawer__selection-placeholder"
                        >
                          {asset.label.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span>
                        <strong>{asset.label}</strong>
                        <small>{canonicalAssetKindLabel(asset)}</small>
                      </span>
                      <span className="canonical-campaign-drawer__selection-status">
                        {isSelected ? "Selected" : "Select"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <Alert title="No selectable entities" tone="warning">
              Every available Brand Centre entity is already linked, or Brand
              Centre has no eligible entities.
            </Alert>
          )
        ) : null}
        {writeError ? (
          <Alert title="Asset was not linked" tone="error">
            {writeError}
          </Alert>
        ) : null}
      </div>
    </SideDrawer>
  );
}
