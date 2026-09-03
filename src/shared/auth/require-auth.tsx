import { Navigate, useLocation } from "react-router-dom";

import { useAuthSession } from "./use-auth-session";
import { resolveSafeInternalPath } from "../navigation/safe-internal-path";

type RequireAuthProps = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const session = useAuthSession();

  if (session.status === "INITIALIZING" || session.status === "REFRESHING") {
    return (
      <main className="auth-session-loading" aria-busy="true">
        <p role="status">Restoring your secure session…</p>
      </main>
    );
  }

  if (session.status === "UNAUTHENTICATED") {
    const from = resolveSafeInternalPath(
      `${location.pathname}${location.search}${location.hash}`,
      "/",
    );
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <>{children}</>;
}
