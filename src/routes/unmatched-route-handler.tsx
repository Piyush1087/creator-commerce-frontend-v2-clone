import { Navigate } from "react-router-dom";

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

function isKnownAppPath(pathname: string): boolean {
  return KNOWN_APP_PATH_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Guest onboarding fallback; signed-in users on unknown URLs go to `/`. */
export function UnmatchedRouteHandler() {
  const session = loadAuthSession();
  const token = session?.accessToken ?? null;

  if (!token) {
    return null;
  }

  if (!isAccessTokenValid(token)) {
    clearAuthSession();
    return <Navigate to="/" replace />;
  }

  if (!isKnownAppPath(window.location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return null;
}
