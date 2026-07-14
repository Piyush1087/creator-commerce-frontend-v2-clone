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

function extractHostname(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    return new URL(withProtocol).hostname.replace(/^www\./, "");
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

const BLOCKED_RESTRICTED_SEGMENT_SUFFIXES = [".gov", ".mil", ".edu"] as const;

function isBlockedRestrictedSegment(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return BLOCKED_RESTRICTED_SEGMENT_SUFFIXES.some(
    (suffix) => h === suffix.slice(1) || h.endsWith(suffix),
  );
}

function isBlockedSocialOrMarketplace(raw: string): boolean {
  const hostname = extractHostname(raw);
  if (!hostname) {
    return false;
  }
  if (isBlockedRestrictedSegment(hostname)) {
    return true;
  }
  return isBlockedApex(hostname) || isBlockedMarketplace(hostname);
}

export const urlSchema = z
  .string()
  .min(1, "Please enter a website address.")
  .regex(
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i,
    "Please enter a valid website address (e.g., brand.com).",
  )
  .refine(
    (val) => !isBlockedSocialOrMarketplace(val),
    (val) => {
      const hostname = extractHostname(val);
      if (hostname && isBlockedRestrictedSegment(hostname)) {
        return {
          message:
            "Access Denied: This target website belongs to a restricted segment, or is not supported by the platform.",
        };
      }
      return {
        message:
          "We need your brand’s direct website. Social profiles and marketplaces are not supported.",
      };
    },
  );
