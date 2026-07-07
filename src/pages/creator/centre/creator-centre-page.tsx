import { useSearchParams } from "react-router-dom";

import { AnalyticsPulseWorkspace } from "../../../features/creator-centre/components/analytics-pulse-workspace";
import { CreatorCentreTabs } from "../../../features/creator-centre/components/CreatorCentreTabs";
import { HomeBriefingWorkspace } from "../../../features/creator-centre/components/home-briefing-workspace";
import { MediaKitWorkspace } from "../../../features/creator-centre/components/media-kit-workspace";
import {
  parseCreatorCentreTabId,
  type CreatorCentreTabId,
} from "../../../features/creator-centre/constants/creator-centre-tabs";
import "../../../features/creator-centre/creator-centre.css";

type CreatorCentrePageProps = {
  initialTab?: CreatorCentreTabId;
};

export function CreatorCentrePage({ initialTab }: CreatorCentrePageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabId = parseCreatorCentreTabId(
    searchParams.get("tab") ?? initialTab ?? "home",
  );

  const handleTabChange = (tabId: CreatorCentreTabId) => {
    if (tabId === "home") {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ tab: tabId }, { replace: true });
  };

  return (
    <div className="cctr-centre-page">
      <CreatorCentreTabs
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
      />
      <div className="cctr-centre-page__content">
        {activeTabId === "home" ? <HomeBriefingWorkspace /> : null}
        {activeTabId === "analytics" ? <AnalyticsPulseWorkspace /> : null}
        {activeTabId === "media-kit" ? <MediaKitWorkspace /> : null}
      </div>
    </div>
  );
}
