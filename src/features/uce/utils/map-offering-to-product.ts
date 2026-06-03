import type { BrandCentreOfferingRow } from "../../brand-centre/contracts/brand-centre.contracts";
import type { CreateCampaignProductBody } from "../contracts/brand-uce.contracts";

type OfferingWithPrice = BrandCentreOfferingRow & {
  priceAmount?: string | null;
  startingPriceLabel?: string | null;
};

function slugSku(name: string, id: string): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return slug.length > 0 ? slug : id.replace(/-/g, "").slice(0, 12).toUpperCase();
}

function parseCostPerUnit(offering: OfferingWithPrice): number {
  if (offering.priceAmount != null) {
    const parsed = Number.parseFloat(String(offering.priceAmount));
    if (Number.isFinite(parsed) && parsed >= 0.01) {
      return parsed;
    }
  }
  if (offering.startingPriceLabel) {
    const match = offering.startingPriceLabel.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const parsed = Number.parseFloat(match[1]);
      if (Number.isFinite(parsed) && parsed >= 0.01) {
        return parsed;
      }
    }
  }
  return 1;
}

export function mapOfferingToCreateProductBody(
  offering: OfferingWithPrice,
): CreateCampaignProductBody {
  return {
    sku_code: slugSku(offering.name, offering.id),
    product_name: offering.name,
    inventory_count: 0,
    cost_per_unit: parseCostPerUnit(offering),
    image_url: offering.imageUrl,
  };
}

export function listBrandCatalogOfferings(
  offeringsPrimary: BrandCentreOfferingRow[],
  offeringsCollections: BrandCentreOfferingRow[],
): OfferingWithPrice[] {
  return [...offeringsPrimary, ...offeringsCollections] as OfferingWithPrice[];
}
