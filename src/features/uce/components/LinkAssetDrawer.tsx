import { useEffect, useState } from "react";
import { CheckCircle, ChevronDown, Copy, Info, Link, Package } from "lucide-react";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";
import { Card } from "../../../design-system/aurora/components/Card";
import { Badge } from "../../../design-system/aurora/components/Badge";
import type { CampaignProduct } from "../mock-data/campaign-products";
import "./UCE_Remix.css";
import "./BriefingWizardDrawer.css";

type LinkAssetDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  campaignSlug: string;
  availableProducts: CampaignProduct[];
  onLinkProduct: (catalogProductId: string) => void;
};

export function LinkAssetDrawer({
  isOpen,
  onClose,
  campaignName,
  campaignSlug,
  availableProducts,
  onLinkProduct,
}: LinkAssetDrawerProps) {
  const [selectedId, setSelectedId] = useState("");
  const utmSource = "instagram_stories";

  const selected = availableProducts.find((p) => p.id === selectedId);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(availableProducts[0]?.id ?? "");
    }
  }, [isOpen, availableProducts]);

  const handleLink = () => {
    if (!selectedId) return;
    onLinkProduct(selectedId);
    onClose();
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Link Campaign Asset"
      subtitle={`Attach a product portfolio to ${campaignName}`}
      width="680px"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Button variant="ghost" onClick={onClose}>
            Discard Selection
          </Button>
          <Button variant="primary" disabled={!selectedId} onClick={handleLink}>
            Link to Campaign
          </Button>
        </div>
      }
    >
      <div className="remix-drawer-content">
        <div className="remix-alert-banner">
          <Info size={20} className="text-primary" />
          <p style={{ margin: 0 }}>
            <strong>Campaign scope:</strong> Products linked here appear in this campaign&apos;s
            repository. Each product can hold multiple strategic briefs.
          </p>
        </div>

        {availableProducts.length === 0 ? (
          <p className="uce-link-asset-empty">
            All catalogue products are already linked to this campaign.
          </p>
        ) : (
          <>
            <section className="remix-field-group">
              <label className="remix-label">Select product portfolio</label>
              <div className="uce-brief-product-select-wrap">
                <select
                  className="uce-brief-product-select"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  <option value="">Choose from brand catalogue…</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="uce-brief-product-select-chevron" />
              </div>
            </section>

            {selected && (
              <>
                <div className="uce-link-asset-ready">
                  <CheckCircle size={22} />
                  <div>
                    <strong>{selected.name}</strong>
                    <span>Ready to link • {selected.sku}</span>
                  </div>
                </div>

                <section className="remix-field-group">
                  <label className="remix-label">Product specifications</label>
                  <Card className="remix-card-hd" compact>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div className="uce-link-asset-thumb">
                        <Package size={28} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: 16 }}>{selected.name}</strong>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0" }}>
                          {selected.tagline}
                        </p>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
                          Base price: {selected.basePrice}
                        </p>
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <Badge tone="success">{selected.stockStatus}</Badge>
                          <Badge tone="neutral">{selected.shipping}</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </section>

                <section className="remix-field-group">
                  <label className="remix-label">Marketing USPs</label>
                  <ul className="uce-link-asset-usps">
                    {selected.usps.map((usp) => (
                      <li key={usp}>{usp}</li>
                    ))}
                  </ul>
                </section>

                <section className="remix-field-group">
                  <label className="remix-label">Share router preview</label>
                  <div
                    style={{
                      background: "#0f172a",
                      padding: 20,
                      borderRadius: 12,
                      color: "white",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <Link size={16} color="#34d399" />
                      <code style={{ fontSize: 12, color: "#94a3b8" }}>
                        app.creator.shop/c/{campaignSlug}?src={utmSource}
                      </code>
                    </div>
                    <Button
                      variant="outline"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        borderColor: "rgba(255,255,255,0.2)",
                        color: "white",
                        width: "100%",
                      }}
                    >
                      <Copy size={14} /> Copy share path
                    </Button>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </SideDrawer>
  );
}
