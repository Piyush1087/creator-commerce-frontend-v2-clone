import type { CollaborationSubmissionVersion } from "../../contracts/collaboration.contracts";

export function SubmissionHistory({ versions }: { versions: CollaborationSubmissionVersion[] }) {
  if (!versions.length) return null;
  return <details className="collab-submission-history"><summary>Submission history ({versions.length})</summary><ol>{[...versions].reverse().map((version, index) => <li key={version.submissionVersionId} className="collab-submission-version"><h6>Version {version.versionNumber}{index === 0 ? " · Current" : ""}</h6><dl className="collab-facts"><div><dt>Asset reference</dt><dd className="collab-evidence-ref">{version.assetRef}</dd></div><div><dt>Submitted</dt><dd>{new Date(version.submittedAt).toLocaleString()}</dd></div><div><dt>Review status</dt><dd>{reviewLabel(version.reviewState)}</dd></div>{version.creatorNote ? <div><dt>Creator note</dt><dd>{version.creatorNote}</dd></div> : null}{version.brandFeedback ? <div><dt>Brand feedback</dt><dd>{version.brandFeedback}</dd></div> : null}{version.reviewedAt ? <div><dt>Reviewed</dt><dd>{new Date(version.reviewedAt).toLocaleString()}</dd></div> : null}{version.autoApprovedAt ? <div><dt>Auto-approved</dt><dd>{new Date(version.autoApprovedAt).toLocaleString()}</dd></div> : null}</dl></li>)}</ol></details>;
}
function reviewLabel(state: string): string {
  const labels: Record<string, string> = { UNDER_REVIEW: "Under Brand review", REVISION_REQUESTED: "Revision requested", APPROVED: "Approved by Brand", AUTO_APPROVED: "Auto-approved", FINAL_REJECTED: "Final submission not approved" };
  return labels[state] ?? "Review recorded";
}
