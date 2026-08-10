import { Alert, Button } from "../../../../design-system/aurora";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { collaborationCapabilities } from "../../utils/collaboration-capabilities";
export function NegotiationPanel({ detail, busy, onAction }: { detail: CollaborationDetailResponse; busy: boolean; onAction: (action: "accept-proposal" | "accept-counter" | "decline-negotiation") => void }) {
  const capabilities = collaborationCapabilities(detail); const commercial = detail.commercial;
  return <section className="collab-exec-card"><h4>Negotiation</h4><p>{commercial?.currency ?? ""} {commercial?.brandCounterFee ?? commercial?.applicationProposedFee ?? "—"}</p><p>The Brand may accept the proposal or make one counter-offer.</p>
    {capabilities.has("accept-proposal") ? <Button disabled={busy} onClick={() => onAction("accept-proposal")}>Accept proposal</Button> : null}
    {capabilities.has("accept-counter") ? <Button disabled={busy} onClick={() => onAction("accept-counter")}>Accept</Button> : null}
    {capabilities.has("decline-negotiation") ? <Button variant="secondary" disabled={busy} onClick={() => onAction("decline-negotiation")}>Decline</Button> : null}
    {!capabilities.has("accept-proposal") && !capabilities.has("accept-counter") ? <Alert tone="warning" title="Negotiation">{detail.workflow.actionRequiredBy === "BRAND" ? "Waiting for the Brand." : "Waiting for the Creator."}</Alert> : null}
  </section>;
}
