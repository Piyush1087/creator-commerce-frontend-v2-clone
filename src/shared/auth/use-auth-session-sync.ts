import { useEffect } from "react";

import { refreshAuthSessionFromServer } from "../../features/auth/api/auth-client";
import { clearAuthSession } from "./auth-session";

/** Sync minimal user fields from GET /api/v1/auth/me on authenticated shell mount. */
export function useAuthSessionSync(): void {
  useEffect(() => {
    void (async () => {
      try {
        await refreshAuthSessionFromServer();
      } catch {
        clearAuthSession();
      }
    })();
  }, []);
}
