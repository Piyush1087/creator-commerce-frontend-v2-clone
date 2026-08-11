import type { CollaborationFulfillmentIssue } from "../../contracts/collaboration.contracts";

function formatTimestamp(value: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function FulfillmentIssueHistory({ issues }: { issues: CollaborationFulfillmentIssue[] }) {
  if (!issues.length) return null;
  return <section className="collab-issue-history" aria-labelledby="collab-issue-history-title">
    <h5 id="collab-issue-history-title">Issue history</h5>
    {issues.map((issue) => <details className="collab-issue-card" key={issue.sequence} open={issue.sequence === issues.length}>
      <summary>Issue {issue.sequence}</summary>
      <dl className="collab-facts">
        <div><dt>Description</dt><dd>{issue.description}</dd></div>
        <div><dt>Reported</dt><dd>{formatTimestamp(issue.reportedAt)}</dd></div>
        {issue.evidenceRef ? <div><dt>Evidence reference</dt><dd className="collab-evidence-ref">{issue.evidenceRef}</dd></div> : null}
        {issue.remediationEvidenceRef ? <div><dt>Remediation reference</dt><dd className="collab-evidence-ref">{issue.remediationEvidenceRef}</dd></div> : null}
        {issue.remediationAt ? <div><dt>Remediated</dt><dd>{formatTimestamp(issue.remediationAt)}</dd></div> : null}
      </dl>
    </details>)}
  </section>;
}
