import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
export function PublishingSettlementPanel({ detail }: { detail: CollaborationDetailResponse }) {
  return <section><h4>Publishing &amp; Settlement</h4>
    {detail.deliverables.map((item) => <article className="collab-exec-card" key={item.deliverableExecutionId}><h5>Deliverable {item.displayOrder}</h5>
      {!item.publishingRequired || item.publishing?.state === "PUBLISHING_NOT_REQUIRED" ? <p>Publishing not required</p> : null}
      {item.state === "AUTO_APPROVED" && item.publishing?.authorizationState === "NOT_AUTHORIZED" ? <p><strong>Publishing not authorized.</strong> Production is complete; do not publish unless the Brand explicitly approves publication.</p> : null}
      {item.publishing ? <p>Publishing: {item.publishing.state}</p> : null}
      {item.publishing?.activeEvidence ? <p>Evidence: {item.publishing.activeEvidence.evidenceRef}</p> : null}
    </article>)}
    <article className="collab-exec-card"><h5>Payment</h5><p>{detail.settlement.state === "ELIGIBLE" ? "Ready for settlement" : detail.settlement.state === "PROCESSING" ? "Payment processing" : detail.settlement.state === "SETTLED" ? "Payment settled" : "Not yet eligible"}</p><p>Publishing verification and money movement are tracked separately.</p></article>
  </section>;
}
