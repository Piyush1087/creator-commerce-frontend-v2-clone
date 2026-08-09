import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Card } from "../../../design-system/aurora";
import { CREATOR_ONBOARDING_ROUTES } from "../../../features/creator-onboarding/constants";

import "../../../features/creator-onboarding/creator-onboarding.css";

/** Bridges Meta OAuth redirect (v1 URI) into the onboarding connect step. */
export function CreatorInstagramOAuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`${CREATOR_ONBOARDING_ROUTES.connect}${location.search}`, {
      replace: true,
    });
  }, [location.search, navigate]);

  return (
    <div className="cob-page cob-connect-layout">
      <Card className="cob-modal-panel cob-connect-card">
        <span className="cob-badge">Meta Graph API secure handshake</span>
        <h1 className="cob-connect-title">Finishing Instagram authorization…</h1>
        <p className="cob-muted">Please wait while we return you to connect.</p>
      </Card>
    </div>
  );
}
