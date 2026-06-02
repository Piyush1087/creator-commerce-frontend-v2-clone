import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";
import { TextField } from "../../../design-system/aurora/components/TextField";
import type { CreateCampaignProductBody } from "../contracts/brand-uce.contracts";
import "./UCE_Remix.css";
import "./BriefingWizardDrawer.css";

type LinkAssetDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  onCreateProduct: (body: CreateCampaignProductBody) => Promise<void>;
  isSubmitting?: boolean;
};

export function LinkAssetDrawer({
  isOpen,
  onClose,
  campaignName,
  onCreateProduct,
  isSubmitting = false,
}: LinkAssetDrawerProps) {
  const [skuCode, setSkuCode] = useState("");
  const [productName, setProductName] = useState("");
  const [inventoryCount, setInventoryCount] = useState("0");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSkuCode("");
      setProductName("");
      setInventoryCount("0");
      setCostPerUnit("");
      setImageUrl("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError(null);
    const inventory = Number.parseInt(inventoryCount, 10);
    const cost = Number.parseFloat(costPerUnit);
    if (!skuCode.trim() || !productName.trim()) {
      setError("SKU and product name are required.");
      return;
    }
    if (!Number.isFinite(cost) || cost < 0.01) {
      setError("Cost per unit must be at least 0.01.");
      return;
    }
    try {
      await onCreateProduct({
        sku_code: skuCode.trim(),
        product_name: productName.trim(),
        inventory_count: Number.isFinite(inventory) && inventory >= 0 ? inventory : 0,
        cost_per_unit: cost,
        image_url: imageUrl.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create product.");
    }
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Add product to campaign"
      subtitle={`Create a campaign SKU for ${campaignName}`}
      width="680px"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" disabled={isSubmitting} onClick={() => void handleSubmit()}>
            {isSubmitting ? "Saving…" : "Create product"}
          </Button>
        </div>
      }
    >
      <div className="remix-drawer-content">
        <div className="remix-alert-banner">
          <Info size={20} className="text-primary" />
          <p style={{ margin: 0 }}>
            There is no brand-wide product catalogue API yet. Products are created per campaign
            via POST /campaigns/:id/products.
          </p>
        </div>

        {error ? <p className="uce-drawer-error">{error}</p> : null}

        <TextField
          label="SKU code"
          value={skuCode}
          onChange={(e) => setSkuCode(e.target.value)}
        />
        <TextField
          label="Product name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
        <TextField
          label="Inventory count"
          type="number"
          value={inventoryCount}
          onChange={(e) => setInventoryCount(e.target.value)}
        />
        <TextField
          label="Cost per unit (USD)"
          type="number"
          value={costPerUnit}
          onChange={(e) => setCostPerUnit(e.target.value)}
        />
        <TextField
          label="Image URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </div>
    </SideDrawer>
  );
}
