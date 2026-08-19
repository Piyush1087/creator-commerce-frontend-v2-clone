import { useEffect, useState, type FormEvent } from "react";
import { FileVideo2 } from "lucide-react";
import { Alert, Button, TextField } from "../../../../design-system/aurora";
import type { UserRole } from "../../../../shared/auth/user-role";
import type { CollaborationDeliverable } from "../../contracts/collaboration.contracts";
import { deliverableHasCapability } from "../../utils/collaboration-capabilities";
import { actionRequiredLabel } from "../../utils/stage-labels";
import { RevisionRequestForm } from "./RevisionRequestForm";
import { SubmissionHistory } from "./SubmissionHistory";

type Props = { deliverable: CollaborationDeliverable; role: UserRole; busyAction: string | null; onSubmit: (deliverableId: string, assetRef: string, creatorNote?: string) => void; onApprove: (deliverableId: string, versionId: string) => void; onRequestRevision: (deliverableId: string, versionId: string, feedback: string) => void; onRejectFinal: (deliverableId: string, versionId: string, feedback: string) => void };
const stateLabel: Record<CollaborationDeliverable["state"], string> = { AWAITING_SUBMISSION: "Waiting for content", UNDER_REVIEW: "Under Brand review", REVISION_REQUESTED: "Revision requested", APPROVED: "Approved by Brand", AUTO_APPROVED: "Auto-approved", HARD_STOP: "Final submission not approved" };

function remaining(deadline: string): string {
  const milliseconds = new Date(deadline).getTime() - Date.now();
  if (milliseconds <= 0) return "Review window ended — updating status";
  const hours = Math.ceil(milliseconds / 3_600_000);
  return hours > 24 ? `${Math.ceil(hours / 24)} days remaining in the review window` : `${hours} hours remaining in the review window`;
}

export function DeliverableCard({ deliverable, role, busyAction, onSubmit, onApprove, onRequestRevision, onRejectFinal }: Props) {
  const definition = deliverable.definitionSnapshot;
  const title = typeof definition.title === "string" ? definition.title : `Deliverable ${deliverable.displayOrder}`;
  const latest = deliverable.latestSubmissionVersion;
  const activeVersionId = deliverable.activeSubmissionVersionId;
  const [assetRef, setAssetRef] = useState("");
  const [creatorNote, setCreatorNote] = useState("");
  const [submissionError, setSubmissionError] = useState<string>();
  const [rejectionFeedback, setRejectionFeedback] = useState("");
  const [rejectionError, setRejectionError] = useState<string>();
  useEffect(() => { setAssetRef(""); setCreatorNote(""); setSubmissionError(undefined); setRejectionFeedback(""); setRejectionError(undefined); }, [latest?.submissionVersionId]);
  const key = (action: string, versionId?: string) => `${action}:${deliverable.deliverableExecutionId}${versionId ? `:${versionId}` : ""}`;
  const deliverableBusy = busyAction?.includes(`:${deliverable.deliverableExecutionId}`) ?? false;
  const canSubmit = deliverableHasCapability(deliverable, "submit-deliverable");
  const canApprove = deliverableHasCapability(deliverable, "approve-deliverable");
  const canRequestRevision = deliverableHasCapability(deliverable, "request-revision");
  const canRejectFinal = deliverableHasCapability(deliverable, "reject-final");
  const isActionable = canSubmit || canApprove || canRequestRevision || canRejectFinal;
  const submit = (event: FormEvent) => { event.preventDefault(); if (!assetRef.trim()) { setSubmissionError("Add an asset reference."); return; } setSubmissionError(undefined); onSubmit(deliverable.deliverableExecutionId, assetRef.trim(), creatorNote.trim() || undefined); };
  const reject = (event: FormEvent) => { event.preventDefault(); const feedback = rejectionFeedback.trim(); if (feedback.length < 3) { setRejectionError("Explain why the final submission was not approved."); return; } if (window.confirm("End this collaboration because the final permitted submission was not approved? The outcome will be determined by the collaboration terms.")) onRejectFinal(deliverable.deliverableExecutionId, activeVersionId!, feedback); };

  return <article className={`collab-exec-card collab-deliverable${isActionable ? " collab-deliverable--actionable" : ""}`} aria-labelledby={`deliverable-${deliverable.deliverableExecutionId}`}>
    <header className="collab-deliverable__header">
      <span className="collab-deliverable__icon" aria-hidden="true"><FileVideo2 size={18} /></span>
      <div className="collab-deliverable__identity">
        <p className="collab-deliverable__eyebrow">Deliverable {deliverable.displayOrder}</p>
        <h5 id={`deliverable-${deliverable.deliverableExecutionId}`}>{title}</h5>
      </div>
      <div className="collab-deliverable__statuses">
        {isActionable ? <span className="collab-action-needed">Action needed</span> : null}
        <strong className={`collab-status-pill collab-status-pill--${deliverable.state.toLowerCase().replace(/_/g, "-")}`} role="status">{stateLabel[deliverable.state]}</strong>
      </div>
    </header>
    <dl className="collab-deliverable__summary">
      <div><dt>Next actor</dt><dd>{actionRequiredLabel(deliverable.actionRequiredBy)}</dd></div>
      <div><dt>Current version</dt><dd>{latest ? `Version ${latest.versionNumber}` : "No submission yet"}</dd></div>
      <div><dt>Revisions</dt><dd>{deliverable.revisionRequestCount} of 2 used · {deliverable.revisionsRemaining} remaining</dd></div>
      <div><dt>Latest activity</dt><dd>{latest ? new Date(latest.submittedAt).toLocaleString() : "Awaiting initial submission"}</dd></div>
    </dl>
    {latest ? <dl className="collab-facts collab-facts--stage"><div><dt>Asset reference</dt><dd className="collab-evidence-ref">{latest.assetRef}</dd></div>{latest.creatorNote ? <div><dt>Creator note</dt><dd>{latest.creatorNote}</dd></div> : null}{latest.brandFeedback ? <div><dt>Brand feedback</dt><dd>{latest.brandFeedback}</dd></div> : null}{deliverable.state === "UNDER_REVIEW" ? <div><dt>Review deadline</dt><dd>{new Date(latest.reviewDeadlineAt).toLocaleString()}<br />{role === "CREATOR" ? remaining(latest.reviewDeadlineAt) : "The Brand review window is 72 hours."}</dd></div> : null}</dl> : <div className="collab-deliverable__empty"><strong>Initial submission</strong><span>No content has been submitted for this deliverable.</span></div>}
    {deliverable.state === "AUTO_APPROVED" ? <Alert tone="warning" title="Auto-approved">The Brand review window expired without a response.{deliverable.publishingRequired && deliverable.publishing?.authorizationState === "NOT_AUTHORIZED" ? " Waiting for the Brand publishing decision. Do not publish unless the Brand explicitly authorizes publication." : ""}</Alert> : null}
    {deliverable.state === "APPROVED" && deliverable.publishingRequired && deliverable.publishing?.authorizationState === "AUTHORIZED" ? <Alert tone="success" title="Approved for publishing">The Brand explicitly approved this deliverable for publishing.</Alert> : null}
    {canSubmit ? <form className="collab-command-form collab-deliverable__command" onSubmit={submit} aria-busy={busyAction === key("submit")}><h6>{deliverable.state === "REVISION_REQUESTED" ? deliverable.revisionRequestCount === 2 ? "Submit final revision" : "Submit revised content" : "Submit content"}</h6>{deliverable.state === "REVISION_REQUESTED" && latest?.brandFeedback ? <p><strong>Brand feedback:</strong> {latest.brandFeedback}</p> : null}<TextField label="Asset reference" value={assetRef} onChange={(event) => { setAssetRef(event.target.value); setSubmissionError(undefined); }} error={submissionError} disabled={deliverableBusy} /><TextField label="Creator note (optional)" multiline value={creatorNote} onChange={(event) => setCreatorNote(event.target.value)} disabled={deliverableBusy} /><Button type="submit" disabled={deliverableBusy} fullWidthOnMobile>{busyAction === key("submit") ? "Submitting…" : "Submit for review"}</Button></form> : null}
    {(canApprove || canRequestRevision) && activeVersionId ? <section className="collab-deliverable__review" aria-labelledby={`review-${deliverable.deliverableExecutionId}`}><div><h6 id={`review-${deliverable.deliverableExecutionId}`}>Review submission</h6><p>Approve this version or request the next permitted revision.</p></div>{canApprove ? <div className="collab-exec-actions" aria-busy={busyAction === key("approve", activeVersionId)}><Button disabled={deliverableBusy} onClick={() => onApprove(deliverable.deliverableExecutionId, activeVersionId)} fullWidthOnMobile>{busyAction === key("approve", activeVersionId) ? "Approving…" : "Approve submission"}</Button></div> : null}{canRequestRevision ? <RevisionRequestForm revisionNumber={deliverable.revisionRequestCount + 1} busy={deliverableBusy} onSubmit={(feedback) => onRequestRevision(deliverable.deliverableExecutionId, activeVersionId, feedback)} /> : null}</section> : null}
    {canRejectFinal && activeVersionId ? <form className="collab-command-form collab-final-review collab-deliverable__command" onSubmit={reject} aria-busy={busyAction === key("reject", activeVersionId)}><h6>Final review</h6><p>No further revision can be requested. Approve the submission or explain why it cannot be accepted.</p><TextField label="Final review feedback" multiline value={rejectionFeedback} onChange={(event) => { setRejectionFeedback(event.target.value); setRejectionError(undefined); }} error={rejectionError} disabled={deliverableBusy} /><Button type="submit" variant="secondary" disabled={deliverableBusy} fullWidthOnMobile>{busyAction === key("reject", activeVersionId) ? "Ending…" : "Reject final submission"}</Button></form> : null}
    <SubmissionHistory versions={deliverable.submissionVersions} />
  </article>;
}
