import { Navigate, useLocation } from "react-router-dom";

import { AUTH_ROUTES, PUBLIC_ROUTES } from "../features/auth/constants";
import { CREATOR_ONBOARDING_ROUTES } from "../features/creator-onboarding/constants";
import {
  clearAuthSession,
  isAccessTokenValid,
  loadAuthSession,
} from "../shared/auth/auth-session";

const KNOWN_APP_PATH_PREFIXES = [
  AUTH_ROUTES.brandDashboard,
  AUTH_ROUTES.brandCentre,
  AUTH_ROUTES.brandUceCampaigns,
  AUTH_ROUTES.brandCollaborationPage,
  AUTH_ROUTES.brandCollaborations,
  AUTH_ROUTES.brandPayouts,
  AUTH_ROUTES.brandSettings,
  AUTH_ROUTES.creatorHome,
  AUTH_ROUTES.creatorDashboard,
  AUTH_ROUTES.creatorAnalytics,
  AUTH_ROUTES.creatorMediaKit,
  AUTH_ROUTES.creatorMarketplace,
  AUTH_ROUTES.creatorCampaigns,
  AUTH_ROUTES.creatorPayouts,
  AUTH_ROUTES.creatorCollaborations,
  AUTH_ROUTES.creatorSettings,
  AUTH_ROUTES.login,
  PUBLIC_ROUTES.marketplace,
  PUBLIC_ROUTES.brandLanding,
  CREATOR_ONBOARDING_ROUTES.instagramCallback,
  "/creator/onboarding",
  "/brand/onboarding",
  "/help",
] as const;

/** Guest funnels that must stay reachable even with a stale JWT in localStorage. */
const GUEST_ONBOARDING_PATH_PREFIXES = [
  "/",
  "/brand/onboarding",
  "/creator/onboarding",
  CREATOR_ONBOARDING_ROUTES.instagramCallback,
  PUBLIC_ROUTES.marketplace,
  PUBLIC_ROUTES.brandLanding,
] as const;

function isKnownAppPath(pathname: string): boolean {
  return KNOWN_APP_PATH_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isGuestOnboardingPath(pathname: string): boolean {
  return GUEST_ONBOARDING_PATH_PREFIXES.some((path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

/**
 * Runs beside guest brand onboarding under `/*`.
 * Signed-in users on unknown URLs go home; stale JWTs must not bounce
 * `/brand/onboarding/*` (that was flashing DNA then dumping to `/`).
 */
export function UnmatchedRouteHandler() {
  const location = useLocation();
  const pathname = location.pathname;
  const session = loadAuthSession();
  const token = session?.accessToken ?? null;

  if (!token) {
    return null;
  }

  if (!isAccessTokenValid(token)) {
    clearAuthSession();
    // Do not Navigate away — guest onboarding must keep working after cleanup.
    return null;
  }

  if (isGuestOnboardingPath(pathname)) {
    return null;
  }

  if (!isKnownAppPath(pathname)) {
    return <Navigate to="/" replace />;
  }

  return null;
}
