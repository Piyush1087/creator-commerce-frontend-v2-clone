import { AUTH_ROUTES, getHomeRouteForRole } from "./constants";
import type { UserRole } from "../../shared/auth/user-role";
import { resolveSafeInternalPath } from "../../shared/navigation/safe-internal-path";

const AUTHENTICATED_MARKETPLACE_PATH = /^\/creator\/marketplace(?:\/|\?|$)/u;
const PUBLIC_MARKETPLACE_PATH = /^\/marketplace(?:\?|$|\/(?!invite(?:\/|$)))/u;

/**
 * Marketplace is hidden/out of MVP. Login-return values that would advertise
 * or open its authenticated surface converge on the Campaigns mount. The
 * dormant route stays available only for C-03 compatibility and is not new
 * navigation authority.
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
    if (safeFrom.startsWith("/brand/")) {
      return safeFrom;
    }
  }

  return safeFrom;
}
