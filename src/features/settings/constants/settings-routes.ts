export const BRAND_SETTINGS_ROUTES = {
  root: "/brand/settings",
  billing: "/brand/settings/billing",
  escrow: "/brand/settings/escrow",
} as const;

export type BrandSettingsSubRoute =
  (typeof BRAND_SETTINGS_ROUTES)[keyof typeof BRAND_SETTINGS_ROUTES];
