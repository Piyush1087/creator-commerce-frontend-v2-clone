import { Navigate, useLocation } from "react-router-dom";

import { getAccessToken } from "./auth-session";

type RequireAuthProps = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const token = getAccessToken();

  if (!token) {
    return (
      <Navigate to="/" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}
