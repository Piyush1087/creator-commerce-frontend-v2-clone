export const BRAND_SETTINGS_ROUTES = {
  root: "/brand/settings",
  general: "/brand/settings/general",
  integrations: "/brand/settings/integrations",
  billing: "/brand/settings/billing",
  escrow: "/brand/settings/escrow",
} as const;

export const CREATOR_SETTINGS_ROUTES = {
  root: "/creator/settings",
  profile: "/creator/settings/profile",
  social: "/creator/settings/social",
  payouts: "/creator/settings/payouts",
} as const;

export type BrandSettingsSubRoute =
  (typeof BRAND_SETTINGS_ROUTES)[keyof typeof BRAND_SETTINGS_ROUTES];

export type CreatorSettingsSubRoute =
  (typeof CREATOR_SETTINGS_ROUTES)[keyof typeof CREATOR_SETTINGS_ROUTES];

function isRouteOrDescendant(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isBrandFinanceRoute(pathname: string): boolean {
  return (
    isRouteOrDescendant(pathname, BRAND_SETTINGS_ROUTES.billing) ||
    isRouteOrDescendant(pathname, BRAND_SETTINGS_ROUTES.escrow)
  );
}
