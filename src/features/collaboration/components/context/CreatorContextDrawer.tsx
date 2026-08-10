import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
export function CreatorContextDrawer({ detail, open, onClose }: { detail: CollaborationDetailResponse; open: boolean; onClose: () => void }) {
  return <SideDrawer isOpen={open} onClose={onClose} title={detail.identity.creator.displayName ?? "Creator"} subtitle="Current collaboration context"><p>{detail.identity.creator.handle ? `@${detail.identity.creator.handle}` : "Creator profile"}</p><p>{detail.sourceContext.campaign.name}</p><p>Relationship history will appear when the dedicated Brand-scoped endpoint is available.</p></SideDrawer>;
}
