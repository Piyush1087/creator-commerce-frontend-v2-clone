import { AUTH_ROUTES } from "../../auth/constants";

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

/** Signed Creators open Campaigns. Guests do not enter Marketplace browse. */
export function brandMarketplacePath(
  _slug: string,
  authenticated: boolean,
): string {
  if (authenticated) return AUTH_ROUTES.creatorCampaigns;
  return AUTH_ROUTES.login;
}
