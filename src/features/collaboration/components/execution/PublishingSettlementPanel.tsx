import { BadgeCheck } from "lucide-react";
import type { UserRole } from "../../../../shared/auth/user-role";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { PublishingDeliverableCard } from "../publishing/PublishingDeliverableCard";
import { SettlementCard } from "../publishing/SettlementCard";

type Props = { detail: CollaborationDetailResponse; role: UserRole; busyAction: string | null; onAuthorize: (deliverableId: string) => void; onDecline: (deliverableId: string) => void; onSubmitEvidence: (deliverableId: string, evidenceRef: string, platform?: string, creatorNote?: string) => void; onSubmitCorrection: (deliverableId: string, evidenceRef: string, platform?: string, creatorNote?: string) => void; onVerify: (deliverableId: string, evidenceId: string, complianceEvidenceRef?: string) => void; onRequestCorrection: (deliverableId: string, evidenceId: string, reason: string) => void };

export function PublishingSettlementPanel(props: Props) {
  const complete = props.detail.deliverables.filter((item) => !item.publishingRequired || item.publishing?.state === "PUBLISHING_NOT_REQUIRED" || item.publishing?.state === "COMPLIANCE_VERIFIED").length;
  return (
    <section className="collab-publishing" aria-label="Publishing and settlement">
      <header className="collab-stage-collection__header">
        <span className="collab-stage-card__icon" aria-hidden="true"><BadgeCheck size={19} /></span>
        <div>
          <p className="collab-stage-card__eyebrow">Publishing</p>
          <h4>Publishing requirements</h4>
          <p>Authorization, evidence, and compliance are tracked per deliverable.</p>
        </div>
        <span className="collab-stage-collection__count">{complete} of {props.detail.deliverables.length} complete</span>
      </header>
      <div className="collab-stage-collection__list">
        {props.detail.deliverables.map((item) => <PublishingDeliverableCard key={item.deliverableExecutionId} detail={props.detail} deliverable={item} role={props.role} busyAction={props.busyAction} onAuthorize={props.onAuthorize} onDecline={props.onDecline} onSubmitEvidence={props.onSubmitEvidence} onSubmitCorrection={props.onSubmitCorrection} onVerify={props.onVerify} onRequestCorrection={props.onRequestCorrection} />)}
      </div>
      <SettlementCard detail={props.detail} />
    </section>
  );
}
