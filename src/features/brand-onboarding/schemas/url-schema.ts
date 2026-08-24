import { z } from "zod";

const SOCIAL_HOSTS = [
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

const MARKETPLACE_LABELS = [
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

function withProtocol(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function parsedUrl(raw: string): URL | null {
  try {
    const value = new URL(withProtocol(raw));
    if (!value.hostname.includes(".")) return null;
    return value;
  } catch {
    return null;
  }
}

function isObviousSocial(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return SOCIAL_HOSTS.some((social) => host === social || host.endsWith(`.${social}`));
}

function isObviousMarketplace(hostname: string): boolean {
  const labels = hostname.toLowerCase().split(".");
  return MARKETPLACE_LABELS.some((label) => labels.includes(label));
}

export const urlSchema = z
  .string()
  .trim()
  .min(1, "Please enter a website address.")
  .refine((value) => parsedUrl(value) !== null, {
    message: "Please enter a valid website address (for example, brand.com).",
  })
  .refine((value) => {
    const parsed = parsedUrl(value);
    return parsed ? !isObviousSocial(parsed.hostname) : true;
  }, {
    message: "Enter the brand website rather than a social profile.",
  })
  .refine((value) => {
    const parsed = parsedUrl(value);
    return parsed ? !isObviousMarketplace(parsed.hostname) : true;
  }, {
    message: "Enter the brand’s own website rather than a marketplace page.",
  })
  .transform((value) => withProtocol(value));
