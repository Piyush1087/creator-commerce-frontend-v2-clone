import { Navigate, useLocation } from "react-router-dom";

import {
  clearAuthSession,
  isAccessTokenValid,
  loadAuthSession,
} from "./auth-session";

type RequireAuthProps = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const token = loadAuthSession()?.accessToken ?? null;

  if (!token || !isAccessTokenValid(token)) {
    if (token) {
      clearAuthSession();
    }
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
