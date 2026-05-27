import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { clearAuthSession } from "./auth-session";

export function useLogout() {
  const navigate = useNavigate();

  return useCallback(() => {
    clearAuthSession();
    navigate("/", { replace: true });
  }, [navigate]);
}
