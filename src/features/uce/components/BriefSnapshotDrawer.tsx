import { CheckCircle, XCircle } from "lucide-react";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";

type BriefSnapshotDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  briefTitle?: string;
  formatType?: string;
};

export function BriefSnapshotDrawer({
  isOpen,
  onClose,
  briefTitle = "Summer Skin Routine",
  formatType = "Video Reel",
}: BriefSnapshotDrawerProps) {
  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Strategic Brief Snapshot: ${briefTitle}`}
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
            <p className="uce-field-label">Deliverable Type Target</p>
            <p className="uce-field-value">{formatType}</p>
          </div>
          <div className="uce-product-detail-stat">
            <p className="uce-field-label">Allocated Creator Quota</p>
            <div className="uce-quota-bar-wrap">
              <div className="uce-kv-row">
                <strong>3 / 10 Max</strong>
              </div>
              <div className="uce-quota-bar">
                <div className="uce-quota-bar-fill" style={{ width: "30%" }} />
              </div>
            </div>
          </div>
        </div>

        <section>
          <p className="uce-field-label uce-field-label--block">
            Creative Expectations &amp; Payout Criteria
          </p>
          <textarea
            className="uce-brief-textarea"
            readOnly
            defaultValue="Focus on high-engagement hooks. Morning routines in natural lighting with authentic product integration in the first 3 seconds."
          />
        </section>

        <div className="uce-guidance-box uce-guidance-box--ok">
          <CheckCircle size={18} />
          <span>Enforce standard brand font style variations on all text overlay modules.</span>
        </div>
        <div className="uce-guidance-box uce-guidance-box--bad">
          <XCircle size={18} />
          <span>Do not reference direct competitors in frame or caption.</span>
        </div>

        <p className="uce-brief-lock-hint">
          Editing is locked while active applications exist for this brief.
        </p>
      </div>
    </SideDrawer>
  );
}
