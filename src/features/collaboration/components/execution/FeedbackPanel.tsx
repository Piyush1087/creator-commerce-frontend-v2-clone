import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { collaborationCapabilities } from "../../utils/collaboration-capabilities";
export function FeedbackPanel({ detail }: { detail: CollaborationDetailResponse }) {
  const feedback = detail.feedback; if (!feedback) return null;
  const capabilities = collaborationCapabilities(detail);
  return <section className="collab-exec-card"><h4>Rate this collaboration</h4>
    {feedback.viewerSubmission ? <p>Feedback submitted · {feedback.viewerSubmission.rating}/5{feedback.viewerSubmission.reviewText ? ` · ${feedback.viewerSubmission.reviewText}` : ""}</p> : capabilities.has("submit-feedback") ? <p>Feedback submission is available.</p> : <p>The feedback window is closed.</p>}
    {feedback.visibility === "REVEALED" ? <div><h5>Shared feedback</h5>{feedback.counterpartSubmission ? <p>{feedback.counterpartSubmission.rating}/5{feedback.counterpartSubmission.reviewText ? ` · ${feedback.counterpartSubmission.reviewText}` : ""}</p> : <p>No counterpart feedback was submitted.</p>}</div> : <p>Your feedback will become visible when the other party submits theirs or when the feedback window closes.</p>}
  </section>;
}
