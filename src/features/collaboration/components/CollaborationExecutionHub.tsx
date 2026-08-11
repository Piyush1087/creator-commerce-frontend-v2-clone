import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import type { UserRole } from "../../../shared/auth/user-role";
import { acceptCounterOffer, acceptProposedFee, approveDeliverable, CollaborationCommandError, confirmFulfillment, counterOffer, declineNegotiation, endCollaborationByBrand, envelope, provideFulfillment, provideFulfillmentRemediation, rejectFinalDeliverable, reportFulfillmentIssue, requestDeliverableRevision, requestEscrowFunding, submitDeliverable, type ProvideFulfillmentPayload, type ReportFulfillmentIssuePayload } from "../api/collaboration-client";
import type { CollaborationDetailResponse } from "../contracts/collaboration.contracts";
import { collaborationLifecycleLabel, collaborationStageLabel, actionRequiredLabel } from "../utils/stage-labels";
import { BlockingCard } from "./execution/BlockingCard";
import { CompletedPanel } from "./execution/CompletedPanel";
import { FulfillmentPanel } from "./execution/FulfillmentPanel";
import { NegotiationPanel, type NegotiationAction } from "./execution/NegotiationPanel";
import { ProductionPanel } from "./execution/ProductionPanel";
import { PublishingSettlementPanel } from "./execution/PublishingSettlementPanel";
import { ResolutionCard } from "./execution/ResolutionCard";
import { SecurementPanel } from "./execution/SecurementPanel";

type Props = { role: UserRole; detail: CollaborationDetailResponse | null; collaborationId: string | null; onRefresh: () => Promise<void>; onDetailUpdated: (detail: CollaborationDetailResponse) => void; onError: (message: string) => void; onStale?: () => void };

export function CollaborationExecutionHub({ role, detail, collaborationId, onRefresh, onDetailUpdated, onError, onStale }: Props) {
  const navigate = useNavigate();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  if (!collaborationId || !detail) return <div className="collab-empty">Select a thread to view execution actions.</div>;

  const run = async (actionKey: string, action: () => Promise<CollaborationDetailResponse>) => {
    setBusyAction(actionKey); setActionError(null); onError("");
    try { onDetailUpdated(await action()); await onRefresh(); }
    catch (error) {
      if (error instanceof CollaborationCommandError && error.stale) {
        setActionError(null); onStale?.(); await onRefresh();
      } else {
        const message = error instanceof Error ? error.message : "Action failed.";
        setActionError(message);
      }
    } finally { setBusyAction(null); }
  };
  const commandEnvelope = () => envelope(detail.workflow.aggregateVersion);
  const negotiationAction = (action: NegotiationAction) => {
    if (action === "accept-proposal") return run(action, () => acceptProposedFee(collaborationId, commandEnvelope()));
    if (action === "accept-counter") return run(action, () => acceptCounterOffer(collaborationId, commandEnvelope()));
    if (action === "end") return run(action, () => endCollaborationByBrand(collaborationId, commandEnvelope()));
    return run(action, () => declineNegotiation(collaborationId, commandEnvelope(), role === "BRAND" ? "BRAND_DECLINED" : "CREATOR_DECLINED"));
  };

  let panel: JSX.Element;
  switch (detail.workflow.stage) {
    case "NEGOTIATION": panel = <NegotiationPanel detail={detail} role={role} busyAction={busyAction} onCounter={(amount) => void run("counter", () => counterOffer(collaborationId, commandEnvelope(), amount))} onAction={(action) => void negotiationAction(action)} />; break;
    case "SECUREMENT": panel = <SecurementPanel detail={detail} role={role} busyAction={busyAction} onFund={() => void run("fund-escrow", () => requestEscrowFunding(collaborationId, commandEnvelope()))} onManagePayoutDetails={() => navigate(AUTH_ROUTES.creatorSettingsPayouts)} />; break;
    case "FULFILLMENT": panel = <FulfillmentPanel detail={detail} role={role} busyAction={busyAction} onProvide={(payload: ProvideFulfillmentPayload) => void run("provide-fulfillment", () => provideFulfillment(collaborationId, commandEnvelope(), payload))} onConfirm={() => void run("confirm-fulfillment", () => confirmFulfillment(collaborationId, commandEnvelope()))} onReportIssue={(payload: ReportFulfillmentIssuePayload) => void run("report-fulfillment-issue", () => reportFulfillmentIssue(collaborationId, commandEnvelope(), payload))} onRemediate={(evidenceRef) => void run("remediate-fulfillment", () => provideFulfillmentRemediation(collaborationId, commandEnvelope(), evidenceRef))} />; break;
    case "PRODUCTION": panel = <ProductionPanel detail={detail} role={role} busyAction={busyAction}
      onSubmit={(deliverableExecutionId, assetRef, creatorNote) => void run(`submit:${deliverableExecutionId}`, () => submitDeliverable(collaborationId, commandEnvelope(), { deliverableExecutionId, assetRef, creatorNote }))}
      onApprove={(deliverableExecutionId, submissionVersionId) => void run(`approve:${deliverableExecutionId}:${submissionVersionId}`, () => approveDeliverable(collaborationId, commandEnvelope(), deliverableExecutionId, submissionVersionId))}
      onRequestRevision={(deliverableExecutionId, submissionVersionId, brandFeedback) => void run(`revision:${deliverableExecutionId}:${submissionVersionId}`, () => requestDeliverableRevision(collaborationId, commandEnvelope(), { deliverableExecutionId, submissionVersionId, brandFeedback }))}
      onRejectFinal={(deliverableExecutionId, submissionVersionId, brandFeedback) => void run(`reject:${deliverableExecutionId}:${submissionVersionId}`, () => rejectFinalDeliverable(collaborationId, commandEnvelope(), { deliverableExecutionId, submissionVersionId, brandFeedback }))}
    />; break;
    case "PUBLISHING_SETTLEMENT": panel = <PublishingSettlementPanel detail={detail} />; break;
  }

  const terminal = detail.lifecycle.state === "CANCELLED" || detail.lifecycle.state === "TERMINATED";
  return <div className="collab-pane__scroll collab-pane__scroll--execution">
    <header className="collab-exec-card collab-exec-card--summary"><p className="collab-exec-card__kicker">{collaborationLifecycleLabel(detail.lifecycle.state)} · {collaborationStageLabel(detail.workflow.stage)}</p><p>{actionRequiredLabel(detail.workflow.actionRequiredBy)}</p></header>
    {!terminal ? <BlockingCard detail={detail} /> : null}
    {actionError ? <Alert tone="error" title="Action could not be completed">{actionError}</Alert> : null}
    {detail.lifecycle.state === "COMPLETED" ? <CompletedPanel detail={detail} /> : terminal ? <ResolutionCard detail={detail} /> : panel}
  </div>;
}
