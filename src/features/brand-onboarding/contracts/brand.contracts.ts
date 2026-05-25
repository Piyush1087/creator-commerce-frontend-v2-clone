/**
 * Mirrors `POST /api/v1/brand/surface-scan`, `GET /api/v1/brand/profiles/:id`, and
 * `PATCH /api/v1/brand/profiles/:id` in creator-commerce-backend-v2.
 */

export type SurfaceScanResponseBody = {
  brandProfileId: string;
  domain: string;
  mode: "http" | "cached";
  counts: {
    offerings: number;
    competitors: number;
    locations: number;
  };
};

export type BrandProfileOfferingResponse = {
  id: string;
  type: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  url: string;
  priceAmount?: string | null;
  currency: string;
  locationIds: string[];
  isActive: boolean;
};

export type BrandProfileCompetitorResponse = {
  id: string;
  name: string;
  websiteUrl: string;
  logoUrl?: string | null;
  socialHandles: string[];
  whyCompetitor?: string | null;
  isActive: boolean;
};

export type BrandProfileLocationResponse = {
  id: string;
  name?: string | null;
  address: string;
  city?: string | null;
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
  contactDetails?: unknown;
};

export type BrandVisualIdentity = {
  colors?: string[];
  fonts?: { heading?: string; body?: string };
  toneOfVoice?: Array<{ label: string; description: string }>;
  aesthetic?: string[];
};

export type BrandTargetAudience = {
  personaName?: string;
  countries?: string[];
  ageRange?: [number, number];
  affluence?: number;
  traits?: string[];
};

export type BrandProfileResponseBody = {
  id: string;
  domain: string;
  name: string;
  industry: string;
  subIndustry?: string | null;
  industryNiche?: string | null;
  logoUrl?: string | null;
  tagline?: string | null;
  description?: string | null;
  visualIdentity?: BrandVisualIdentity | null;
  brandValues: string[];
  policyFlags: string[];
  targetAudience?: BrandTargetAudience | null;
  isUserEdited?: unknown;
  scanStatus: string;
  offerings: BrandProfileOfferingResponse[];
  competitors: BrandProfileCompetitorResponse[];
  locations: BrandProfileLocationResponse[];
};

export type SendBrandVerificationResponseBody = {
  sent: boolean;
  expiresInMinutes: number;
  expiresAt: string;
};

export type VerifyBrandVerificationResponseBody = {
  verified: boolean;
  brandProfileId: string;
  domain: string;
};

export type PatchBrandProfileRequestBody = {
  name?: string;
  tagline?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  industry?: string;
  subIndustry?: string | null;
  industryNiche?: string | null;
  visualIdentity?: BrandVisualIdentity;
  brandValues?: string[];
  policyFlags?: string[];
  targetAudience?: BrandTargetAudience;
};

export function isSurfaceScanResponse(
  value: unknown,
): value is SurfaceScanResponseBody {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as { brandProfileId?: unknown; domain?: unknown; mode?: unknown };
  return (
    typeof v.brandProfileId === "string" &&
    typeof v.domain === "string" &&
    (v.mode === "http" || v.mode === "cached")
  );
}

export function isBrandProfileResponse(
  value: unknown,
): value is BrandProfileResponseBody {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as { id?: unknown; domain?: unknown; name?: unknown };
  return typeof v.id === "string" && typeof v.domain === "string" && typeof v.name === "string";
}
