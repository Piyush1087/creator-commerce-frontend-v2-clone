import { AUTH_ROUTES, getHomeRouteForRole } from "./constants";
import type { UserRole } from "../../shared/auth/user-role";

const UUID_PATH =
  /^\/marketplace\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\?.*)?$/i;

/**
 * After OTP login, return creators to marketplace invite/detail URLs on the authed shell.
 */
export function resolvePostLoginPath(
  role: UserRole | null,
  from: unknown,
): string {
  if (typeof from !== "string" || !from.startsWith("/")) {
    return getHomeRouteForRole(role);
  }

  if (role === "CREATOR") {
    const detailMatch = from.match(UUID_PATH);
    if (detailMatch) {
      return `${AUTH_ROUTES.creatorMarketplace}/${detailMatch[1]}${detailMatch[2] ?? ""}`;
    }
    if (from === AUTH_ROUTES.creatorMarketplace || from.startsWith(`${AUTH_ROUTES.creatorMarketplace}?`)) {
      return from;
    }
    if (from === "/marketplace" || from.startsWith("/marketplace?")) {
      return AUTH_ROUTES.creatorMarketplace + from.slice("/marketplace".length);
    }
    if (from.startsWith("/brand/")) {
      return from;
    }
  }

  return from;
}
