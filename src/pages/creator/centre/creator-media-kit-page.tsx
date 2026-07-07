import { Navigate } from "react-router-dom";

import { AUTH_ROUTES } from "../../../features/auth/constants";

/** @deprecated Redirects to unified Creator Centre. */
export function CreatorMediaKitPage() {
  return <Navigate to={`${AUTH_ROUTES.creatorHome}?tab=media-kit`} replace />;
}
