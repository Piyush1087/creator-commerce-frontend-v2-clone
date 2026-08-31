import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { logoutCurrentSession } from "../../features/auth/api/auth-client";
import { AUTH_ROUTES } from "../../features/auth/constants";

export function useLogout() {
  const navigate = useNavigate();

  return useCallback(() => {
    void (async () => {
      try {
        await logoutCurrentSession();
      } catch {
        // Keep the user on the current page if the server could not confirm logout.
        return;
      }
      navigate(AUTH_ROUTES.login, { replace: true });
    })();
  }, [navigate]);
}
