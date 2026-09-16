import { CreatorCentreShell } from "../../../features/creator-centre/components/creator-centre-shell";
import { CreatorMediaKitWorkspace } from "../../../features/creator-media-kit/components/creator-media-kit-workspace";
import "../../../features/creator-centre/creator-centre.css";

export function CreatorMediaKitPage() {
  return (
    <CreatorCentreShell>
      <CreatorMediaKitWorkspace />
    </CreatorCentreShell>
  );
}
