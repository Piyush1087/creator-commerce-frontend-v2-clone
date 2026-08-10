import { useState } from "react";
import type { UserRole } from "../../../shared/auth/user-role";
import { acceptCounterOffer, acceptProposedFee, CollaborationCommandError, declineNegotiation, envelope, requestEscrowFunding } from "../api/collaboration-client";
import type { CollaborationDetailResponse } from "../contracts/collaboration.contracts";
import { collaborationLifecycleLabel, collaborationStageLabel, actionRequiredLabel } from "../utils/stage-labels";
import { BlockingCard } from "./execution/BlockingCard";
import { CompletedPanel } from "./execution/CompletedPanel";
import { FulfillmentPanel } from "./execution/FulfillmentPanel";
import { NegotiationPanel } from "./execution/NegotiationPanel";
import { ProductionPanel } from "./execution/ProductionPanel";
import { PublishingSettlementPanel } from "./execution/PublishingSettlementPanel";
import { ResolutionCard } from "./execution/ResolutionCard";
import { SecurementPanel } from "./execution/SecurementPanel";

type Props = { role: UserRole; detail: CollaborationDetailResponse | null; collaborationId: string | null; onRefresh: () => void; onDetailUpdated: (detail: CollaborationDetailResponse) => void; onError: (message: string) => void; onStale?: () => void };

export function CollaborationExecutionHub({ detail, collaborationId, onRefresh, onDetailUpdated, onError, onStale }: Props) {
  const [busy, setBusy] = useState(false);
  if (!collaborationId || !detail) return <div className="collab-empty">Select a thread to view execution actions.</div>;

  const run = async (action: () => Promise<CollaborationDetailResponse>) => {
    setBusy(true); onError("");
    try { onDetailUpdated(await action()); onRefresh(); }
    catch (error) {
      if (error instanceof CollaborationCommandError && error.stale) { onError("This collaboration changed. We refreshed the latest state."); onStale?.(); onRefresh(); }
      else onError(error instanceof Error ? error.message : "Action failed.");
    } finally { setBusy(false); }
  };
  const commandEnvelope = () => envelope(detail.workflow.aggregateVersion);

  let panel: JSX.Element;
  switch (detail.workflow.stage) {
    case "NEGOTIATION": panel = <NegotiationPanel detail={detail} busy={busy} onAction={(action) => void run(() => action === "accept-proposal" ? acceptProposedFee(collaborationId, commandEnvelope()) : action === "accept-counter" ? acceptCounterOffer(collaborationId, commandEnvelope()) : declineNegotiation(collaborationId, commandEnvelope()))} />; break;
    case "SECUREMENT": panel = <SecurementPanel detail={detail} busy={busy} onFund={() => void run(() => requestEscrowFunding(collaborationId, commandEnvelope()))} />; break;
    case "FULFILLMENT": panel = <FulfillmentPanel detail={detail} />; break;
    case "PRODUCTION": panel = <ProductionPanel detail={detail} />; break;
    case "PUBLISHING_SETTLEMENT": panel = <PublishingSettlementPanel detail={detail} />; break;
  }

  return <div className="collab-pane__scroll collab-pane__scroll--execution">
    <header className="collab-exec-card collab-exec-card--summary"><p className="collab-exec-card__kicker">{collaborationLifecycleLabel(detail.lifecycle.state)} · {collaborationStageLabel(detail.workflow.stage)}</p><p>{actionRequiredLabel(detail.workflow.actionRequiredBy)}</p></header>
    <BlockingCard detail={detail} />
    {detail.lifecycle.state === "COMPLETED" ? <CompletedPanel detail={detail} /> : detail.lifecycle.state === "CANCELLED" || detail.lifecycle.state === "TERMINATED" ? <ResolutionCard detail={detail} /> : panel}
  </div>;
}
