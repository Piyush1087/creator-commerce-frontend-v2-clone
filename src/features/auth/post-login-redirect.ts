import { AUTH_ROUTES, getHomeRouteForRole } from "./constants";
import type { UserRole } from "../../shared/auth/user-role";
import { resolveSafeInternalPath } from "../../shared/navigation/safe-internal-path";

const AUTHENTICATED_MARKETPLACE_PATH = /^\/creator\/marketplace(?:\/|\?|$)/u;
const PUBLIC_MARKETPLACE_PATH = /^\/marketplace(?:\?|$|\/(?!invite(?:\/|$)))/u;
const RESERVED_BRAND_APP_SEGMENTS = new Set([
  "dashboard",
  "collaborations",
  "collaboration-page",
  "payouts",
  "settings",
  "uce",
  "onboarding",
  "intelligence",
  "team-invitations",
]);

function pathnameOf(path: string): string {
  return path.split(/[?#]/u)[0] ?? path;
}

function isPublicBrandLandingPath(path: string): boolean {
  const match = pathnameOf(path).match(
    /^\/brand\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})$/u,
  );
  if (!match?.[1]) return false;
  return !RESERVED_BRAND_APP_SEGMENTS.has(match[1]);
}

function isAuthenticatedBrandSurface(path: string): boolean {
  const pathname = pathnameOf(path);
  if (
    pathname === "/brand-centre" ||
    pathname.startsWith("/brand-centre/")
  ) {
    return true;
  }
  if (!pathname.startsWith("/brand/")) {
    return false;
  }
  return !isPublicBrandLandingPath(path);
}

/**
 * Marketplace is hidden/out of MVP. Login-return values that would advertise
 * or open its authenticated surface converge on the Campaigns mount. The
 * dormant route stays available only for C-03 compatibility and is not new
 * navigation authority.
 *
 * Creator sessions must not resume Brand app chrome (`/brand/dashboard`,
 * settings, UCE, onboarding). Public `/brand/:slug` landings stay allowed.
 */
export function resolvePostLoginPath(
  role: UserRole | null,
  from: unknown,
): string {
  const fallback = getHomeRouteForRole(role);
  const safeFrom = resolveSafeInternalPath(from, fallback);

  if (role === "CREATOR") {
    if (
      AUTHENTICATED_MARKETPLACE_PATH.test(safeFrom) ||
      PUBLIC_MARKETPLACE_PATH.test(safeFrom)
    ) {
      return AUTH_ROUTES.creatorCampaigns;
    }
    if (isAuthenticatedBrandSurface(safeFrom)) {
      return fallback;
    }
  }

  return safeFrom;
}
