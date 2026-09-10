import { Navigate } from "react-router-dom";

import { Alert } from "../../../design-system/aurora";
import { useAuthSession } from "../../../shared/auth/use-auth-session";
import { normalizeUserRole } from "../../../shared/auth/user-role";
import { resolveBrandPayoutsRouteAccess } from "../utils/brand-payouts-presentation";

export function BrandPayoutsRouteGuard({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const session = useAuthSession();
  const role = normalizeUserRole(session.currentUser?.role);
  const access = resolveBrandPayoutsRouteAccess(role);
  if (access.kind === "REDIRECT") {
    return <Navigate to={access.to} replace />;
  }
  if (access.kind === "DENY") {
    return (
      <Alert tone="warning" title="Brand Payouts access unavailable">
        This account does not have an active Brand workspace for this route.
      </Alert>
    );
  }
  return <>{children}</>;
}
