import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import { Alert } from "../../../design-system/aurora";
import { PUBLIC_ROUTES } from "../../../features/auth/constants";
import { resolvePublicInvitation } from "../../../features/creator-campaigns/api/public-marketplace-client";
import "../../../features/creator-campaigns/creator-campaigns.css";

export function PublicInviteLandingPage() {
  const { token } = useParams<{ token: string }>();
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (!token?.trim()) {
      setError("Invitation link is missing a token.");
      return;
    }

    let cancelled = false;
    void resolvePublicInvitation(token)
      .then((resolved) => {
        if (cancelled) return;
        setRedirectTo(
          `${PUBLIC_ROUTES.marketplace}/${resolved.campaign_id}?invite_token=${encodeURIComponent(token)}`,
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Invitation could not be resolved.");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (error) {
    return (
      <div className="cc-workspace">
        <Alert tone="error" title="Invalid invitation">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="cc-workspace">
      <p className="cc-muted">Resolving your invitation…</p>
    </div>
  );
}
