import { ArrowUpRight } from "lucide-react";
import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../../design-system/aurora/components/Button";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { collaborationCounterpartMvpFields } from "../../utils/collaboration-counterpart-context";

export function CreatorContextDrawer({
  detail,
  open,
  onClose,
  onOpenCampaign,
  onOpenCampaignAsset,
  onOpenBrief,
}: {
  detail: CollaborationDetailResponse;
  open: boolean;
  onClose: () => void;
  onOpenCampaign?: () => void;
  onOpenCampaignAsset?: () => void;
  onOpenBrief?: () => void;
}) {
  const fields = collaborationCounterpartMvpFields(detail, "BRAND");
  return (
    <SideDrawer closeLabel="Close Collaboration context" isOpen={open} onClose={onClose} title={fields.displayName} subtitle="Collaboration context">
      <dl className="collab-facts">
        {fields.handle ? (
          <div>
            <dt>Handle</dt>
            <dd>@{fields.handle}</dd>
          </div>
        ) : null}
        {fields.campaignName ? (
          <div>
            <dt>Campaign</dt>
            <dd>{fields.campaignName}</dd>
          </div>
        ) : null}
        {fields.campaignAssetName ? (
          <div>
            <dt>Campaign asset</dt>
            <dd>{fields.campaignAssetName}</dd>
          </div>
        ) : null}
        {fields.briefTitle ? (
          <div>
            <dt>Brief</dt>
            <dd>{fields.briefTitle}</dd>
          </div>
        ) : null}
      </dl>
      {onOpenCampaign || onOpenCampaignAsset || onOpenBrief ? (
        <div className="collab-context-actions" aria-label="Campaign context details">
          <p>Campaign-owned details</p>
          {onOpenCampaign ? <Button variant="outline" onClick={onOpenCampaign}>View Campaign <ArrowUpRight size={15} aria-hidden="true" /></Button> : null}
          {onOpenCampaignAsset ? <Button variant="outline" onClick={onOpenCampaignAsset}>View Campaign Asset <ArrowUpRight size={15} aria-hidden="true" /></Button> : null}
          {onOpenBrief ? <Button variant="outline" onClick={onOpenBrief}>View Campaign Brief <ArrowUpRight size={15} aria-hidden="true" /></Button> : null}
        </div>
      ) : null}
    </SideDrawer>
  );
}
