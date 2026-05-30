export interface AudiencePersonaView {
  name: string;
  imageUrl: string | null;
}

export interface ChartSlice {
  label: string;
  value: number;
  color: string;
}

export interface CatalogOfferingView {
  id: string;
  name: string;
  url: string;
  description: string;
  sellingPoints: string[];
  isDeepScanned: boolean;
}

export interface CatalogOfferView {
  id: string;
  offerName: string;
  promoCode: string;
  scope: string;
  validity: string;
}

export interface CatalogCompetitorView {
  id: string;
  name: string;
  websiteUrl: string;
  whyCompetitor: string;
}

export interface BrandCentreCatalogViewModel {
  brandUsps: string[];
  doNotSayList: string[];
  primarySectionTitle: string;
  collectionSectionTitle: string;
  primaryOfferings: CatalogOfferingView[];
  collectionOfferings: CatalogOfferingView[];
  offers: CatalogOfferView[];
  competitors: CatalogCompetitorView[];
  hasPrimaryOfferings: boolean;
  hasCollections: boolean;
  hasOffers: boolean;
  hasCompetitors: boolean;
  hasBrandUsps: boolean;
}

/** Read-only view model for Brand Centre Tab 1 (DNA). Built from API responses. */
export interface BrandCentreViewModel {
  brandName: string;
  website: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  marketSetup: string;
  industry: string;
  lifecycleStage: string;
  igHandle: string;
  ytHandle: string;
  tiktokHandle: string;
  narrativeTitle: string;
  narrativeDescription: string;
  toneTags: string[];
  colors: string[];
  fonts: string[];
  personas: AudiencePersonaView[];
  currencyCode: string;
  monthlyBudgetLabel: string;
  utilizedBudgetLabel: string;
  utilizationPercent: number;
  showUtilization: boolean;
  assetAllocation: ChartSlice[];
  influencerTiers: ChartSlice[];
  campaignObjectives: ChartSlice[];
  escrowStatus: string;
  currentPlan: string;
  outreachQuotaLabel: string;
  metaConnectionStatus: string;
  teamManagement: string;
  catalog: BrandCentreCatalogViewModel;
}
