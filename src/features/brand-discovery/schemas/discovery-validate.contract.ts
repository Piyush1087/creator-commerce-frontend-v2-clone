/**
 * Mirrors `POST /api/v1/discovery/validate` in creator-commerce-backend-v2.
 * Keep in sync with `docs/api/brand-discovery.openapi.yaml` and Prisma enums.
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

export type DiscoverValidateResponse =
  | DiscoverValidateSuccess
  | DiscoverValidateWaitlist
  | DiscoverValidateBlocked;

export function isDiscoverValidateResponse(
  value: unknown,
): value is DiscoverValidateResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const outcome = (value as { outcome?: unknown }).outcome;
  return (
    outcome === "success" || outcome === "waitlist" || outcome === "blocked"
  );
}
