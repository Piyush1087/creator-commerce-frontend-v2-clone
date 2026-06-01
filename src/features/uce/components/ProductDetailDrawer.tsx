import { CheckCircle, XCircle } from "lucide-react";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";
import { getCampaignProduct } from "../mock-data/campaign-products";

type ProductDetailDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  productId?: string | null;
};

export function ProductDetailDrawer({
  isOpen,
  onClose,
  productId,
}: ProductDetailDrawerProps) {
  const product =
    getCampaignProduct(productId) ?? getCampaignProduct("hydration_boost_serum")!;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Product Portfolio Detail: ${product.name}`}
      width="400px"
      footer={
        <div className="uce-drawer-footer-stack">
          <Button variant="primary" className="uce-drawer-footer-full">
            Edit Product Attributes
          </Button>
          <Button variant="outline" className="uce-drawer-footer-full" onClick={onClose}>
            Close Detail Canvas
          </Button>
        </div>
      }
    >
      <div className="uce-product-detail">
        <div className="uce-product-detail-grid">
          <div className="uce-product-detail-stat">
            <p className="uce-field-label">Retail Price Mapping</p>
            <p className="uce-field-value">Base Price: {product.basePrice}</p>
          </div>
          <div className="uce-product-detail-stat">
            <p className="uce-field-label">Associated Briefs</p>
            <p className="uce-field-value">{product.briefCount} Active</p>
          </div>
        </div>

        <section>
          <p className="uce-field-label uce-field-label--block">Marketing Assets &amp; USPs</p>
          <ul className="uce-check-list">
            {product.usps.map((usp) => (
              <li key={usp}>
                <CheckCircle size={16} className="uce-check-icon" />
                {usp}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <p className="uce-field-label uce-field-label--block">
            Fulfillment &amp; Inventory Ledger
          </p>
          <div className="uce-ledger-box">
            <div className="uce-kv-row">
              <span>Warehouse Status:</span>
              <strong className="uce-kv-row--success">{product.stockStatus}</strong>
            </div>
            <div className="uce-kv-row">
              <span>Shipping:</span>
              <strong>{product.shipping}</strong>
            </div>
            <div className="uce-kv-row">
              <span>SKU:</span>
              <strong>{product.sku}</strong>
            </div>
          </div>
        </section>

        <div className="uce-guidance-box uce-guidance-box--ok">
          <CheckCircle size={18} />
          <span>
            Present {product.name} clearly within the opening 3 seconds of content.
          </span>
        </div>
        <div className="uce-guidance-box uce-guidance-box--bad">
          <XCircle size={18} />
          <span>
            Do not mismatch SKU {product.sku} tracking variants or display damaged packaging.
          </span>
        </div>
      </div>
    </SideDrawer>
  );
}
