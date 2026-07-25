import { CreatorCentreShell } from "../../../features/creator-centre/components/creator-centre-shell";
import { HomeBriefingWorkspace } from "../../../features/creator-centre/components/home-briefing-workspace";
import { CreatorAssistantPanel } from "../../../features/creator-centre/components/creator-assistant/creator-assistant-panel";
import "../../../features/creator-centre/creator-centre.css";

/** @deprecated Prefer CreatorCentrePage — same Home shell. */
export function CreatorHomePage() {
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
