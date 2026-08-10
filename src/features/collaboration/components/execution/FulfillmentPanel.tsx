import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { collaborationCapabilities } from "../../utils/collaboration-capabilities";
export function FulfillmentPanel({ detail }: { detail: CollaborationDetailResponse }) {
  const capabilities = collaborationCapabilities(detail); const fulfillment = detail.fulfillment;
  return <section className="collab-exec-card"><h4>Fulfillment</h4><p>{fulfillment?.brandSupportType ?? "No Brand-provided fulfillment required"}</p><p>{fulfillment?.state ?? "Skipped"}</p>
    {capabilities.has("provide-fulfillment") ? <p>Brand action available: provide fulfillment evidence.</p> : null}
    {capabilities.has("confirm-fulfillment") ? <p>Creator action available: confirm fulfillment.</p> : null}
    {capabilities.has("remediate-fulfillment") ? <p>One remediation attempt remains.</p> : null}
  </section>;
}
