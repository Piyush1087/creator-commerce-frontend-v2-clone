import type { CollaborationPublishingEvidence } from "../../contracts/collaboration.contracts";

function reference(value: string) {
  return /^https?:\/\//i.test(value) ? <a href={value} target="_blank" rel="noreferrer">{value}</a> : value;
}

export function PublishingEvidenceHistory({ evidence }: { evidence: CollaborationPublishingEvidence[] }) {
  if (!evidence.length) return null;
  return <details className="collab-publishing-history"><summary>Publishing evidence history ({evidence.length})</summary><ol>{[...evidence].reverse().map((item, index) => <li className="collab-publishing-evidence" key={item.publishingEvidenceId}><h6>Evidence {item.sequence}{index === 0 ? " · Current" : ""}</h6><dl className="collab-facts"><div><dt>Published content</dt><dd className="collab-evidence-ref">{reference(item.evidenceRef)}</dd></div>{item.platform ? <div><dt>Platform</dt><dd>{item.platform}</dd></div> : null}{item.creatorNote ? <div><dt>Creator note</dt><dd>{item.creatorNote}</dd></div> : null}<div><dt>Submitted</dt><dd>{new Date(item.submittedAt).toLocaleString()}</dd></div>{item.correctionReason ? <div><dt>Correction requested</dt><dd>{item.correctionReason}</dd></div> : null}{item.reviewedAt ? <div><dt>Reviewed</dt><dd>{new Date(item.reviewedAt).toLocaleString()}</dd></div> : null}{item.complianceEvidenceRef ? <div><dt>Compliance reference</dt><dd className="collab-evidence-ref">{reference(item.complianceEvidenceRef)}</dd></div> : null}{item.verifiedAt ? <div><dt>Verified</dt><dd>{new Date(item.verifiedAt).toLocaleString()}</dd></div> : null}</dl></li>)}</ol></details>;
}
