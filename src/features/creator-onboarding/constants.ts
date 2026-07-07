export const CREATOR_ONBOARDING_ROUTES = {
  landing: "/creator/onboarding",
  modules: "/creator/onboarding/modules",
  signup: "/creator/onboarding/signup",
  connect: "/creator/onboarding/connect",
  sync: "/creator/onboarding/sync",
  /** Matches v1 Meta app redirect URI registration for localhost. */
  instagramCallback: "/integrate-instagram",
} as const;

export const CREATOR_ONBOARDING_NAV = [
  { to: CREATOR_ONBOARDING_ROUTES.landing, label: "Start" },
  { to: CREATOR_ONBOARDING_ROUTES.modules, label: "Modules" },
  { to: CREATOR_ONBOARDING_ROUTES.signup, label: "Signup" },
  { to: CREATOR_ONBOARDING_ROUTES.connect, label: "Connect" },
  { to: CREATOR_ONBOARDING_ROUTES.sync, label: "Sync" },
] as const;
