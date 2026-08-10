import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { actionRequiredLabel } from "../../utils/stage-labels";
export function BlockingCard({ detail }: { detail: CollaborationDetailResponse }) {
  if (!detail.blocking && detail.workflow.status !== "BLOCKED") return null;
  return <section className="collab-exec-card collab-blocking" role="status">
    <h4>{detail.workflow.actionRequiredBy === "ADMIN" || detail.workflow.actionRequiredBy === "SYSTEM" ? "Under review" : "Action required"}</h4>
    <p>{detail.blocking?.reason ?? "This workflow is blocked while the required issue is resolved."}</p>
    <p>{actionRequiredLabel(detail.workflow.actionRequiredBy)}</p>
  </section>;
}
