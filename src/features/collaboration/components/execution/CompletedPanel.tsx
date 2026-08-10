import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { FeedbackPanel } from "./FeedbackPanel";
export function CompletedPanel({ detail }: { detail: CollaborationDetailResponse }) {
  return <><section className="collab-exec-card"><h4>Collaboration completed</h4><p>{detail.lifecycle.completedAt ? new Date(detail.lifecycle.completedAt).toLocaleDateString() : "Completed"}</p><p>{detail.deliverables.length} deliverable{detail.deliverables.length === 1 ? "" : "s"} resolved · Publishing {detail.publishingComplete ? "completed or not required" : "pending"}</p><p>Payment: {detail.settlement.state === "SETTLED" ? "Payment settled" : detail.settlement.state}</p></section><FeedbackPanel detail={detail} /></>;
}
