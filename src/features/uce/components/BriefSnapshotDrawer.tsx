import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";
import type { RepositoryBrief } from "../types/repository";
import { displayField, EMPTY_FIELD } from "../utils/display-field";

type BriefSnapshotDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  brief: RepositoryBrief | null;
};

export function BriefSnapshotDrawer({
  isOpen,
  onClose,
  brief,
}: BriefSnapshotDrawerProps) {
  const title = brief
    ? `Strategic Brief Snapshot: ${brief.name}`
    : `Strategic Brief Snapshot: ${EMPTY_FIELD}`;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="400px"
      footer={
        <div className="uce-drawer-footer-stack">
          <Button variant="primary" className="uce-drawer-footer-full" disabled>
            Edit Brief Creative Guardrails
          </Button>
          <Button variant="outline" className="uce-drawer-footer-full" onClick={onClose}>
            Dismiss Panel
          </Button>
        </div>
      }
    >
      <div className="uce-product-detail">
        <div className="uce-product-detail-grid">
          <div className="uce-product-detail-stat">
            <p className="uce-field-label">Deliverable format</p>
            <p className="uce-field-value">{displayField(brief?.formatType)}</p>
          </div>
          <div className="uce-product-detail-stat">
            <p className="uce-field-label">Platforms</p>
            <p className="uce-field-value">{displayField(brief?.platformsLabel)}</p>
          </div>
          <div className="uce-product-detail-stat">
            <p className="uce-field-label">Creative guidelines</p>
            <p className="uce-field-value">{EMPTY_FIELD}</p>
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
