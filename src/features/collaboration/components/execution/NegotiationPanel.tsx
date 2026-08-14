import { useEffect, useState } from "react";
import { Alert, Button, TextField } from "../../../../design-system/aurora";
import type { UserRole } from "../../../../shared/auth/user-role";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { collaborationCapabilities } from "../../utils/collaboration-capabilities";
import { formatCommercialAmount } from "../../utils/collaboration-commercial-display";

export type NegotiationAction = "accept-proposal" | "accept-counter" | "decline-negotiation" | "end";
type Props = { detail: CollaborationDetailResponse; role: UserRole; busyAction: string | null; onAction: (action: NegotiationAction) => void; onCounter: (amount: number) => void };

export function NegotiationPanel({ detail, role, busyAction, onAction, onCounter }: Props) {
  const [counter, setCounter] = useState("");
  const [counterError, setCounterError] = useState<string | undefined>();
  const capabilities = collaborationCapabilities(detail);
  const commercial = detail.commercial;
  const state = commercial?.negotiationState;
  const isBrand = role === "BRAND";
  const amount = state === "AWAITING_CREATOR_DECISION" ? commercial?.brandCounterFee : commercial?.agreedCreatorFee ?? commercial?.applicationProposedFee;

  useEffect(() => { setCounter(""); setCounterError(undefined); }, [detail.workflow.aggregateVersion]);

  const submitCounter = () => {
    const value = Number(counter);
    if (!counter.trim() || !Number.isFinite(value) || value < 0) { setCounterError("Enter a valid amount of zero or more."); return; }
    setCounterError(undefined); onCounter(value);
  };
  const waitingCopy = state === "AWAITING_BRAND_DECISION"
    ? isBrand ? "Review the Creator proposal and accept it or make one counter-offer." : "Your proposal was sent. Waiting for the Brand to accept or counter."
    : state === "AWAITING_CREATOR_DECISION"
      ? isBrand ? "Counter-offer sent. Waiting for the Creator." : "Review the Brand counter-offer. You can accept or decline."
      : "Commercial terms are confirmed.";
  const askToEnd = () => {
    if (window.confirm("Are you sure you want to end this collaboration?")) onAction("end");
  };

  return <section className="collab-exec-card" aria-labelledby="collab-negotiation-title">
    <h4 id="collab-negotiation-title">Negotiation</h4>
    <dl className="collab-facts">
      <div><dt>{state === "AWAITING_CREATOR_DECISION" ? "Brand counter-offer" : "Creator proposed fee"}</dt><dd>{formatCommercialAmount(amount, commercial?.currency)}</dd></div>
      <div><dt>Commercial terms</dt><dd>{state === "NOT_REQUIRED" ? "Fixed" : "Negotiable"}</dd></div>
      {commercial?.advancePercentage != null ? <div><dt>Advance protection</dt><dd>{commercial.advancePercentage}%</dd></div> : null}
    </dl>
    <p>{waitingCopy}</p>
    {state === "NOT_REQUIRED" || state === "LOCKED" ? <Alert tone="success" title="Terms confirmed">No negotiation action is required.</Alert> : null}
    <div className="collab-exec-actions" aria-busy={busyAction !== null}>
      {capabilities.has("accept-proposal") ? <Button disabled={busyAction !== null} onClick={() => onAction("accept-proposal")} fullWidthOnMobile>{busyAction === "accept-proposal" ? "Accepting…" : "Accept proposal"}</Button> : null}
      {capabilities.has("counter") ? <div className="collab-command-form">
        <TextField label={`Counter-offer (${commercial?.currency ?? "currency"})`} type="number" min="0" step="0.01" inputMode="decimal" value={counter} error={counterError} helperText="The Creator can accept or decline this one counter-offer." disabled={busyAction !== null} onChange={(event) => { setCounter(event.target.value); setCounterError(undefined); }} />
        <Button variant="secondary" disabled={busyAction !== null} onClick={submitCounter} fullWidthOnMobile>{busyAction === "counter" ? "Sending…" : "Send counter-offer"}</Button>
      </div> : null}
      {capabilities.has("accept-counter") ? <Button disabled={busyAction !== null} onClick={() => onAction("accept-counter")} fullWidthOnMobile>{busyAction === "accept-counter" ? "Accepting…" : "Accept"}</Button> : null}
      {capabilities.has("decline-negotiation") ? <Button variant="secondary" disabled={busyAction !== null} onClick={() => onAction("decline-negotiation")} fullWidthOnMobile>{busyAction === "decline-negotiation" ? "Declining…" : isBrand ? "Decline proposal" : "Decline"}</Button> : null}
      {isBrand && capabilities.has("end") ? <Button variant="secondary" disabled={busyAction !== null} onClick={askToEnd} fullWidthOnMobile>{busyAction === "end" ? "Ending…" : "End collaboration"}</Button> : null}
    </div>
  </section>;
}
