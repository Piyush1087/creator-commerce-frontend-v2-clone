import { useEffect } from "react";

import { Navigate, useParams } from "react-router-dom";

import { Alert } from "../../../design-system/aurora";
import { PUBLIC_ROUTES } from "../../../features/auth/constants";
import { PublicBrandLandingWorkspace } from "../../../features/public-brand/components/PublicBrandLandingWorkspace";
import { usePublicBrandLanding } from "../../../features/public-brand/hooks/use-public-brand-landing";
import { rememberBrandSlug } from "../../../features/public-brand/utils/brand-page-session";
import { getAccessToken } from "../../../shared/auth/auth-session";
import { useAuthSession } from "../../../shared/auth/use-auth-session";
import "../../../features/public-brand/public-brand.css";

export function PublicBrandLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { landing, loading, error } = usePublicBrandLanding(slug);
  const session = useAuthSession();
  const isCreator =
    Boolean(getAccessToken()) && session.currentUser?.role === "CREATOR";

  useEffect(() => {
    if (slug) {
      rememberBrandSlug(slug);
    }
  }, [slug]);

  if (!slug) {
    return <Navigate to={PUBLIC_ROUTES.marketplace} replace />;
  }

  if (!loading && error && !landing) {
    return (
      <div className="cc-workspace">
        <Alert tone="error" title="Brand page not found">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <PublicBrandLandingWorkspace
      landing={landing}
      loading={loading}
      error={error}
      layout={isCreator ? "creator" : "guest"}
    />
  );
}
