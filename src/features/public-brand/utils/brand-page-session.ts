import { AUTH_ROUTES, PUBLIC_ROUTES } from "../../auth/constants";

const LAST_BRAND_SLUG_KEY = "cc_last_brand_slug";

export function rememberBrandSlug(slug: string): void {
  if (!slug.trim()) return;
  try {
    sessionStorage.setItem(LAST_BRAND_SLUG_KEY, slug.trim());
  } catch {
    /* ignore storage errors */
  }
}

export function readLastBrandSlug(): string | null {
  try {
    return sessionStorage.getItem(LAST_BRAND_SLUG_KEY);
  } catch {
    return null;
  }
}

/** Public collaboration page creators receive from the brand. */
export function publicBrandPath(slug: string): string {
  return `/brand/${encodeURIComponent(slug)}`;
}

/** Guest Marketplace filter; signed Creators converge on the MVP Campaigns mount. */
export function brandMarketplacePath(
  slug: string,
  authenticated: boolean,
): string {
  if (authenticated) return AUTH_ROUTES.creatorCampaigns;
  const params = new URLSearchParams({ brand_slug: slug });
  return `${PUBLIC_ROUTES.marketplace}?${params.toString()}`;
}
