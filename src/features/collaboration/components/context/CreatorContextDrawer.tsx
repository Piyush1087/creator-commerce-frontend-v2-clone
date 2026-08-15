import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { collaborationCounterpartMvpFields } from "../../utils/collaboration-counterpart-context";

export function CreatorContextDrawer({
  detail,
  open,
  onClose,
}: {
  detail: CollaborationDetailResponse;
  open: boolean;
  onClose: () => void;
}) {
  const fields = collaborationCounterpartMvpFields(detail, "BRAND");
  return (
    <SideDrawer isOpen={open} onClose={onClose} title={fields.displayName} subtitle="Collaboration context">
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
    </SideDrawer>
  );
}
