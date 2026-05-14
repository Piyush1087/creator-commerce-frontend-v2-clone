export type BrandDnaPersona = {
  name: string;
  location: string;
  ageRange: string;
  affluence: number;
  traits: string[];
};

export type BrandDnaState = {
  brandName: string;
  logo: string;
  tagline: string;
  description: string;
  industry: string[];
  colors: string[];
  typography: {
    heading: string;
    body: string;
  };
  tones: string[];
  aesthetics: string[];
  persona: BrandDnaPersona;
};

export type CatalogueProduct = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price?: string;
  location?: string;
  category: "Top Seller" | "Collection" | "Treatment" | "Service";
  url: string;
};

export type CatalogueOffer = {
  id: string;
  title: string;
  description: string;
  code: string;
  type: "Promo" | "Offer" | "Referral";
};

export type CompetitorHandles = {
  instagram?: string;
  tiktok?: string;
};

export type CompetitorRow = {
  id: string;
  name: string;
  logo?: string;
  url: string;
  handles: CompetitorHandles;
  narrative: string;
};

export type ScanPhase =
  | "signals"
  | "products"
  | "audience"
  | "competitors"
  | "complete";

export type ScanStep = {
  id: ScanPhase;
  label: string;
  subtext: string;
};
