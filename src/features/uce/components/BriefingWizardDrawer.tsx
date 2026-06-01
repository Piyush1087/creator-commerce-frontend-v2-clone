import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart2,
  ChevronDown,
  DollarSign,
  FileText,
  Globe,
  Lock,
  Package,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";
import { Card } from "../../../design-system/aurora/components/Card";
import { TextField } from "../../../design-system/aurora/components/TextField";
import { SelectionCard } from "../../../design-system/aurora/components/SelectionCard";
import {
  getCampaignProduct,
  PRODUCT_CATALOG,
  type CampaignProduct,
} from "../mock-data/campaign-products";
import "./BriefingWizardDrawer.css";
import "./UCE_Remix.css";

type BriefingWizardDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignName?: string;
  initialProductId?: string | null;
  onBriefCreated?: (catalogProductId: string, briefName: string) => void;
  /** When set, parent-product dropdown only lists these catalogue IDs (campaign-linked SKUs) */
  linkedProductIds?: string[];
};

export function BriefingWizardDrawer({
  isOpen,
  onClose,
  campaignName = "Spring Glow 2024",
  initialProductId = null,
  onBriefCreated,
  linkedProductIds,
}: BriefingWizardDrawerProps) {
  const [step, setStep] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [briefName, setBriefName] = useState("");

  const productOptions = linkedProductIds?.length
    ? PRODUCT_CATALOG.filter((p) => linkedProductIds.includes(p.id))
    : PRODUCT_CATALOG;

  const selectedProduct = getCampaignProduct(selectedProductId);
  const hasProduct = Boolean(selectedProduct);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedProductId(initialProductId ?? "");
      setBriefName("");
    }
  }, [isOpen, initialProductId]);

  const handleFinalize = () => {
    if (selectedProductId && onBriefCreated) {
      const name =
        briefName.trim() ||
        `Strategic Brief — ${selectedProduct?.name ?? "Product"}`;
      onBriefCreated(selectedProductId, name);
    }
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  const canAdvance = hasProduct;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 1 ? "Brief Strategy" : step === 2 ? "Creative Strategy" : "Commercial Review"}
      subtitle={
        selectedProduct
          ? `${campaignName} • ${selectedProduct.name} • Step ${step} of 3`
          : `${campaignName} • Step ${step} of 3`
      }
      width="920px"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Button variant="ghost" onClick={handleClose}>
            Discard Draft
          </Button>
          <div style={{ display: "flex", gap: 12 }}>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button
              variant="primary"
              disabled={step < 3 && !canAdvance}
              onClick={() => (step < 3 ? setStep(step + 1) : handleFinalize())}
            >
              {step === 3 ? "Finalize & Dispatch Brief" : "Build Creative Strategy"}
              {step < 3 && <ArrowRight size={18} />}
            </Button>
          </div>
        </div>
      }
    >
      <div className="uce-brief-wizard-layout">
        <div className="uce-brief-product-picker">
          <label htmlFor="uce-brief-parent-product">Parent Product Portfolio</label>
          <div className="uce-brief-product-select-wrap">
            <select
              id="uce-brief-parent-product"
              className="uce-brief-product-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">Select product to attach this brief…</option>
              {productOptions.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="uce-brief-product-select-chevron" />
          </div>
        </div>

        <div className="uce-brief-wizard-grid">
          <div className="uce-brief-wizard-main">
            {!hasProduct && step === 1 && (
              <p className="uce-brief-wizard-disabled-hint">
                Select a parent product above to hydrate brief fields and unlock the strategy
                builder for that SKU.
              </p>
            )}

            <div className="brief-step-indicator">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`dot-step ${step >= i ? "active" : ""}`} />
              ))}
            </div>

            {step === 1 && (
              <Step1Strategy
                product={selectedProduct}
                disabled={!hasProduct}
                briefName={briefName}
                onBriefNameChange={setBriefName}
              />
            )}
            {step === 2 && <Step2Creative product={selectedProduct} />}
            {step === 3 && <Step3Commercials product={selectedProduct} />}
          </div>

          <BriefLivePreview
            campaignName={campaignName}
            product={selectedProduct}
          />
        </div>
      </div>
    </SideDrawer>
  );
}

function BriefLivePreview({
  campaignName,
  product,
}: {
  campaignName: string;
  product?: CampaignProduct;
}) {
  return (
    <aside className="uce-brief-preview-panel">
      <h4>
        <BarChart2 size={16} />
        Live context preview
      </h4>
      <div className="uce-brief-preview-card">
        <div className="uce-brief-preview-meta">
          <p>Campaign name</p>
          <strong>{campaignName}</strong>
        </div>
        <div className="uce-brief-preview-meta">
          <p>Objective target</p>
          <strong>Driving high-volume brand recognition for Q2 launch</strong>
        </div>
        <div>
          <p className="uce-field-label uce-field-label--block" style={{ marginBottom: 8 }}>
            KPI focus
          </p>
          <div className="uce-brief-preview-kpis">
            <span className="uce-brief-preview-kpi">Reach</span>
            <span className="uce-brief-preview-kpi">Impressions</span>
          </div>
        </div>

        <div className="uce-brief-preview-meta" style={{ paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
          <p>Linked product</p>
          {product ? (
            <>
              <div className="uce-brief-preview-product-head" style={{ marginTop: 8 }}>
                <div className="uce-brief-preview-product-icon">
                  <Package size={20} />
                </div>
                <div>
                  <strong>{product.name}</strong>
                  <span>SKU: {product.sku}</span>
                </div>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 12, color: "#64748b" }}>
                Base price: {product.basePrice} • {product.briefCount} brief
                {product.briefCount === 1 ? "" : "s"} allocated
              </p>
              <ul className="uce-brief-preview-usps" style={{ marginTop: 12 }}>
                {product.usps.map((usp) => (
                  <li key={usp}>{usp}</li>
                ))}
              </ul>
              <p style={{ margin: "12px 0 0", fontSize: 12, color: "#64748b" }}>
                {product.shipping} • {product.stockStatus}
              </p>
            </>
          ) : (
            <p className="uce-brief-preview-empty" style={{ padding: "12px 0 0", margin: 0 }}>
              Choose a product from the dropdown to preview SKU, USPs, and logistics context.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

function Step1Strategy({
  product,
  disabled,
  briefName,
  onBriefNameChange,
}: {
  product?: CampaignProduct;
  disabled: boolean;
  briefName: string;
  onBriefNameChange: (value: string) => void;
}) {
  const briefPlaceholder = product
    ? `e.g. The Science of ${product.name.split(" ")[0]}; GRWM; Unboxing`
    : "e.g. Summer Skin Routine — 30s Reel";

  return (
    <div
      className="remix-drawer-content"
      style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}
    >
      <div className="remix-field-group">
        <label className="remix-label">Operational Brief Name</label>
        <input
          className="uce-brief-name-input"
          value={briefName}
          onChange={(e) => onBriefNameChange(e.target.value)}
          placeholder={briefPlaceholder}
          disabled={disabled}
        />
      </div>

      <div className="remix-field-group">
        <label className="remix-label">Target Influencer Archetype</label>
        <div className="uce-selection-grid-3">
          <SelectionCard title="Aesthetic" icon={<Sparkles size={16} />} selected />
          <SelectionCard title="Educational" icon={<FileText size={16} />} />
          <SelectionCard title="Comedy" icon={<Zap size={16} />} />
        </div>
      </div>

      {product && (
        <div className="remix-field-group">
          <label className="remix-label">Product context (from portfolio)</label>
          <Card className="remix-card-hd" compact>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{product.tagline}</p>
          </Card>
        </div>
      )}

      <div className="remix-field-group">
        <label className="remix-label">Content Deliverables</label>
        <Card className="remix-card-hd" compact>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Video size={18} color="#0f172a" />
              <strong style={{ fontSize: 14 }}>1x Instagram Reel</strong>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#059669" }}>90s MAX</span>
          </div>
        </Card>
        <Button variant="outline" style={{ borderStyle: "dashed" }}>
          + Add Deliverable
        </Button>
      </div>

      <div className="remix-field-group">
        <label className="remix-label">Mandatory Creator Requirements</label>
        <textarea
          placeholder={
            product
              ? `Mention ${product.name} within the first 3 seconds. Highlight: ${product.usps[0]}`
              : "List any non-negotiable mentions or visual cues..."
          }
          style={{
            width: "100%",
            minHeight: 120,
            padding: 16,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            outline: "none",
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
}

function Step2Creative({ product }: { product?: CampaignProduct }) {
  return (
    <div className="remix-drawer-content">
      <section className="remix-field-group">
        <label className="remix-label">Visual &amp; Lighting Specs</label>
        <div className="uce-selection-grid-2">
          <SelectionCard title="Natural Daylight" icon={<Globe size={16} />} selected />
          <SelectionCard title="Studio Lighting" icon={<Zap size={16} />} />
        </div>
      </section>

      <section className="remix-field-group">
        <label className="remix-label">Primary Hook Idea</label>
        <TextField
          label="Hook Narrative"
          placeholder={
            product
              ? `e.g. The ${product.name.toLowerCase()} routine you actually need...`
              : "e.g. The skin routine you actually need for summer..."
          }
        />
      </section>

      <section className="remix-field-group">
        <label className="remix-label">Social Metadata</label>
        <div
          style={{
            padding: 20,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
          }}
        >
          <code style={{ fontSize: 13, color: "#0f172a" }}>
            #skincaretips #springglow{" "}
            {product ? `#${product.sku.toLowerCase().replace(/-/g, "")}` : "#aurorabeauty"}
          </code>
        </div>
      </section>
    </div>
  );
}

function Step3Commercials({ product }: { product?: CampaignProduct }) {
  const budgetLabel = product?.basePrice ?? "$45.00";

  return (
    <div className="remix-drawer-content">
      <section className="remix-field-group">
        <label className="remix-label">Compensation Framework</label>
        <div className="uce-selection-grid-2">
          <SelectionCard title="Fixed Fee" icon={<DollarSign size={16} />} selected />
          <SelectionCard title="Negotiable" icon={<FileText size={16} />} />
        </div>
      </section>

      <section style={{ padding: 32, background: "#0f172a", borderRadius: 16, color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#34d399" }}>
            ESTIMATED BUDGET POOL
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#34d399" }}>MIN. ADVANCE</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 12,
          }}
        >
          <strong style={{ fontSize: 40 }}>$15,000</strong>
          <strong style={{ fontSize: 24 }}>30% ($4,500)</strong>
        </div>
        {product && (
          <p style={{ margin: "16px 0 0", fontSize: 12, color: "#94a3b8" }}>
            Anchored to {product.name} retail ({budgetLabel})
          </p>
        )}
      </section>

      <section className="remix-field-group">
        <label className="remix-label">Legal Compliance</label>
        <Card className="remix-card-hd" compact>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Lock size={16} className="text-primary" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Brand safety path active</span>
          </div>
        </Card>
      </section>
    </div>
  );
}
