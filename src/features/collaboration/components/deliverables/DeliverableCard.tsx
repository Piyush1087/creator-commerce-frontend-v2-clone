import type { CollaborationDeliverable } from "../../contracts/collaboration.contracts";
import { deliverableHasCapability } from "../../utils/collaboration-capabilities";
import { SubmissionHistory } from "./SubmissionHistory";
export function DeliverableCard({ deliverable }: { deliverable: CollaborationDeliverable }) {
  const definition = deliverable.definitionSnapshot;
  const title = typeof definition.title === "string" ? definition.title : `Deliverable ${deliverable.displayOrder}`;
  return <article className="collab-exec-card collab-deliverable"><h5>{title}</h5>
    <p><strong>{deliverable.state === "APPROVED" ? "Approved by Brand" : deliverable.state === "AUTO_APPROVED" ? "Auto-approved" : deliverable.state.replaceAll("_", " ")}</strong></p>
    {deliverable.state === "AUTO_APPROVED" ? <p>The Brand review window expired without a response.</p> : null}
    {deliverable.latestSubmissionVersion ? <><p>Version {deliverable.latestSubmissionVersion.versionNumber} · Asset reference: {deliverable.latestSubmissionVersion.assetRef}</p><p>Review deadline: {new Date(deliverable.latestSubmissionVersion.reviewDeadlineAt).toLocaleString()}</p>{deliverable.latestSubmissionVersion.brandFeedback ? <p>Brand feedback: {deliverable.latestSubmissionVersion.brandFeedback}</p> : null}</> : <p>No submission yet.</p>}
    <p>{deliverable.revisionsRemaining} revision{deliverable.revisionsRemaining === 1 ? "" : "s"} remaining</p>
    {deliverableHasCapability(deliverable, "submit-deliverable") ? <p>Creator action available: submit content.</p> : null}
    {deliverableHasCapability(deliverable, "approve-deliverable") ? <p>Brand review actions available.</p> : null}
    <SubmissionHistory versions={deliverable.submissionVersions} />
  </article>;
}
