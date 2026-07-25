import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Package,
  Plus,
} from "lucide-react";
import type { RepositoryBrief, RepositoryProduct } from "../types/repository";

type CampaignProductsBriefsRepositoryProps = {
  products: RepositoryProduct[];
  briefs: RepositoryBrief[];
  onAddProduct: () => void;
  onViewProduct: (productId: string) => void;
  onViewBrief: (brief: RepositoryBrief) => void;
  onCreateBrief: (productId: string) => void;
};

export function CampaignProductsBriefsRepository({
  products,
  briefs,
  onAddProduct,
  onViewProduct,
  onViewBrief,
  onCreateBrief,
}: CampaignProductsBriefsRepositoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className="uce-repo glass-card">
      <header className="uce-repo-header">
        <div className="uce-repo-header-left">
          <h2>Products &amp; Briefs Repository</h2>
          <span className="uce-repo-pill uce-repo-pill--desktop">
            {products.length} Product{products.length === 1 ? "" : "s"} | {briefs.length}{" "}
            Strategic Brief{briefs.length === 1 ? "" : "s"}
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
                  briefs={briefs.filter((b) => b.productId === product.id)}
                  onViewProduct={onViewProduct}
                  onViewBrief={onViewBrief}
                  onCreateBrief={onCreateBrief}
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

          {briefs.some((b) => !b.productId) ? (
            <section className="uce-repo-campaign-briefs">
              <h3 className="uce-repo-campaign-briefs-title">Unlinked campaign briefs</h3>
              <p className="uce-repo-campaign-briefs-note">
                Legacy briefs without a parent product link.
              </p>
              {briefs
                .filter((b) => !b.productId)
                .map((brief) => (
                  <BriefRow
                    key={brief.id}
                    brief={brief}
                    onViewBrief={onViewBrief}
                  />
                ))}
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}

function ProductBlock({
  product,
  briefs,
  onViewProduct,
  onViewBrief,
  onCreateBrief,
}: {
  product: RepositoryProduct;
  briefs: RepositoryBrief[];
  onViewProduct: (productId: string) => void;
  onViewBrief: (brief: RepositoryBrief) => void;
  onCreateBrief: (productId: string) => void;
}) {
  const productInitials = product.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`uce-product-block ${product.outOfStock ? "" : "is-active"}`}>
      <div className="uce-product-row">
        <div className="uce-product-row-main">
          <div className="uce-product-thumb" aria-hidden="true">
            {productInitials}
          </div>
          <div>
            <h3>{product.name}</h3>
            <p>
              {product.skuCode ? `SKU: ${product.skuCode} • ` : ""}
              Base Price: {product.basePrice} • Inventory: {product.inventoryCount}
              {product.outOfStock ? " (out of stock)" : ""}
              {briefs.length > 0
                ? ` • ${briefs.length} Brief${briefs.length === 1 ? "" : "s"} Allocated`
                : ""}
            </p>
          </div>
        </div>
        <div className="uce-product-row-actions">
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

      {briefs.map((brief) => (
        <BriefRow key={brief.id} brief={brief} onViewBrief={onViewBrief} nested />
      ))}

      <button
        type="button"
        className="uce-add-brief-btn"
        onClick={() => onCreateBrief(product.id)}
      >
        <Plus size={18} />
        Create &amp; Add Strategic Brief to {product.name}
      </button>
    </div>
  );
}

function BriefRow({
  brief,
  onViewBrief,
  nested = false,
}: {
  brief: RepositoryBrief;
  onViewBrief: (brief: RepositoryBrief) => void;
  nested?: boolean;
}) {
  return (
    <div className={`uce-brief-item${nested ? " uce-brief-item--nested" : ""}`}>
      <div className="uce-brief-item-main">
        <div className="uce-brief-doc-icon">
          <FileText size={18} />
        </div>
        <div>
          <span className="uce-brief-title">{brief.name}</span>
          <span className="uce-brief-format-pill">{brief.formatType}</span>
          {brief.briefType ? (
            <span className="uce-brief-format-pill">{brief.briefType}</span>
          ) : null}
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
  );
}
