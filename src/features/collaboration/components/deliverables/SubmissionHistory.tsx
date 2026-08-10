import type { CollaborationSubmissionVersion } from "../../contracts/collaboration.contracts";
export function SubmissionHistory({ versions }: { versions: CollaborationSubmissionVersion[] }) {
  if (versions.length < 2) return null;
  return <details><summary>Submission history ({versions.length})</summary><ol>{[...versions].reverse().map((version) => <li key={version.submissionVersionId}>Version {version.versionNumber} · {new Date(version.submittedAt).toLocaleString()} · {version.reviewState}</li>)}</ol></details>;
}
