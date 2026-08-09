import { CreatorCentreShell } from "../../../features/creator-centre/components/creator-centre-shell";
import { CreatorProfileWorkspace } from "../../../features/creator-centre/components/creator-profile-workspace";
import "../../../features/creator-centre/creator-centre.css";

export function CreatorMediaKitPage() {
  return (
    <CreatorCentreShell>
      <CreatorProfileWorkspace />
    </CreatorCentreShell>
  );
}
