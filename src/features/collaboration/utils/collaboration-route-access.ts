import { AUTH_ROUTES } from "../../auth/constants";
import type { UserRole } from "../../../shared/auth/user-role";

export type CollaborationOperationalRole = Extract<UserRole, "BRAND" | "CREATOR">;

export type CollaborationRouteAccess =
  | { kind: "allow"; role: CollaborationOperationalRole }
  | { kind: "redirect"; to: string }
  | { kind: "unsupported" };

export function resolveCollaborationRouteAccess(
  actualRole: UserRole | null,
  expectedRole: CollaborationOperationalRole,
): CollaborationRouteAccess {
  if (actualRole === expectedRole) {
    return { kind: "allow", role: expectedRole };
  }
  if (actualRole === "BRAND") {
    return { kind: "redirect", to: AUTH_ROUTES.brandCollaborations };
  }
  if (actualRole === "CREATOR") {
    return { kind: "redirect", to: AUTH_ROUTES.creatorCollaborations };
  }
  return { kind: "unsupported" };
}
