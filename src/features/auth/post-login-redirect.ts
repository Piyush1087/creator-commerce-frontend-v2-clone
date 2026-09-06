import { AUTH_ROUTES, getHomeRouteForRole } from "./constants";
import type { UserRole } from "../../shared/auth/user-role";
import { resolveSafeInternalPath } from "../../shared/navigation/safe-internal-path";

const UUID_PATH =
  /^\/marketplace\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\?.*)?$/i;

/**
 * After OTP login, return creators to marketplace invite/detail URLs on the authed shell.
 */
export function resolvePostLoginPath(
  role: UserRole | null,
  from: unknown,
): string {
  const fallback = getHomeRouteForRole(role);
  const safeFrom = resolveSafeInternalPath(from, fallback);

  if (role === "CREATOR") {
    const detailMatch = safeFrom.match(UUID_PATH);
    if (detailMatch) {
      return `${AUTH_ROUTES.creatorMarketplace}/${detailMatch[1]}${detailMatch[2] ?? ""}`;
    }
    if (
      safeFrom === AUTH_ROUTES.creatorMarketplace ||
      safeFrom.startsWith(`${AUTH_ROUTES.creatorMarketplace}?`)
    ) {
      return safeFrom;
    }
    if (
      safeFrom === "/marketplace" ||
      safeFrom.startsWith("/marketplace?")
    ) {
      return (
        AUTH_ROUTES.creatorMarketplace +
        safeFrom.slice("/marketplace".length)
      );
    }
    if (safeFrom.startsWith("/brand/")) {
      return safeFrom;
    }
  }

  return safeFrom;
}
