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

/** Marketplace list filtered to one brand's open campaigns. */
export function brandMarketplacePath(slug: string, authenticated: boolean): string {
  const params = new URLSearchParams({ brand_slug: slug });
  const base = authenticated ? AUTH_ROUTES.creatorMarketplace : PUBLIC_ROUTES.marketplace;
  return `${base}?${params.toString()}`;
}
