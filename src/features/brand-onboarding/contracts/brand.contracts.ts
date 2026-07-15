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

/**
 * Landing Page State F: surface scan could not reach the target domain
 * (dead DNS, timeout, 4xx/5xx, redirect hijack). Returned as the body of an
 * HTTP 502 from `POST /api/v1/brand/surface-scan`.
 */
export type SurfaceScanInfrastructureErrorBody = {
  outcome: "infrastructure_error";
  reason: "http_status" | "dns_or_timeout" | "redirect_hijack";
  httpStatus: number | null;
  message: string;
};

/** Stage 1A vendor/platform response exceeded the scan-page retry budget. */
export type SurfaceScanTimeoutErrorBody = {
  outcome: "scan_timeout";
  timeoutMs: number;
  message: string;
};

export function unwrapSurfaceScanTimeoutError(
  value: unknown,
): SurfaceScanTimeoutErrorBody | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const root = value as {
    outcome?: unknown;
    timeoutMs?: unknown;
    message?: unknown;
  };
  if (
    root.outcome === "scan_timeout" &&
    typeof root.timeoutMs === "number" &&
    typeof root.message === "string"
  ) {
    return root as SurfaceScanTimeoutErrorBody;
  }
  if (root.message && typeof root.message === "object") {
    return unwrapSurfaceScanTimeoutError(root.message);
  }
  return null;
}

export function isSurfaceScanInfrastructureError(
  value: unknown,
): value is SurfaceScanInfrastructureErrorBody {
  if (!value || typeof value !== "object") {
    return false;
  }
  const root = value as { outcome?: unknown; message?: unknown };
  if (root.outcome === "infrastructure_error" && typeof root.message === "string") {
    return true;
  }
  // Nest sometimes nests the object under `message`.
  if (root.message && typeof root.message === "object") {
    const nested = root.message as { outcome?: unknown; message?: unknown };
    return (
      nested.outcome === "infrastructure_error" &&
      typeof nested.message === "string"
    );
  }
  return false;
}

/** Unwrap Nest nested/flat infrastructure-error payloads. */
export function unwrapSurfaceScanInfrastructureError(
  value: unknown,
): SurfaceScanInfrastructureErrorBody | null {
  if (!isSurfaceScanInfrastructureError(value)) {
    return null;
  }
  const root = value as {
    outcome?: unknown;
    reason?: unknown;
    httpStatus?: unknown;
    message?: unknown;
  };
  if (root.outcome === "infrastructure_error" && typeof root.message === "string") {
    return {
      outcome: "infrastructure_error",
      reason:
        root.reason === "http_status" ||
        root.reason === "dns_or_timeout" ||
        root.reason === "redirect_hijack"
          ? root.reason
          : "dns_or_timeout",
      httpStatus: typeof root.httpStatus === "number" ? root.httpStatus : null,
      message: root.message,
    };
  }
  const nested = root.message as SurfaceScanInfrastructureErrorBody;
  return nested;
}

export type FieldEvidence = {
  page_url: string;
  page_type: string;
  excerpt: string;
};

export type UniversalFieldWrapper<T> = {
  value: T;
  confidence: number;
  evidence: FieldEvidence[];
  source: "AI" | "USER" | "SYSTEM" | "CRAWLER" | string;
  edited: boolean;
};

export type CoreIdentitySocialHandles = {
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  youtube: string | null;
  linkedin: string | null;
};

/** Stage 1A Checkpoint 1 snapshot (Phase 3). */
export type CoreIdentitySnapshot = {
  scan_id: string;
  brand_name: UniversalFieldWrapper<string>;
  website_url: UniversalFieldWrapper<string>;
  country: UniversalFieldWrapper<string>;
  reporting_currency: UniversalFieldWrapper<string>;
  brand_logo: UniversalFieldWrapper<string | null>;
  industry: UniversalFieldWrapper<string>;
  sub_industry: UniversalFieldWrapper<string>;
  social_handles: UniversalFieldWrapper<CoreIdentitySocialHandles>;
  tagline: UniversalFieldWrapper<string | null>;
  discovered_root_links: string[];
  /** Ordered alternate logo URLs the backend mirror can walk on 404. */
  logo_candidates?: string[];
};

export type CoreIdentitySnapshotResponse = {
  leadId: string;
  brandProfileId: string | null;
  completedAt: string | null;
  snapshot: CoreIdentitySnapshot;
};

function isFieldWrapper(value: unknown): value is UniversalFieldWrapper<unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as {
    value?: unknown;
    confidence?: unknown;
    evidence?: unknown;
    source?: unknown;
    edited?: unknown;
  };
  return (
    typeof v.confidence === "number" &&
    Array.isArray(v.evidence) &&
    typeof v.source === "string" &&
    typeof v.edited === "boolean"
  );
}

export function isCoreIdentitySnapshotResponse(
  value: unknown,
): value is CoreIdentitySnapshotResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as {
    leadId?: unknown;
    snapshot?: unknown;
  };
  if (typeof v.leadId !== "string" || !v.snapshot || typeof v.snapshot !== "object") {
    return false;
  }
  const s = v.snapshot as Record<string, unknown>;
  return (
    typeof s.scan_id === "string" &&
    isFieldWrapper(s.brand_name) &&
    isFieldWrapper(s.website_url) &&
    isFieldWrapper(s.country) &&
    isFieldWrapper(s.reporting_currency) &&
    isFieldWrapper(s.brand_logo) &&
    isFieldWrapper(s.industry) &&
    isFieldWrapper(s.sub_industry) &&
    isFieldWrapper(s.social_handles) &&
    isFieldWrapper(s.tagline) &&
    Array.isArray(s.discovered_root_links)
  );
}

export type SurfaceScanProgressPhase =
  | "signals"
  | "products"
  | "audience"
  | "competitors"
  | "persisting"
  | "complete"
  | "error";

export type SurfaceScanProgressResponse = {
  leadId: string;
  phase: SurfaceScanProgressPhase | string;
  completedPhases: Array<SurfaceScanProgressPhase | string>;
  message?: string;
  error?: string;
  updatedAt: string;
};

export type SyncOfferingItem = {
  id?: string;
  type: "PRODUCT" | "TREATMENT" | "SERVICE" | "COLLECTION";
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  url: string;
  categoryTag?: string | null;
  startingPriceLabel?: string | null;
  isActive?: boolean;
};

export type SyncCompetitorItem = {
  id?: string;
  name: string;
  websiteUrl: string;
  logoUrl?: string | null;
  socialHandles?: string[];
  whyCompetitor?: string | null;
  isActive?: boolean;
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
