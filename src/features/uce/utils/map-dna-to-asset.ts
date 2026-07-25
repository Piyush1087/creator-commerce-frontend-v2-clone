import type {
  BrandCentreDnaResponse,
  BrandCentreOfferRow,
  BrandCentreOfferingRow,
} from "../../brand-centre/contracts/brand-centre.contracts";
import type {
  CreateCampaignProductBody,
  PromotionApplicability,
  UceCampaignAssetType,
} from "../contracts/brand-uce.contracts";

type OfferingWithPrice = BrandCentreOfferingRow & {
  priceAmount?: string | null;
  startingPriceLabel?: string | null;
};

export type LinkableAssetOption = {
  id: string;
  label: string;
  subtitle: string;
  imageUrl: string | null;
};

function ensureUrl(raw: string, fallbackHost: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("www.")) return `https://${trimmed}`;
  if (trimmed.length > 0) return `https://${trimmed}`;
  const host = fallbackHost.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return `https://${host || "example.com"}`;
}

function ensureDescription(text: string | null | undefined, name: string): string {
  const base = (text ?? "").trim() || `${name} linked from Brand Centre catalogue.`;
  return base.length >= 10 ? base : `${base} Campaign asset context.`;
}

function ensureUsps(points: string[], name: string): string[] {
  const cleaned = points.map((p) => p.trim()).filter((p) => p.length >= 2).slice(0, 3);
  if (cleaned.length > 0) return cleaned;
  return [name.slice(0, 48) || "Brand USP"];
}

function parsePrice(offering: OfferingWithPrice): number {
  if (offering.priceAmount != null) {
    const parsed = Number.parseFloat(String(offering.priceAmount));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (offering.startingPriceLabel) {
    const match = offering.startingPriceLabel.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const parsed = Number.parseFloat(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return 1;
}

function toIsoDateTime(value: string, endOfDay: boolean): string {
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T${endOfDay ? "23:59:59.000Z" : "00:00:00.000Z"}`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  const fallback = new Date();
  if (endOfDay) fallback.setUTCDate(fallback.getUTCDate() + 30);
  return fallback.toISOString();
}

function mapApplicability(scope: string): PromotionApplicability {
  const upper = scope.toUpperCase();
  if (upper.includes("COLLECTION")) return "SPECIFIC_COLLECTION";
  if (upper.includes("PRODUCT") || upper.includes("SKU")) return "SPECIFIC_PRODUCT";
  return "SITEWIDE";
}

export function listLinkableOptions(
  dna: BrandCentreDnaResponse,
  assetType: UceCampaignAssetType,
): LinkableAssetOption[] {
  switch (assetType) {
    case "INDIVIDUAL_PRODUCT_SKU":
      return dna.offeringsPrimary.map((o) => ({
        id: o.id,
        label: o.name,
        subtitle: o.type || "Product SKU",
        imageUrl: o.imageUrl,
      }));
    case "CURATED_COLLECTION_LINE":
      return dna.offeringsCollections.map((o) => ({
        id: o.id,
        label: o.name,
        subtitle: o.type || "Collection",
        imageUrl: o.imageUrl,
      }));
    case "CORE_BRAND_IDENTITY":
      return [
        {
          id: dna.profile.id,
          label: dna.profile.brandName,
          subtitle: "Core brand identity",
          imageUrl: dna.profile.logoUrl,
        },
      ];
    case "ACTIVE_SALE_PROMOTION":
      return dna.offers.map((o) => ({
        id: o.id,
        label: o.offerName,
        subtitle: o.promoCode ? `Code: ${o.promoCode}` : "Promotion",
        imageUrl: null,
      }));
    default:
      return [];
  }
}

export function availableAssetTypes(
  dna: BrandCentreDnaResponse,
): UceCampaignAssetType[] {
  const types: UceCampaignAssetType[] = [];
  if (dna.offeringsPrimary.length > 0) types.push("INDIVIDUAL_PRODUCT_SKU");
  if (dna.offeringsCollections.length > 0) types.push("CURATED_COLLECTION_LINE");
  if (dna.profile.id) types.push("CORE_BRAND_IDENTITY");
  if (dna.offers.length > 0) types.push("ACTIVE_SALE_PROMOTION");
  return types;
}

export function buildCreateAssetBody(
  dna: BrandCentreDnaResponse,
  campaignId: string,
  assetType: UceCampaignAssetType,
  entityId: string,
): CreateCampaignProductBody {
  const website = dna.profile.websiteUrl || "https://example.com";

  if (assetType === "INDIVIDUAL_PRODUCT_SKU") {
    const offering = dna.offeringsPrimary.find((o) => o.id === entityId);
    if (!offering) throw new Error("Selected product was not found in Brand Centre.");
    return {
      asset_type: "INDIVIDUAL_PRODUCT_SKU",
      campaign_id: campaignId,
      product_name: offering.name.trim(),
      price: parsePrice(offering as OfferingWithPrice),
      pdp_url: ensureUrl(offering.url, website),
      thumbnail_asset_url: offering.imageUrl && /^https?:\/\//i.test(offering.imageUrl)
        ? offering.imageUrl
        : null,
      brief_description: ensureDescription(offering.description, offering.name),
      unique_selling_points: ensureUsps(offering.sellingPoints, offering.name),
      compliance_do_not_say_tokens: offering.doNotSay ?? [],
      is_sync_locked: true,
    };
  }

  if (assetType === "CURATED_COLLECTION_LINE") {
    const collection = dna.offeringsCollections.find((o) => o.id === entityId);
    if (!collection) throw new Error("Selected collection was not found in Brand Centre.");
    const linked =
      dna.offeringsPrimary.length > 0
        ? dna.offeringsPrimary.map((p) => p.id)
        : [collection.id];
    return {
      asset_type: "CURATED_COLLECTION_LINE",
      campaign_id: campaignId,
      collection_name: collection.name.trim(),
      collection_pdp_url: ensureUrl(collection.url, website),
      collection_thumbnail_url:
        collection.imageUrl && /^https?:\/\//i.test(collection.imageUrl)
          ? collection.imageUrl
          : null,
      short_description: ensureDescription(collection.description, collection.name),
      collection_usps: ensureUsps(collection.sellingPoints, collection.name),
      linked_product_ids: linked,
    };
  }

  if (assetType === "CORE_BRAND_IDENTITY") {
    const mission =
      dna.narrative.briefDescription?.trim() ||
      dna.narrative.tagline?.trim() ||
      `${dna.profile.brandName} brand mission for creator activations.`;
    const tones =
      dna.narrative.toneOfVoice.length > 0
        ? dna.narrative.toneOfVoice
        : dna.identity.aesthetics.length > 0
          ? dna.identity.aesthetics
          : ["Authentic"];
    return {
      asset_type: "CORE_BRAND_IDENTITY",
      campaign_id: campaignId,
      brand_id: dna.profile.id,
      corporate_legal_name: dna.profile.brandName.trim(),
      brand_mission_statement: ensureDescription(mission, dna.profile.brandName),
      global_tone_adjectives: tones,
    };
  }

  const offer = dna.offers.find((o) => o.id === entityId);
  if (!offer) throw new Error("Selected promotion was not found in Brand Centre.");
  return buildPromotionBody(dna, campaignId, offer, website);
}

function buildPromotionBody(
  dna: BrandCentreDnaResponse,
  campaignId: string,
  offer: BrandCentreOfferRow,
  website: string,
): CreateCampaignProductBody {
  const start = toIsoDateTime(offer.validityStart, false);
  let end = toIsoDateTime(offer.validityEnd, true);
  if (Date.parse(end) <= Date.parse(start)) {
    const adjusted = new Date(start);
    adjusted.setUTCDate(adjusted.getUTCDate() + 14);
    end = adjusted.toISOString();
  }
  return {
    asset_type: "ACTIVE_SALE_PROMOTION",
    campaign_id: campaignId,
    offer_name: offer.offerName.trim(),
    brief_description: ensureDescription(offer.description, offer.offerName),
    offer_code: (offer.promoCode || "PROMO").trim(),
    applicability: mapApplicability(offer.applicabilityScope || "SITEWIDE"),
    target_linked_entity_id: null,
    start_date_iso: start,
    expiration_date_iso: end,
    t_and_c_footnote:
      offer.description?.trim().length && offer.description.trim().length >= 5
        ? offer.description.trim()
        : "Standard promotional terms and conditions apply.",
    entity_deep_link_url: ensureUrl(website, website),
  };
}

export const ASSET_TYPE_LABELS: Record<UceCampaignAssetType, string> = {
  INDIVIDUAL_PRODUCT_SKU: "Product Portfolio",
  CURATED_COLLECTION_LINE: "Seasonal Collection",
  CORE_BRAND_IDENTITY: "Core Brand",
  ACTIVE_SALE_PROMOTION: "Sale / Promo Scheme",
};
