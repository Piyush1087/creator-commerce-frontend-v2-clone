import { useEffect, useState } from "react";

import { Button } from "../../../design-system/aurora/components/Button";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import type {
  CampaignShellProduct,
  CampaignShellResponse,
} from "../contracts/brand-uce.contracts";

type CampaignHeroEditDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  shell: CampaignShellResponse;
  isSubmitting?: boolean;
  onSubmit: (body: {
    campaign_name: string;
    budget_pool: number;
    product_inventories: Array<{ product_id: string; inventory_count: number }>;
  }) => Promise<void>;
};

export function CampaignHeroEditDrawer({
  isOpen,
  onClose,
  shell,
  isSubmitting = false,
  onSubmit,
}: CampaignHeroEditDrawerProps) {
  const products = shell.zone_2_tactics.products;

  const [campaignName, setCampaignName] = useState(shell.campaign_name);
  const [budgetPool, setBudgetPool] = useState(
    String(shell.zone_1_master?.budget_pool ?? ""),
  );
  const [inventories, setInventories] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCampaignName(shell.campaign_name);
    setBudgetPool(String(shell.zone_1_master?.budget_pool ?? ""));
    setInventories(
      Object.fromEntries(
        products.map((product) => [product.product_id, String(product.inventory_count)]),
      ),
    );
    setError(null);
  }, [isOpen, shell, products]);

  const handleSubmit = async () => {
    setError(null);
    const trimmedName = campaignName.trim();
    if (trimmedName.length < 3) {
      setError("Campaign name must be at least 3 characters.");
      return;
    }

    const parsedBudget = Number.parseFloat(budgetPool.replace(/,/g, ""));
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      setError("Budget pool must be a positive number.");
      return;
    }

    const productInventories: Array<{ product_id: string; inventory_count: number }> = [];
    for (const product of products) {
      const raw = inventories[product.product_id] ?? "0";
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError(`Inventory for ${product.product_name} must be zero or greater.`);
        return;
      }
      productInventories.push({
        product_id: product.product_id,
        inventory_count: parsed,
      });
    }

    try {
      await onSubmit({
        campaign_name: trimmedName,
        budget_pool: parsedBudget,
        product_inventories: productInventories,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    }
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit campaign essentials"
      subtitle="Name, escrow budget pool, and product inventory allocation"
      width="560px"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" disabled={isSubmitting} onClick={() => void handleSubmit()}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      }
    >
      <div className="uce-hero-edit">
        {error ? <p className="uce-drawer-error">{error}</p> : null}

        <label className="uce-field-label uce-field-label--block" htmlFor="uce-hero-edit-name">
          Campaign name
        </label>
        <input
          id="uce-hero-edit-name"
          className="aurora-field__control"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
        />

        <label className="uce-field-label uce-field-label--block" htmlFor="uce-hero-edit-budget">
          Budget pool (escrow allocation limit)
        </label>
        <input
          id="uce-hero-edit-budget"
          className="aurora-field__control"
          inputMode="decimal"
          value={budgetPool}
          onChange={(e) => setBudgetPool(e.target.value)}
        />

        <p className="uce-field-label uce-field-label--section">Product inventory allocation</p>
        {products.length === 0 ? (
          <p className="uce-muted-inline">No products linked yet. Link a product first.</p>
        ) : (
          products.map((product) => (
            <ProductInventoryField
              key={product.product_id}
              product={product}
              value={inventories[product.product_id] ?? "0"}
              onChange={(next) =>
                setInventories((prev) => ({ ...prev, [product.product_id]: next }))
              }
            />
          ))
        )}
      </div>
    </SideDrawer>
  );
}

function ProductInventoryField({
  product,
  value,
  onChange,
}: {
  product: CampaignShellProduct;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="uce-hero-edit-product">
      <div>
        <strong>{product.product_name}</strong>
        <p className="uce-muted-inline">SKU: {product.sku_code}</p>
      </div>
      <label className="uce-field-label" htmlFor={`inv-${product.product_id}`}>
        Units
        <input
          id={`inv-${product.product_id}`}
          className="aurora-field__control uce-hero-edit-inventory-input"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
