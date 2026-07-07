import { useEffect } from "react";

import { refreshAuthSessionFromServer } from "../../features/auth/api/auth-client";
import { handleAuthFailure, isAccessTokenValid, loadAuthSession } from "./auth-session";

/** Sync minimal user fields from GET /api/v1/auth/me on authenticated shell mount. */
export function useAuthSessionSync(): void {
  useEffect(() => {
    const session = loadAuthSession();
    if (!session?.accessToken || !isAccessTokenValid(session.accessToken)) {
      if (session?.accessToken) {
        handleAuthFailure();
      }
      return;
    }

    void (async () => {
      try {
        await refreshAuthSessionFromServer();
      } catch {
        handleAuthFailure();
      }
    })();
  }, []);
}
