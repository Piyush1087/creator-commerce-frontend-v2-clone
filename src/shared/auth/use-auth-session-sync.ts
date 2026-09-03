import { useEffect } from "react";

import { refreshAuthSessionFromServer } from "../../features/auth/api/auth-client";
import { useAuthSession } from "./use-auth-session";

/** Refresh the server-authoritative `/auth/me` projection on shell entry. */
export function useAuthSessionSync(): void {
  const { status } = useAuthSession();

  useEffect(() => {
    if (status !== "AUTHENTICATED") {
      return;
    }
    void refreshAuthSessionFromServer().catch(() => {
      // authenticatedFetch owns refresh failure and session transitions.
    });
  }, [status]);
}
