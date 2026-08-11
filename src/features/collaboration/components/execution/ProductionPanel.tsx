import type { UserRole } from "../../../../shared/auth/user-role";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { DeliverableCard } from "../deliverables/DeliverableCard";

type Props = { detail: CollaborationDetailResponse; role: UserRole; busyAction: string | null; onSubmit: (deliverableId: string, assetRef: string, creatorNote?: string) => void; onApprove: (deliverableId: string, versionId: string) => void; onRequestRevision: (deliverableId: string, versionId: string, feedback: string) => void; onRejectFinal: (deliverableId: string, versionId: string, feedback: string) => void };
export function ProductionPanel({ detail, role, busyAction, onSubmit, onApprove, onRequestRevision, onRejectFinal }: Props) {
  const resolved = detail.deliverables.filter((item) => item.state === "APPROVED" || item.state === "AUTO_APPROVED").length;
  return <section aria-label="Production deliverables" className="collab-production"><header><h4>Production</h4><p>{resolved} of {detail.deliverables.length} deliverables approved</p></header>{detail.deliverables.map((deliverable) => <DeliverableCard key={deliverable.deliverableExecutionId} deliverable={deliverable} role={role} busyAction={busyAction} onSubmit={onSubmit} onApprove={onApprove} onRequestRevision={onRequestRevision} onRejectFinal={onRejectFinal} />)}</section>;
}
