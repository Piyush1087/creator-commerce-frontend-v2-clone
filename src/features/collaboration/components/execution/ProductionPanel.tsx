import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { DeliverableCard } from "../deliverables/DeliverableCard";
export function ProductionPanel({ detail }: { detail: CollaborationDetailResponse }) {
  return <section aria-label="Production deliverables"><h4>Production</h4>{detail.deliverables.map((deliverable) => <DeliverableCard key={deliverable.deliverableExecutionId} deliverable={deliverable} />)}</section>;
}
