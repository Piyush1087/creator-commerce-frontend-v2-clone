import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, SelectField, TextField } from "../../../../design-system/aurora";
import type { CollaborationDetailResponse, CollaborationFeedbackSubmission } from "../../contracts/collaboration.contracts";
import { collaborationCapabilities } from "../../utils/collaboration-capabilities";

type Props = { detail: CollaborationDetailResponse; busy: boolean; actionError: string | null; onSubmit: (rating: number, reviewText?: string) => void };
const ratingOptions = [1, 2, 3, 4, 5].map((rating) => ({ value: String(rating), label: `${rating} of 5` }));
function FeedbackRecord({ title, submission }: { title: string; submission: CollaborationFeedbackSubmission | null }) {
  return <section className="collab-feedback-record"><h6>{title}</h6>{submission ? <dl className="collab-facts"><div><dt>Rating</dt><dd>{submission.rating} of 5</dd></div>{submission.reviewText ? <div><dt>Review</dt><dd>{submission.reviewText}</dd></div> : null}<div><dt>Submitted</dt><dd>{new Date(submission.submittedAt).toLocaleString()}</dd></div></dl> : <p>No feedback was submitted.</p>}</section>;
}
export function FeedbackPanel({ detail, busy, actionError, onSubmit }: Props) {
  const feedback = detail.feedback; const capabilities = collaborationCapabilities(detail);
  const [rating, setRating] = useState(""); const [reviewText, setReviewText] = useState(""); const [error, setError] = useState<string>();
  useEffect(() => { setRating(""); setReviewText(""); setError(undefined); }, [feedback?.viewerSubmission?.submittedAt]);
  if (!feedback) return null;
  const deadline = new Date(feedback.revealDeadlineAt); const passed = deadline.getTime() <= Date.now();
  const submit = (event: FormEvent) => { event.preventDefault(); const value = Number(rating); if (!Number.isInteger(value) || value < 1 || value > 5) { setError("Choose a rating from 1 to 5."); return; } setError(undefined); onSubmit(value, reviewText.trim() || undefined); };
  const revealed = feedback.visibility === "REVEALED";
  return <section className="collab-exec-card collab-feedback" aria-labelledby="collab-feedback-title"><h5 id="collab-feedback-title">Rate this collaboration</h5><p>Feedback is post-completion activity and does not affect the completed collaboration.</p>
    {feedback.viewerSubmission ? <FeedbackRecord title="Your feedback" submission={feedback.viewerSubmission} /> : capabilities.has("submit-feedback") ? <form className="collab-command-form" onSubmit={submit} aria-busy={busy}><SelectField label="Rating" value={rating} options={[{ value: "", label: "Choose a rating" }, ...ratingOptions]} onChange={(event) => { setRating(event.target.value); setError(undefined); }} helperText={error} aria-invalid={Boolean(error)} disabled={busy} /><TextField label="Review (optional)" multiline value={reviewText} onChange={(event) => setReviewText(event.target.value)} disabled={busy} />{actionError ? <p className="collab-form-error" role="alert">{actionError}</p> : null}<Button type="submit" disabled={busy} fullWidthOnMobile>{busy ? "Submitting…" : "Submit feedback"}</Button></form> : <p>The feedback submission window is closed.</p>}
    {!revealed ? <Alert tone="warning" title={passed ? "Updating feedback status" : "Feedback remains private"}>Your feedback is private until both sides submit or the feedback window closes. Feedback will be revealed by {deadline.toLocaleString()}.{feedback.counterpartSubmitted ? " The other side has submitted feedback." : ""}</Alert> : <section className="collab-feedback-revealed" aria-label="Revealed feedback"><h6>Shared feedback</h6><FeedbackRecord title="Brand feedback" submission={feedback.revealedSubmissions?.brand ?? null} /><FeedbackRecord title="Creator feedback" submission={feedback.revealedSubmissions?.creator ?? null} />{feedback.revealedAt ? <p>Revealed {new Date(feedback.revealedAt).toLocaleString()}</p> : null}</section>}
  </section>;
}
