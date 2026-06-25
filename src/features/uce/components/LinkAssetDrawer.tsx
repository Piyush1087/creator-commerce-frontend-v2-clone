import { useEffect, useMemo, useState } from "react";
import { Info, Package } from "lucide-react";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";
import { fetchBrandCentreDna } from "../../brand-centre/api/brand-centre-client";
import type { BrandCentreOfferingRow } from "../../brand-centre/contracts/brand-centre.contracts";
import type { CreateCampaignProductBody } from "../contracts/brand-uce.contracts";
import {
  listBrandCatalogOfferings,
  mapOfferingToCreateProductBody,
} from "../utils/map-offering-to-product";
import { displayField } from "../utils/display-field";
import "./UCE_Remix.css";
import "./BriefingWizardDrawer.css";

type LinkAssetDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  linkedProductNames: string[];
  onCreateProduct: (body: CreateCampaignProductBody) => Promise<void>;
  isSubmitting?: boolean;
};

export function LinkAssetDrawer({
  isOpen,
  onClose,
  campaignName,
  linkedProductNames,
  onCreateProduct,
  isSubmitting = false,
}: LinkAssetDrawerProps) {
  const [catalog, setCatalog] = useState<BrandCentreOfferingRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [inventoryCount, setInventoryCount] = useState("10");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setSelectedId("");
    setInventoryCount("10");
    setError(null);
    setCatalogLoading(true);
    setCatalogError(null);
    void fetchBrandCentreDna()
      .then((dna) => {
        setCatalog(
          listBrandCatalogOfferings(dna.offeringsPrimary, dna.offeringsCollections),
        );
      })
      .catch((err) => {
        setCatalogError(
          err instanceof Error ? err.message : "Could not load brand catalogue.",
        );
        setCatalog([]);
      })
      .finally(() => setCatalogLoading(false));
  }, [isOpen]);

  const linkedSet = useMemo(
    () => new Set(linkedProductNames.map((n) => n.trim().toLowerCase())),
    [linkedProductNames],
  );

  const availableCatalog = useMemo(
    () => catalog.filter((item) => !linkedSet.has(item.name.trim().toLowerCase())),
    [catalog, linkedSet],
  );

  const selected = availableCatalog.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (availableCatalog.length === 0) {
      setSelectedId("");
      return;
    }
    if (!availableCatalog.some((item) => item.id === selectedId)) {
      setSelectedId(availableCatalog[0]?.id ?? "");
    }
  }, [availableCatalog, selectedId]);

  const handleSubmit = async () => {
    setError(null);
    if (!selected) {
      setError("Select a product from your brand catalogue.");
      return;
    }
    const parsedInventory = Number.parseInt(inventoryCount, 10);
    if (!Number.isFinite(parsedInventory) || parsedInventory < 0) {
      setError("Inventory allocation must be zero or greater.");
      return;
    }
    try {
      const body = mapOfferingToCreateProductBody(selected);
      await onCreateProduct({ ...body, inventory_count: parsedInventory });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link product.");
    }
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Link product to campaign"
      subtitle={`Choose from onboarding catalogue for ${campaignName}`}
      width="680px"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={isSubmitting || catalogLoading || !selected}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? "Linking…" : "Link product"}
          </Button>
        </div>
      }
    >
      <div className="remix-drawer-content">
        <div className="remix-alert-banner">
          <Info size={20} className="text-primary" />
          <p style={{ margin: 0 }}>
            Products come from your Brand Centre catalogue (surface scan / onboarding
            offerings). Pick one to attach to this campaign.
          </p>
        </div>

        {catalogError ? <p className="uce-drawer-error">{catalogError}</p> : null}
        {error ? <p className="uce-drawer-error">{error}</p> : null}

        {catalogLoading ? (
          <p className="uce-link-asset-empty">Loading brand catalogue…</p>
        ) : availableCatalog.length === 0 ? (
          <div className="uce-link-asset-empty">
            <Package size={28} strokeWidth={1.5} />
            <p>
              {catalog.length === 0
                ? "No offerings in Brand Centre yet. Complete onboarding or add products in Brand DNA."
                : "All catalogue products are already linked to this campaign."}
            </p>
          </div>
        ) : (
          <>
            <label className="uce-field-label uce-field-label--block" htmlFor="uce-catalog-select">
              Brand catalogue product
            </label>
            <select
              id="uce-catalog-select"
              className="aurora-select uce-catalog-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {availableCatalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.type ? ` (${item.type})` : ""}
                </option>
              ))}
            </select>

            {selected ? (
              <div className="uce-link-asset-ready">
                <div className="uce-link-asset-thumb">
                  {selected.imageUrl ? (
                    <img src={selected.imageUrl} alt="" />
                  ) : (
                    <Package size={28} />
                  )}
                </div>
                <div>
                  <strong>{selected.name}</strong>
                  <span>{displayField(selected.type)}</span>
                  {selected.description ? (
                    <p className="uce-link-asset-desc">{selected.description}</p>
                  ) : null}
                  {selected.url ? (
                    <p className="uce-link-asset-url">{selected.url}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <label className="uce-field-label uce-field-label--block" htmlFor="uce-link-inventory">
              Inventory allocation (units for creator samples)
            </label>
            <input
              id="uce-link-inventory"
              className="aurora-field__control"
              inputMode="numeric"
              value={inventoryCount}
              onChange={(e) => setInventoryCount(e.target.value)}
            />
          </>
        )}
      </div>
    </SideDrawer>
  );
}
