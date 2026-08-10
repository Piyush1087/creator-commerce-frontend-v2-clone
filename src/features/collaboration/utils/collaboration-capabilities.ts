import type { CollaborationAvailableAction, CollaborationDetailResponse, CollaborationDeliverable } from "../contracts/collaboration.contracts";

export type CollaborationCapability =
  | "message" | "accept-proposal" | "counter" | "accept-counter" | "decline-negotiation"
  | "fund-escrow" | "provide-fulfillment" | "confirm-fulfillment" | "report-fulfillment-issue"
  | "remediate-fulfillment" | "submit-deliverable" | "approve-deliverable" | "request-revision"
  | "reject-final" | "authorize-publishing" | "decline-publishing" | "submit-publishing-evidence"
  | "verify-publishing" | "request-publishing-correction" | "submit-corrected-evidence"
  | "end" | "cancel" | "submit-feedback";

const CAPABILITY_BY_ACTION: Record<CollaborationAvailableAction, CollaborationCapability> = {
  PostCollaborationMessage: "message", AcceptProposedFee: "accept-proposal", CounterOffer: "counter",
  AcceptCounterOffer: "accept-counter", DeclineNegotiation: "decline-negotiation",
  RequestEscrowFunding: "fund-escrow", ProvideFulfillment: "provide-fulfillment",
  ConfirmFulfillment: "confirm-fulfillment", ReportFulfillmentIssue: "report-fulfillment-issue",
  ProvideFulfillmentRemediation: "remediate-fulfillment", SubmitDeliverable: "submit-deliverable",
  ApproveDeliverable: "approve-deliverable", RequestDeliverableRevision: "request-revision",
  RejectFinalDeliverable: "reject-final", AuthorizePublishing: "authorize-publishing",
  DeclinePublishing: "decline-publishing", SubmitPublishingEvidence: "submit-publishing-evidence",
  VerifyPublishing: "verify-publishing", RequestPublishingCorrection: "request-publishing-correction",
  SubmitCorrectedPublishingEvidence: "submit-corrected-evidence", EndCollaborationByBrand: "end",
  CancelCollaborationByCreator: "cancel", SubmitCollaborationFeedback: "submit-feedback",
};

export const collaborationCapabilities = (detail: CollaborationDetailResponse): Set<CollaborationCapability> =>
  new Set(detail.workflow.availableActions.map((action) => CAPABILITY_BY_ACTION[action]));

export const deliverableHasCapability = (deliverable: CollaborationDeliverable, capability: CollaborationCapability): boolean =>
  deliverable.availableActions.some((action) => CAPABILITY_BY_ACTION[action] === capability);
