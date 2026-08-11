import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import type { CollaborationActor } from "../../contracts/collaboration.contracts";
import { actionRequiredLabel } from "../../utils/stage-labels";
export function BlockingCard({ detail, reason, actionRequiredBy }: { detail: CollaborationDetailResponse; reason?: string | null; actionRequiredBy?: CollaborationActor }) {
  if (!reason && !detail.blocking && detail.workflow.status !== "BLOCKED") return null;
  const owner = actionRequiredBy ?? detail.workflow.actionRequiredBy;
  return <section className="collab-exec-card collab-blocking" role="status">
    <h4>{owner === "ADMIN" || owner === "SYSTEM" ? "Under review" : "Action required"}</h4>
    <p>{reason ?? detail.blocking?.reason ?? "This workflow is blocked while the required issue is resolved."}</p>
    <p>{actionRequiredLabel(owner)}</p>
  </section>;
}
