import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { postBrandCentreSessionEvict } from "../../features/brand-centre/api/brand-centre-client";
import { clearAuthSession, getAccessToken } from "./auth-session";

export function useLogout() {
  const navigate = useNavigate();

  return useCallback(() => {
    void (async () => {
      if (getAccessToken()) {
        try {
          await postBrandCentreSessionEvict();
        } catch {
          // still clear local session if evict fails
        }
      }
      clearAuthSession();
      navigate("/", { replace: true });
    })();
  }, [navigate]);
}
