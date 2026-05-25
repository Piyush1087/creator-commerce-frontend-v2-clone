export const BRAND_ONBOARDING_NAV = [
  { to: "/", label: "Start" },
  { to: "/brand/onboarding/scan", label: "Scan" },
  { to: "/brand/onboarding/dna", label: "Brand DNA" },
  { to: "/brand/onboarding/catalogue", label: "Catalogue" },
  { to: "/brand/onboarding/competitors", label: "Competitors" },
  { to: "/brand/onboarding/verification", label: "Verification" },
  { to: "/brand/onboarding/pricing", label: "Pricing" },
  { to: "/brand/onboarding/social-sync", label: "Social Sync" },
] as const;

export const ONBOARDING_ROUTES = {
  landing: "/",
  scan: "/brand/onboarding/scan",
  dna: "/brand/onboarding/dna",
  catalogue: "/brand/onboarding/catalogue",
  competitors: "/brand/onboarding/competitors",
  verification: "/brand/onboarding/verification",
  pricing: "/brand/onboarding/pricing",
  socialSync: "/brand/onboarding/social-sync",
} as const;
