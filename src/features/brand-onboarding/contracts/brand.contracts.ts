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
  source: "AI" | "USER" | "SYSTEM" | "CRAWLER" | "ZYTE" | "PLAYWRIGHT" | string;
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

/** Checkpoint 1 confirm-identity request body (Phase 4). */
export type ConfirmIdentityRequestBody = {
  brand_name: string;
  brand_logo: string | null;
  industry: string;
  sub_industry: string;
  tagline: string | null;
  social_handles: CoreIdentitySocialHandles;
};

export type ConfirmIdentityResponseBody = {
  success: true;
  nextStage: "STAGE_1B_QUEUED" | string;
};

export type BrandIntelligenceStage =
  | "STAGE_1A_COMPLETE"
  | "STAGE_1A_FAILED_FALLBACK"
  | "CORE_IDENTITY_APPROVED"
  | "STAGE_1B_COMPLETE"
  | "STAGE_1B_FAILED"
  | "STAGE_2_BRAND_DNA_COMPLETE"
  | "STAGE_2_BRAND_DNA_FAILED"
  | "STAGE_2_BRAND_DNA_ARCHIVED"
  | "STAGE_2_NEEDS_REVIEW"
  | "CHECKPOINT_2_CONFIRMED";

export type BrandDnaAudiencePersona = {
  name: UniversalFieldWrapper<string>;
  age_range: UniversalFieldWrapper<string>;
  gender: UniversalFieldWrapper<string>;
  geography: UniversalFieldWrapper<string>;
  affluence_score: UniversalFieldWrapper<string>;
  traits: UniversalFieldWrapper<string[]>;
};

export type BrandDnaSnapshot = {
  industry_niche: UniversalFieldWrapper<string>;
  brand_positioning: UniversalFieldWrapper<string>;
  brand_narrative: UniversalFieldWrapper<string>;
  core_value_proposition: UniversalFieldWrapper<string>;
  key_differentiators: UniversalFieldWrapper<string[]>;
  tone_of_voice: UniversalFieldWrapper<string[]>;
  visual_aesthetic: UniversalFieldWrapper<string[]>;
  audience_personas: BrandDnaAudiencePersona[];
};

export type IntelligenceJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export type IntelligenceStatusResponse = {
  leadId: string;
  brandProfileId: string | null;
  currentStage: BrandIntelligenceStage | null;
  brandDna: BrandDnaSnapshot | null;
  error: string | null;
  /** Present on newer APIs — keep polling while QUEUED/RUNNING (job retries). */
  jobStatus?: IntelligenceJobStatus | null;
  jobAttempt?: number | null;
};

export type BrandAuditFieldRow = {
  field: string;
  value: string;
  source: string;
  sourceDetail: string;
  confidence: number | null;
  edited: boolean;
  evidence: string;
};

export type BrandAuditExportResponse = {
  leadId: string;
  brandProfileId: string | null;
  domain: string | null;
  generatedAt: string;
  currentStage: BrandIntelligenceStage | null;
  pipelineError: string | null;
  surfaceScan: {
    completedAt: string | null;
    scanId: string;
    discoveryMode: string | null;
    discoveredLinksCount: number;
    discoveredLinksSample: string[];
    fields: BrandAuditFieldRow[];
    confirmedIdentity: BrandAuditFieldRow[] | null;
  };
  phaseB: {
    stage1b: {
      status: string | null;
      plannedUrls: string[];
      pageCount: number | null;
      completedAt: string | null;
    };
    crawledPages: Array<{
      url: string;
      pageType: string;
      title: string | null;
      textChars: number;
    }>;
    websiteAssets: {
      colors: string[];
      fonts: string[];
      logo: string | null;
    };
    websiteSummary: {
      homepageExcerpt: string;
      aboutExcerpt: string | null;
      navLabels: string[];
    };
    brandDna: {
      fields: BrandAuditFieldRow[];
      personas: Array<{
        index: number;
        fields: BrandAuditFieldRow[];
      }>;
    } | null;
  };
};

export function isBrandAuditExportResponse(
  value: unknown,
): value is BrandAuditExportResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as { leadId?: unknown; surfaceScan?: unknown; phaseB?: unknown };
  return (
    typeof v.leadId === "string" &&
    typeof v.surfaceScan === "object" &&
    v.surfaceScan !== null &&
    typeof v.phaseB === "object" &&
    v.phaseB !== null
  );
}

export type Checkpoint2Status = "ready" | "building" | "failed";

export type Checkpoint2Response = {
  leadId: string;
  brandProfileId: string | null;
  currentStage: BrandIntelligenceStage | null;
  brandDna: BrandDnaSnapshot | null;
  offerings: unknown[];
  competitors: unknown[];
  checkpoint2Confirmation: unknown | null;
  status: Checkpoint2Status;
};

export type ConfirmCheckpoint2RequestBody = {
  confirmed: true;
  brandDna?: unknown;
  offerings?: unknown[];
  competitors?: unknown[];
};

export type ConfirmCheckpoint2ResponseBody = {
  success: true;
  currentStage: BrandIntelligenceStage;
  checkpoint2Confirmation: unknown;
};

export function isCheckpoint2Response(
  value: unknown,
): value is Checkpoint2Response {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as {
    leadId?: unknown;
    status?: unknown;
    offerings?: unknown;
    competitors?: unknown;
  };
  return (
    typeof v.leadId === "string" &&
    (v.status === "ready" ||
      v.status === "building" ||
      v.status === "failed") &&
    Array.isArray(v.offerings) &&
    Array.isArray(v.competitors)
  );
}

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
