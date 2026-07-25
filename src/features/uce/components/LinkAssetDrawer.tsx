import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Package, Search } from "lucide-react";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";
import { fetchBrandCentreDna } from "../../brand-centre/api/brand-centre-client";
import type { BrandCentreDnaResponse } from "../../brand-centre/contracts/brand-centre.contracts";
import type {
  CreateCampaignProductBody,
  UceCampaignAssetType,
} from "../contracts/brand-uce.contracts";
import {
  ASSET_TYPE_LABELS,
  availableAssetTypes,
  buildCreateAssetBody,
  listLinkableOptions,
  type LinkableAssetOption,
} from "../utils/map-dna-to-asset";
import "./LinkAssetDrawer.css";
import "./UCE_Remix.css";

type LinkAssetDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
  linkedProductNames: string[];
  onCreateProduct: (body: CreateCampaignProductBody) => Promise<void>;
  isSubmitting?: boolean;
};

export function LinkAssetDrawer({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  linkedProductNames,
  onCreateProduct,
  isSubmitting = false,
}: LinkAssetDrawerProps) {
  const [dna, setDna] = useState<BrandCentreDnaResponse | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<UceCampaignAssetType | "">("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [hydrating, setHydrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAssetType("");
    setQuery("");
    setSelectedId("");
    setError(null);
    setCatalogLoading(true);
    setCatalogError(null);
    void fetchBrandCentreDna()
      .then((payload) => setDna(payload))
      .catch((err) => {
        setCatalogError(
          err instanceof Error ? err.message : "Could not load brand catalogue.",
        );
        setDna(null);
      })
      .finally(() => setCatalogLoading(false));
  }, [isOpen]);

  const typeOptions = useMemo(
    () => (dna ? availableAssetTypes(dna) : []),
    [dna],
  );

  const linkedSet = useMemo(
    () => new Set(linkedProductNames.map((n) => n.trim().toLowerCase())),
    [linkedProductNames],
  );

  const options = useMemo(() => {
    if (!dna || !assetType) return [] as LinkableAssetOption[];
    return listLinkableOptions(dna, assetType).filter(
      (item) => !linkedSet.has(item.label.trim().toLowerCase()),
    );
  }, [dna, assetType, linkedSet]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q),
    );
  }, [options, query]);

  const selected = options.find((item) => item.id === selectedId) ?? null;

  const handleTypeChange = (value: string) => {
    const next = (value || "") as UceCampaignAssetType | "";
    setAssetType(next);
    setQuery("");
    setError(null);
    if (!next) {
      setSelectedId("");
      return;
    }
    setHydrating(true);
    if (next === "CORE_BRAND_IDENTITY" && dna) {
      setSelectedId(dna.profile.id);
    } else {
      setSelectedId("");
    }
    window.setTimeout(() => setHydrating(false), 320);
  };

  const handleSelectEntity = (id: string) => {
    setHydrating(true);
    setSelectedId(id);
    setError(null);
    window.setTimeout(() => setHydrating(false), 280);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!dna || !assetType || !selectedId) {
      setError("Select an asset classification and catalogue entity.");
      return;
    }
    try {
      const body = buildCreateAssetBody(dna, campaignId, assetType, selectedId);
      await onCreateProduct(body);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link asset.");
    }
  };

  const canSubmit = Boolean(dna && assetType && selectedId && !hydrating);

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Link Campaign Asset"
      subtitle="Target an authorized component, product line, or active marketing event."
      width="420px"
      footer={
        assetType && selected ? (
          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Discard
            </Button>
            <Button
              variant="primary"
              disabled={isSubmitting || !canSubmit}
              onClick={() => void handleSubmit()}
              style={{ flex: 1 }}
            >
              {isSubmitting ? "Linking…" : "Link to Pipeline"}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="remix-drawer-content">
        <nav className="uce-link-asset-crumbs" aria-label="Breadcrumb">
          <span>Campaigns</span>
          <span>›</span>
          <span>{campaignName}</span>
          <span>›</span>
          <span className="is-current">Link Asset</span>
        </nav>

        {catalogError ? <p className="uce-drawer-error">{catalogError}</p> : null}
        {error ? <p className="uce-drawer-error">{error}</p> : null}

        {catalogLoading ? (
          <p className="uce-link-asset-empty">Loading Brand Centre inventory…</p>
        ) : typeOptions.length === 0 ? (
          <div className="uce-link-asset-empty">
            <Package size={28} strokeWidth={1.5} />
            <p>
              No linkable Brand Centre assets yet. Add products, collections, or
              promotions in Brand DNA first.
            </p>
          </div>
        ) : (
          <>
            <div className="uce-link-asset-field">
              <label htmlFor="uce-asset-type">Target Asset Classification</label>
              <select
                id="uce-asset-type"
                className="uce-link-asset-select"
                value={assetType}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="">Select target asset type…</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {ASSET_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {!assetType ? null : hydrating ? (
              <div className="uce-link-asset-shimmer" aria-hidden>
                <div />
                <div />
              </div>
            ) : assetType === "CORE_BRAND_IDENTITY" && selected ? (
              <BrandIdentityPreview dna={dna!} />
            ) : (
              <>
                {assetType !== "CORE_BRAND_IDENTITY" ? (
                  <div className="uce-link-asset-field">
                    <label htmlFor="uce-asset-search">Search catalogue</label>
                    <div style={{ position: "relative" }}>
                      <Search
                        size={16}
                        style={{
                          position: "absolute",
                          left: 14,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                        }}
                      />
                      <input
                        id="uce-asset-search"
                        className="uce-link-asset-search"
                        style={{ paddingLeft: 40 }}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search available ${ASSET_TYPE_LABELS[assetType]}…`}
                      />
                    </div>
                  </div>
                ) : null}

                {options.length === 0 ? (
                  <div className="uce-link-asset-empty">
                    <p>All items of this type are already linked, or none exist.</p>
                  </div>
                ) : (
                  <div className="uce-link-asset-results">
                    {(assetType === "CORE_BRAND_IDENTITY" ? options : filtered).map(
                      (item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`uce-link-asset-result${selectedId === item.id ? " is-selected" : ""}`}
                          onClick={() => handleSelectEntity(item.id)}
                        >
                          <div className="uce-link-asset-result-thumb">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" />
                            ) : (
                              <Package size={18} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{item.label}</strong>
                            <span>{item.subtitle}</span>
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                )}

                {selected && assetType !== "CORE_BRAND_IDENTITY" ? (
                  <SelectedAssetPreview
                    assetType={assetType}
                    option={selected}
                    dna={dna!}
                  />
                ) : null}
              </>
            )}
          </>
        )}
      </div>
    </SideDrawer>
  );
}

function BrandIdentityPreview({ dna }: { dna: BrandCentreDnaResponse }) {
  return (
    <>
      <div className="uce-link-asset-ready">
        <CheckCircle2 size={22} color="#059669" />
        <div>
          <strong>{dna.profile.brandName}</strong>
          <span>Ready for pipeline linking</span>
        </div>
      </div>
      <details className="uce-link-asset-accordion" open>
        <summary>Brand Identity & Vision</summary>
        <div className="uce-link-asset-accordion-body">
          {dna.narrative.briefDescription ||
            dna.narrative.tagline ||
            "Brand mission synced from Brand Centre DNA."}
        </div>
      </details>
      <details className="uce-link-asset-accordion" open>
        <summary>Tone & Guardrails</summary>
        <div className="uce-link-asset-accordion-body">
          <p>
            Tone:{" "}
            {(dna.narrative.toneOfVoice.length
              ? dna.narrative.toneOfVoice
              : ["Authentic"]
            ).join(", ")}
          </p>
          {dna.narrative.doNotSayList.length > 0 ? (
            <ul>
              {dna.narrative.doNotSayList.slice(0, 5).map((token) => (
                <li key={token}>{token}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </details>
    </>
  );
}

function SelectedAssetPreview({
  assetType,
  option,
  dna,
}: {
  assetType: UceCampaignAssetType;
  option: LinkableAssetOption;
  dna: BrandCentreDnaResponse;
}) {
  const product = dna.offeringsPrimary.find((o) => o.id === option.id);
  const collection = dna.offeringsCollections.find((o) => o.id === option.id);
  const offer = dna.offers.find((o) => o.id === option.id);

  return (
    <>
      <div className="uce-link-asset-ready">
        <CheckCircle2 size={22} color="#059669" />
        <div>
          <strong>{option.label}</strong>
          <span>Ready for pipeline linking</span>
        </div>
      </div>

      {assetType === "INDIVIDUAL_PRODUCT_SKU" && product ? (
        <>
          <details className="uce-link-asset-accordion" open>
            <summary>Product Identity & USPs</summary>
            <div className="uce-link-asset-accordion-body">
              <p>{product.description || "No description on file."}</p>
              {product.sellingPoints.length > 0 ? (
                <ul>
                  {product.sellingPoints.slice(0, 3).map((usp) => (
                    <li key={usp}>{usp}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </details>
          <details className="uce-link-asset-accordion">
            <summary>Creative Compliance Guardrails</summary>
            <div className="uce-link-asset-accordion-body">
              {product.doNotSay.length > 0 ? (
                <ul>
                  {product.doNotSay.map((token) => (
                    <li key={token}>{token}</li>
                  ))}
                </ul>
              ) : (
                <p>No do-not-say tokens on this SKU.</p>
              )}
            </div>
          </details>
        </>
      ) : null}

      {assetType === "CURATED_COLLECTION_LINE" && collection ? (
        <details className="uce-link-asset-accordion" open>
          <summary>Collection Line Summary</summary>
          <div className="uce-link-asset-accordion-body">
            <p>{collection.description || "Collection synced from Brand Centre."}</p>
            <p style={{ marginTop: 8 }}>
              Linked catalogue SKUs: {dna.offeringsPrimary.length || 1}
            </p>
          </div>
        </details>
      ) : null}

      {assetType === "ACTIVE_SALE_PROMOTION" && offer ? (
        <>
          <details className="uce-link-asset-accordion" open>
            <summary>Promotion Scheme Ruleset</summary>
            <div className="uce-link-asset-accordion-body">
              <p>
                Code <strong>{offer.promoCode || "—"}</strong> · Scope{" "}
                {offer.applicabilityScope || "SITEWIDE"}
              </p>
              <p style={{ marginTop: 8 }}>
                {offer.validityStart} → {offer.validityEnd}
              </p>
              <p style={{ marginTop: 8 }}>
                {offer.description || "Promotional offer from Brand Centre."}
              </p>
            </div>
          </details>
        </>
      ) : null}
    </>
  );
}
