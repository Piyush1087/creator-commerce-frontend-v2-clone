import type { BrandCentreDnaResponse } from "../contracts/brand-centre.contracts";
import type { BrandCentreCatalogViewModel } from "../types";
import { displayField, displayList, EMPTY_FIELD, hasDisplayValue } from "./display-field";

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return EMPTY_FIELD;
  }
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return EMPTY_FIELD;
  }
}

export function mapDnaCatalogView(dna: BrandCentreDnaResponse): BrandCentreCatalogViewModel {
  return {
    brandUsps: displayList(dna.narrative.brandUsps),
    doNotSayList: displayList(dna.narrative.doNotSayList),
    primarySectionTitle: dna.routingTemplate?.section4?.header ?? "Primary offerings",
    collectionSectionTitle:
      dna.routingTemplate?.section5?.header ?? "Collections",
    primaryOfferings: dna.offeringsPrimary.map((row) => ({
      id: row.id,
      name: displayField(row.name),
      url: displayField(row.url),
      description: displayField(row.description),
      sellingPoints: row.sellingPoints?.length
        ? row.sellingPoints
        : [EMPTY_FIELD],
      isDeepScanned: row.isDeepScanned ?? false,
    })),
    collectionOfferings: dna.offeringsCollections.map((row) => ({
      id: row.id,
      name: displayField(row.name),
      url: displayField(row.url),
      description: displayField(row.description),
      sellingPoints: row.sellingPoints?.length
        ? row.sellingPoints
        : [EMPTY_FIELD],
      isDeepScanned: row.isDeepScanned ?? false,
    })),
    offers: dna.offers.map((row) => ({
      id: row.id,
      offerName: displayField(row.offerName),
      promoCode: displayField(row.promoCode),
      scope: displayField(row.applicabilityScope),
      validity: `${formatDate(row.validityStart)} – ${formatDate(row.validityEnd)}`,
    })),
    competitors: dna.competitors.map((row) => ({
      id: row.id,
      name: displayField(row.name),
      websiteUrl: displayField(row.websiteUrl),
      whyCompetitor: displayField(row.whyCompetitor),
    })),
    hasPrimaryOfferings: dna.offeringsPrimary.length > 0,
    hasCollections: dna.offeringsCollections.length > 0,
    hasOffers: dna.offers.length > 0,
    hasCompetitors: dna.competitors.length > 0,
    hasBrandUsps: dna.narrative.brandUsps.some((u) => hasDisplayValue(u.trim())),
  };
}
