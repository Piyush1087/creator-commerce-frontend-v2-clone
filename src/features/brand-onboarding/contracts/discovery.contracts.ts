/**
 * Mirrors discovery validate/resolve/waitlist APIs in creator-commerce-backend-v2.
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

export type WaitlistReasonCode =
  | "UNSUPPORTED_INDUSTRY"
  | "FOREIGN_LANGUAGE"
  | "CONTENT_UNREADABLE"
  | "PARKED_DOMAIN";

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
  leadId: string;
  normalizedUrl: string;
  domain: string;
  industry: IndustryVertical;
  reason?: WaitlistReasonCode;
  message?: string;
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

export type DiscoverValidateBrandActive = {
  outcome: "brand_active";
  message: string;
  domain: string;
};

export type DiscoverValidateVerificationRequired = {
  outcome: "verification_required";
  message: string;
  domain: string;
  brandProfileId: string;
  reason: "DOMAIN_LIMIT" | "IP_LIMIT";
};

export type DiscoverValidateInfrastructureError = {
  outcome: "infrastructure_error";
  reason: "http_status" | "dns_or_timeout" | "redirect_hijack";
  httpStatus?: number;
  message: string;
  domain: string;
  normalizedUrl: string;
};

export type DiscoverValidateResponse =
  | DiscoverValidateSuccess
  | DiscoverValidateWaitlist
  | DiscoverValidateBlocked
  | DiscoverValidateOrgClaimed
  | DiscoverValidateBrandActive
  | DiscoverValidateVerificationRequired
  | DiscoverValidateInfrastructureError;

export type DiscoveryResolveResume = {
  outcome: "resume";
  leadId: string;
  normalizedUrl: string;
  industry: IndustryVertical;
  brandProfileId: string;
  domain: string;
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
  | DiscoverValidateOrgClaimed
  | DiscoverValidateBrandActive
  | DiscoverValidateVerificationRequired;

export type DiscoverWaitlistRequestBody = {
  email: string;
  industry: IndustryVertical;
  reason?: WaitlistReasonCode;
  domain?: string;
  discoveryLeadId?: string;
  marketIntelligenceLogId?: string;
  sourceUrl?: string;
};

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
    outcome === "org_claimed" ||
    outcome === "brand_active" ||
    outcome === "verification_required" ||
    outcome === "infrastructure_error"
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
    outcome === "org_claimed" ||
    outcome === "brand_active" ||
    outcome === "verification_required"
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

export function waitlistReasonMessage(
  reason: WaitlistReasonCode | undefined,
  industry: string,
  domain: string,
): string {
  switch (reason) {
    case "FOREIGN_LANGUAGE":
      return `We've identified ${domain} as a non-English storefront. Creator's Shop currently focuses on English-language brands.`;
    case "PARKED_DOMAIN":
      return `We've identified ${domain} as a parked or coming-soon page. Storefront components could not be evaluated yet.`;
    case "CONTENT_UNREADABLE":
      return `We couldn't evaluate enough content on ${domain} to classify this brand.`;
    case "UNSUPPORTED_INDUSTRY":
    default:
      return `We've identified ${domain} to be ${industry.replace(/_/g, " ")}. Creator's Shop is currently optimized for D2C, SaaS, Healthcare, and Offline Services.`;
  }
}
