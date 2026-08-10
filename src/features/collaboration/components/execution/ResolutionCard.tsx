import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
export function ResolutionCard({ detail }: { detail: CollaborationDetailResponse }) {
  const resolution = detail.resolution;
  return <section className="collab-exec-card collab-resolution" aria-label="Collaboration resolution">
    <h4>Collaboration {detail.lifecycle.state === "CANCELLED" ? "cancelled" : "ended"}</h4>
    <p>{detail.lifecycle.endedReason?.text ?? "This collaboration is no longer in active execution."}</p>
    {resolution ? <dl className="collab-facts">
      <div><dt>Creator entitlement</dt><dd>{resolution.currency ?? ""} {resolution.creatorGrossEntitlementAmount ?? resolution.creatorEntitlementAmount ?? 0}</dd></div>
      <div><dt>Brand refund</dt><dd>{resolution.currency ?? ""} {resolution.brandCommercialRefundEntitlementAmount ?? resolution.brandRefundEntitlementAmount ?? 0}</dd></div>
      <div><dt>Resolution</dt><dd>{resolution.status}</dd></div>
    </dl> : null}
  </section>;
}
