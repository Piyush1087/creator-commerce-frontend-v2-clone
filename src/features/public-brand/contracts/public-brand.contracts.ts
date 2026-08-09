export type PublicBrandTheme = {
  primary_color: string | null;
  heading_font: string | null;
  body_font: string | null;
};

export type PublicBrandProductRow = {
  offering_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  external_url: string;
  selling_points?: string[];
};

export type PublicBrandCollectionRow = {
  offering_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  external_url: string;
};

export type PublicBrandLandingResponse = {
  brand_id: string;
  slug: string;
  domain: string;
  company_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  brief_description: string | null;
  hero_image_url: string | null;
  theme: PublicBrandTheme;
  usps: string[];
  flagship_products: PublicBrandProductRow[];
  collections: PublicBrandCollectionRow[];
  open_campaign_count: number;
  featured_campaign: {
    campaign_id: string;
    campaign_name: string | null;
  } | null;
  trust_mode: "testimonials" | "platform_shield";
  testimonials: Array<{
    creator_handle: string;
    tier_label: string;
    quote: string;
  }>;
  marketplace_path: string;
  registration_cta: {
    label: string;
    login_path: string;
  };
};
