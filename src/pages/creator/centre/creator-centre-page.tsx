import { Navigate, useSearchParams } from "react-router-dom";

import { AUTH_ROUTES } from "../../../features/auth/constants";
import { CreatorCentreShell } from "../../../features/creator-centre/components/creator-centre-shell";
import { CreatorAssistantPanel } from "../../../features/creator-centre/components/creator-assistant/creator-assistant-panel";
import { HomeBriefingWorkspace } from "../../../features/creator-centre/components/home-briefing-workspace";
import "../../../features/creator-centre/creator-centre.css";

/**
 * Home / Daily Briefing — shell-owned route.
 * Legacy `?tab=` redirects to Insights / Profile.
 */
export function CreatorCentrePage() {
  const [searchParams] = useSearchParams();
  const legacyTab = searchParams.get("tab");

  if (legacyTab === "analytics") {
    return <Navigate to={AUTH_ROUTES.creatorAnalytics} replace />;
  }
  if (legacyTab === "media-kit") {
    return <Navigate to={AUTH_ROUTES.creatorMediaKit} replace />;
  }

  return (
    <CreatorCentreShell>
      <div className="cctr-home-split">
        <div className="cctr-home-split__main">
          <HomeBriefingWorkspace />
        </div>
        <div className="cctr-home-split__assistant">
          <CreatorAssistantPanel variant="desktop" />
        </div>
      </div>
    </CreatorCentreShell>
  );
}
