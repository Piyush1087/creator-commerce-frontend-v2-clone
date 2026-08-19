import { Navigate } from "react-router-dom";

import { Alert } from "../../../design-system/aurora";
import { loadAuthSession } from "../../../shared/auth/auth-session";
import { normalizeUserRole } from "../../../shared/auth/user-role";
import {
  resolveCollaborationRouteAccess,
  type CollaborationOperationalRole,
} from "../utils/collaboration-route-access";

type CollaborationRouteGuardProps = {
  children: React.ReactNode;
  expectedRole: CollaborationOperationalRole;
};

export function CollaborationRouteGuard({
  children,
  expectedRole,
}: CollaborationRouteGuardProps) {
  const role = normalizeUserRole(loadAuthSession()?.user.role);
  const access = resolveCollaborationRouteAccess(role, expectedRole);

  if (access.kind === "redirect") {
    return <Navigate to={access.to} replace />;
  }
  if (access.kind === "unsupported") {
    return (
      <Alert tone="warning" title="Collaboration access unavailable">
        This account does not have an operational Brand or Creator Collaboration workspace.
      </Alert>
    );
  }
  return <>{children}</>;
}
