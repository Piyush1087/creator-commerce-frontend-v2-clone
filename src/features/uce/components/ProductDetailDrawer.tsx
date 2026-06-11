import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";
import type { RepositoryProduct } from "../types/repository";
import { displayField, EMPTY_FIELD } from "../utils/display-field";

type ProductDetailDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  product: RepositoryProduct | null;
};

export function ProductDetailDrawer({
  isOpen,
  onClose,
  product,
}: ProductDetailDrawerProps) {
  const title = product
    ? `Product Portfolio Detail: ${product.name}`
    : `Product Portfolio Detail: ${EMPTY_FIELD}`;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="400px"
      footer={
        <div className="uce-drawer-footer-stack">
          <Button variant="primary" className="uce-drawer-footer-full" disabled>
            Edit Product Attributes ({EMPTY_FIELD} PATCH wired in UI)
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
            <p className="uce-field-label">SKU</p>
            <p className="uce-field-value">{displayField(product?.skuCode)}</p>
          </div>
          <div className="uce-product-detail-stat">
            <p className="uce-field-label">Cost per unit</p>
            <p className="uce-field-value">{displayField(product?.basePrice)}</p>
          </div>
          <div className="uce-product-detail-stat">
            <p className="uce-field-label">Inventory</p>
            <p className="uce-field-value">
              {product != null ? String(product.inventoryCount) : EMPTY_FIELD}
            </p>
          </div>
          <div className="uce-product-detail-stat">
            <p className="uce-field-label">Out of stock</p>
            <p className="uce-field-value">
              {product != null ? (product.outOfStock ? "Yes" : "No") : EMPTY_FIELD}
            </p>
          </div>
          <div className="uce-product-detail-stat">
            <p className="uce-field-label">Marketing USPs</p>
            <p className="uce-field-value">{EMPTY_FIELD}</p>
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
