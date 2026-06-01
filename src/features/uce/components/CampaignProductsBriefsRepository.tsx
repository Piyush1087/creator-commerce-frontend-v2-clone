import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Package,
  Plus,
} from "lucide-react";
import type { EnrichedCampaignProduct } from "../mock-data/campaign-workspace";
import type { CampaignBrief } from "../mock-data/campaign-workspace";

type CampaignProductsBriefsRepositoryProps = {
  products: EnrichedCampaignProduct[];
  onAddProduct: () => void;
  onViewProduct: (productId: string) => void;
  onViewBrief: (brief: CampaignBrief) => void;
  onCreateBrief: (productId: string) => void;
  onToggleProductActive: (productId: string, isActive: boolean) => void;
};

export function CampaignProductsBriefsRepository({
  products,
  onAddProduct,
  onViewProduct,
  onViewBrief,
  onCreateBrief,
  onToggleProductActive,
}: CampaignProductsBriefsRepositoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const totalBriefs = products.reduce((n, p) => n + p.briefs.length, 0);

  return (
    <section className="uce-repo glass-card">
      <header className="uce-repo-header">
        <div className="uce-repo-header-left">
          <h2>Products &amp; Briefs Repository</h2>
          <span className="uce-repo-pill uce-repo-pill--desktop">
            {products.length} Product{products.length === 1 ? "" : "s"} | {totalBriefs}{" "}
            Strategic Brief{totalBriefs === 1 ? "" : "s"}
          </span>
        </div>
        <div className="uce-repo-header-actions">
          <button
            type="button"
            className="uce-repo-add-btn uce-repo-add-btn--header"
            onClick={onAddProduct}
          >
            <Plus size={18} />
            Add New Product Portfolio
          </button>
          <button
            type="button"
            className="uce-repo-chevron-btn"
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? "Collapse repository" : "Expand repository"}
          >
            {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
          </button>
        </div>
      </header>

      {isExpanded && (
        <div className="uce-repo-body">
          {products.length === 0 ? (
            <div className="uce-repo-empty">
              <Package size={32} strokeWidth={1.5} />
              <p>No products linked to this campaign yet.</p>
              <button type="button" className="uce-repo-add-btn" onClick={onAddProduct}>
                <Plus size={18} />
                Link your first product
              </button>
            </div>
          ) : (
            <>
              {products.map((product) => (
                <ProductBlock
                  key={product.id}
                  product={product}
                  onViewProduct={onViewProduct}
                  onViewBrief={onViewBrief}
                  onCreateBrief={onCreateBrief}
                  onToggleProductActive={onToggleProductActive}
                />
              ))}
              <button
                type="button"
                className="uce-repo-dashed-add"
                onClick={onAddProduct}
              >
                <Plus size={20} />
                Add New Product Portfolio to Campaign Execution Matrix
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function ProductBlock({
  product,
  onViewProduct,
  onViewBrief,
  onCreateBrief,
  onToggleProductActive,
}: {
  product: EnrichedCampaignProduct;
  onViewProduct: (productId: string) => void;
  onViewBrief: (brief: CampaignBrief) => void;
  onCreateBrief: (productId: string) => void;
  onToggleProductActive: (productId: string, isActive: boolean) => void;
}) {
  const [briefActive, setBriefActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(product.briefs.map((b) => [b.id, true])),
  );

  const productInitials = product.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`uce-product-block ${product.isActive ? "is-active" : ""}`}>
      <div className="uce-product-row">
        <div className="uce-product-row-main">
          <div className="uce-product-thumb" aria-hidden="true">
            {productInitials}
          </div>
          <div>
            <h3>{product.name}</h3>
            <p>
              Base Price: {product.basePrice} •{" "}
              <span className="uce-brief-count">
                {product.briefs.length} Brief{product.briefs.length === 1 ? "" : "s"} Allocated
              </span>
            </p>
          </div>
        </div>
        <div className="uce-product-row-actions">
          <label className="uce-active-toggle uce-active-toggle--sm">
            <input
              type="checkbox"
              checked={product.isActive}
              onChange={(e) => onToggleProductActive(product.id, e.target.checked)}
            />
            <span className="uce-active-toggle-track" />
          </label>
          <button
            type="button"
            className="uce-text-action-btn"
            onClick={() => onViewProduct(product.id)}
          >
            <Eye size={16} />
            View Product
          </button>
        </div>
      </div>

      <div className={`uce-briefs-nested ${product.isActive ? "" : "is-dimmed"}`}>
        {!product.isActive && (
          <p className="uce-inactive-brief-label">
            Parent Product Inactive — Incoming Applications Locked
          </p>
        )}
        {product.briefs.length === 0 ? (
          <p className="uce-no-briefs-hint">No briefs yet — create one below.</p>
        ) : (
          product.briefs.map((brief) => (
            <div key={brief.id} className="uce-brief-item">
              <div className="uce-brief-item-main">
                <label className="uce-active-toggle uce-active-toggle--sm uce-brief-toggle">
                  <input
                    type="checkbox"
                    checked={briefActive[brief.id] ?? true}
                    disabled={!product.isActive}
                    onChange={(e) =>
                      setBriefActive((prev) => ({
                        ...prev,
                        [brief.id]: e.target.checked,
                      }))
                    }
                  />
                  <span className="uce-active-toggle-track" />
                </label>
                <div className="uce-brief-doc-icon">
                  <FileText size={18} />
                </div>
                <div>
                  <span className="uce-brief-title">{brief.name}</span>
                  <span className="uce-brief-format-pill">{brief.formatType}</span>
                </div>
              </div>
              <button
                type="button"
                className="uce-text-action-btn"
                onClick={() => onViewBrief(brief)}
              >
                <Eye size={16} />
                View Brief
              </button>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        className="uce-add-brief-btn"
        onClick={() => onCreateBrief(product.id)}
        disabled={!product.isActive}
      >
        <Plus size={18} />
        Create &amp; Add Strategic Brief to {product.name}
      </button>
    </div>
  );
}
