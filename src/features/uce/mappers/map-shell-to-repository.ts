import type { CampaignShellResponse, CanonicalCampaignPage } from "../contracts/brand-uce.contracts";
import type { RepositoryBrief, RepositoryProduct } from "../types/repository";
import { displayField } from "../utils/display-field";
import { formatCurrency } from "../utils/uce-format";

export function mapShellToRepositoryProducts(
  shell: CampaignShellResponse,
  page?: CanonicalCampaignPage,
): RepositoryProduct[] {
  return shell.zone_2_tactics.products.map((p, index) => ({
    id: p.product_id,
    canonicalAssetId:
      page?.productsBriefsSummary.products.find((asset) => asset.name === p.product_name)
        ?.campaignAssetId ?? page?.productsBriefsSummary.products[index]?.campaignAssetId,
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
  page?: CanonicalCampaignPage,
): RepositoryBrief[] {
  const canonicalBriefs = page?.productsBriefsSummary.products.flatMap((asset) =>
    asset.briefs.map((brief) => ({ ...brief, campaignAssetId: asset.campaignAssetId })),
  ) ?? [];
  return shell.zone_2_tactics.briefs.map((b, index) => ({
    id: b.brief_id,
    canonicalBriefId:
      canonicalBriefs.find((brief) => brief.name === b.internal_title)?.briefId ?? canonicalBriefs[index]?.briefId,
    canonicalAssetId:
      canonicalBriefs.find((brief) => brief.name === b.internal_title)?.campaignAssetId ?? canonicalBriefs[index]?.campaignAssetId,
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
