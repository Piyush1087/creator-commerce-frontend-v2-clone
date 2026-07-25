import type { CampaignShellResponse } from "../contracts/brand-uce.contracts";
import type { RepositoryBrief, RepositoryProduct } from "../types/repository";
import { displayField } from "../utils/display-field";
import { formatCurrency } from "../utils/uce-format";

export function mapShellToRepositoryProducts(
  shell: CampaignShellResponse,
): RepositoryProduct[] {
  return shell.zone_2_tactics.products.map((p) => ({
    id: p.product_id,
    name: p.product_name,
    skuCode: p.sku_code,
    assetType: p.asset_type,
    basePrice: formatCurrency(p.cost_per_unit, { cents: true }),
    inventoryCount: p.inventory_count,
    outOfStock: p.out_of_stock,
  }));
}

export function mapShellToRepositoryBriefs(
  shell: CampaignShellResponse,
): RepositoryBrief[] {
  return shell.zone_2_tactics.briefs.map((b) => ({
    id: b.brief_id,
    productId: b.product_id ?? null,
    name: b.internal_title,
    formatType: displayField(b.deliverable_format_tags[0]),
    formatTags: b.deliverable_format_tags,
    platforms: b.required_platforms,
    platformsLabel:
      b.required_platforms.length > 0
        ? b.required_platforms.join(", ")
        : displayField(null),
    creativeGuidelines: b.creative_guidelines?.trim() ?? "",
    briefType: b.brief_type ?? null,
    createdAt: b.created_at ?? null,
  }));
}
