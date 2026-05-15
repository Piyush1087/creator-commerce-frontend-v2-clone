/**
 * Mirrors `POST /api/v1/discovery/validate`, `POST /api/v1/discovery/resolve`,
 * and `POST /api/v1/discovery/waitlist` in creator-commerce-backend-v2. Keep in sync with
 * `docs/api/brand-discovery.openapi.yaml` and Prisma enums.
 */

export const INDUSTRY_VERTICALS = [
  "D2C",
  "SAAS_AI",
  "HEALTHCARE",
  "OFFLINE_SERVICES",
  "REAL_ESTATE",
  "B2B_AGENCY",
  "MEDIA",
  "EDUCATION",
  "ENTERTAINMENT",
  "UNKNOWN",
  "GAMBLING",
  "ADULT",
  "FRAUDULENT_HIGH_RISK",
] as const;

export type IndustryVertical = (typeof INDUSTRY_VERTICALS)[number];

export type DiscoverValidateRequestBody = {
  url: string;
};

export type DiscoverValidateSuccess = {
  outcome: "success";
  leadId: string;
  normalizedUrl: string;
  industry: IndustryVertical;
};

export type DiscoverValidateWaitlist = {
  outcome: "waitlist";
  logId: string;
  normalizedUrl: string;
  domain: string;
  industry: IndustryVertical;
};

export type DiscoverValidateBlockedCode =
  | "INVALID_URL"
  | "SOCIAL_OR_MARKETPLACE"
  | "PRIVATE_OR_LOCAL_HOST"
  | "BLOCKED_TLD"
  | "BLOCKED_INDUSTRY";

export type DiscoverValidateBlocked = {
  outcome: "blocked";
  code: DiscoverValidateBlockedCode;
  message: string;
  logId?: string;
};

export type DiscoverValidateOrgClaimed = {
  outcome: "org_claimed";
  message: string;
  domain: string;
  adminEmail: string;
};

export type DiscoverValidateResponse =
  | DiscoverValidateSuccess
  | DiscoverValidateWaitlist
  | DiscoverValidateBlocked
  | DiscoverValidateOrgClaimed;

export type ExistingBrandProfileSummary = {
  brandProfileId: string;
  name: string;
  scanStatus: string;
  tagline: string | null;
  descriptionPreview: string | null;
  offerings: number;
  competitors: number;
  locations: number;
};

export type DiscoveryResolveResume = {
  outcome: "resume";
  leadId: string;
  normalizedUrl: string;
  industry: IndustryVertical;
  existingBrandProfile?: ExistingBrandProfileSummary;
};

export type DiscoveryResolveProceed = {
  outcome: "proceed";
  normalizedUrl: string;
  domain: string;
  industry: IndustryVertical;
};

export type DiscoveryResolveResponse =
  | DiscoveryResolveResume
  | DiscoveryResolveProceed
  | DiscoverValidateBlocked
  | DiscoverValidateOrgClaimed;

export type DiscoverWaitlistRequestBody = {
  email: string;
  industry: IndustryVertical;
  discoveryLeadId?: string;
  marketIntelligenceLogId?: string;
  sourceUrl?: string;
};

/** Response from `POST /api/v1/discovery/waitlist` (HTTP 201). */
export type DiscoverWaitlistResponseBody = {
  id: string;
};

export function isDiscoverValidateResponse(
  value: unknown,
): value is DiscoverValidateResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const outcome = (value as { outcome?: unknown }).outcome;
  return (
    outcome === "success" ||
    outcome === "waitlist" ||
    outcome === "blocked" ||
    outcome === "org_claimed"
  );
}

export function isDiscoveryResolveResponse(
  value: unknown,
): value is DiscoveryResolveResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const outcome = (value as { outcome?: unknown }).outcome;
  return (
    outcome === "resume" ||
    outcome === "proceed" ||
    outcome === "blocked" ||
    outcome === "org_claimed"
  );
}

export function isDiscoverWaitlistResponse(
  value: unknown,
): value is DiscoverWaitlistResponseBody {
  if (!value || typeof value !== "object") {
    return false;
  }
  const id = (value as { id?: unknown }).id;
  return typeof id === "string" && id.length > 0;
}
