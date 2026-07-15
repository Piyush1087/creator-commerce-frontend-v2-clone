import { z } from "zod";

/** Apex hosts blocked exactly (or as a subdomain of that apex). */
const BLOCKED_APEX_HOSTS = [
  "instagram.com",
  "tiktok.com",
  "facebook.com",
  "fb.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "youtu.be",
  "linkedin.com",
] as const;

/**
 * Marketplace brand labels — blocked when present as a hostname label
 * (covers amazon.com, amazon.in, amazon.co.uk, www.flipkart.com, etc.).
 */
const BLOCKED_MARKETPLACE_LABELS = [
  "amazon",
  "flipkart",
  "myntra",
  "meesho",
  "ajio",
  "snapdeal",
  "nykaa",
  "ebay",
  "walmart",
  "aliexpress",
  "alibaba",
  "shopee",
] as const;

const BLOCKED_RESTRICTED_SEGMENT_SUFFIXES = [
  ".gov",
  ".gov.in",
  ".nic.in",
  ".mil",
  ".mil.in",
  ".edu",
] as const;

const SUSPICIOUS_TLDS = new Set([
  "zip",
  "top",
  "ru",
  "cc",
  "link",
  "biz",
  "info",
  "tk",
  "ml",
]);

const DOMAIN_LABEL = /^[a-z0-9-]{1,63}$/i;

/**
 * Landing change-doc Truncate & Slice Gate: cut tracking (`?…`) and deep paths
 * so discovery always keys off the apex host.
 */
export function truncateToApexHostInput(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }
  const withoutQuery = trimmed.split("?")[0]?.split("#")[0] ?? trimmed;
  const withoutProtocol = withoutQuery.replace(/^(https?:\/\/)/i, "");
  const withoutWww = withoutProtocol.replace(/^www\./i, "");
  const hostOnly = withoutWww.split("/")[0] ?? "";
  return hostOnly.trim();
}

function extractHostname(raw: string): string | null {
  const apex = truncateToApexHostInput(raw);
  if (!apex) {
    return null;
  }
  try {
    return new URL(`https://${apex}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isBlockedApex(hostname: string): boolean {
  return BLOCKED_APEX_HOSTS.some(
    (apex) => hostname === apex || hostname.endsWith(`.${apex}`),
  );
}

function isBlockedMarketplace(hostname: string): boolean {
  const labels = hostname.split(".");
  return BLOCKED_MARKETPLACE_LABELS.some((label) => labels.includes(label));
}

function isBlockedRestrictedSegment(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return BLOCKED_RESTRICTED_SEGMENT_SUFFIXES.some(
    (suffix) => h === suffix.slice(1) || h.endsWith(suffix),
  );
}

function hasSuspiciousTld(hostname: string): boolean {
  const parts = hostname.split(".");
  const tld = parts[parts.length - 1];
  return SUSPICIOUS_TLDS.has(tld);
}

function isValidApexHostname(hostname: string): boolean {
  const labels = hostname.split(".");
  if (labels.length < 2) {
    return false;
  }
  return labels.every((label) => DOMAIN_LABEL.test(label));
}

export const urlSchema = z
  .string()
  .trim()
  .min(1, "Please enter a website address.")
  .transform((val) => truncateToApexHostInput(val))
  .refine(
    (host) => Boolean(host) && isValidApexHostname(host),
    "Please enter a valid website address (e.g., brand.com).",
  )
  .refine((host) => {
    if (isBlockedRestrictedSegment(host)) {
      return false;
    }
    if (isBlockedApex(host) || isBlockedMarketplace(host)) {
      return false;
    }
    if (hasSuspiciousTld(host)) {
      return false;
    }
    return true;
  }, (host) => {
    if (isBlockedRestrictedSegment(host)) {
      return {
        message:
          "Access Denied: This target website belongs to a restricted segment, or is not supported by the platform.",
      };
    }
    if (hasSuspiciousTld(host)) {
      return {
        message:
          "Please enter a valid brand website (this domain extension is not supported).",
      };
    }
    return {
      message:
        "We need your brand’s direct website. Social profiles and marketplaces are not supported.",
    };
  })
  .transform((host) => `https://${host}`);
