import { SideDrawer } from "../../../../design-system/aurora";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
export function BrandContextDrawer({ detail, open, onClose }: { detail: CollaborationDetailResponse; open: boolean; onClose: () => void }) {
  return <SideDrawer isOpen={open} onClose={onClose} title={detail.identity.brand.displayName ?? "Brand"} subtitle="Current collaboration context"><p>{detail.sourceContext.campaign.name}</p><p>{detail.sourceContext.brief.title}</p><p>Additional Brand relationship context requires a dedicated canonical endpoint.</p></SideDrawer>;
}
