import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { collaborationCounterpartMvpFields } from "../../utils/collaboration-counterpart-context";

export function BrandContextDrawer({
  detail,
  open,
  onClose,
}: {
  detail: CollaborationDetailResponse;
  open: boolean;
  onClose: () => void;
}) {
  const fields = collaborationCounterpartMvpFields(detail, "CREATOR");
  return (
    <SideDrawer closeLabel="Close Collaboration context" isOpen={open} onClose={onClose} title={fields.displayName} subtitle="Collaboration context">
      <dl className="collab-facts">
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
