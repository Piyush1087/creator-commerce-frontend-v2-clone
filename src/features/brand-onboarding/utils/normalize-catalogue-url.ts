/**
 * Normalize a pasted onboarding website / product URL:
 * - strip tracking query + hash (`?srsltid=…`, utm, etc.)
 * - prepend `https://` when the protocol is missing
 * - drop `www.` and trailing slashes on the path
 */
export function normalizeOnboardingWebsiteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  const withoutHash = trimmed.split("#")[0] ?? trimmed;
  const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;
  const withProtocol = /^https?:\/\//i.test(withoutQuery)
    ? withoutQuery
    : `https://${withoutQuery}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return withProtocol;
    }
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const path =
      url.pathname && url.pathname !== "/"
        ? url.pathname.replace(/\/+$/, "")
        : "";
    return path ? `https://${host}${path}` : `https://${host}`;
  } catch {
    return withProtocol;
  }
}

/** @deprecated Prefer normalizeOnboardingWebsiteUrl */
export const normalizeCatalogueProductUrl = normalizeOnboardingWebsiteUrl;

/** True when hostname is the brand apex or a subdomain of it. */
export function hostnameBelongsToBrand(
  hostname: string,
  brandDomain: string,
): boolean {
  const host = hostname.replace(/^www\./i, "").toLowerCase();
  const root = brandDomain.replace(/^www\./i, "").toLowerCase();
  if (!host || !root) {
    return false;
  }
  return host === root || host.endsWith(`.${root}`);
}
