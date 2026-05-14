export const BRAND_ONBOARDING_NAV = [
  { to: "/", label: "Start" },
  { to: "/brand/onboarding/scan", label: "Scan" },
  { to: "/brand/onboarding/dna", label: "Brand DNA" },
  { to: "/brand/onboarding/catalogue", label: "Catalogue" },
  { to: "/brand/onboarding/competitors", label: "Competitors" },
] as const;

export const ONBOARDING_ROUTES = {
  landing: "/",
  scan: "/brand/onboarding/scan",
  dna: "/brand/onboarding/dna",
  catalogue: "/brand/onboarding/catalogue",
  competitors: "/brand/onboarding/competitors",
} as const;
