import {
  fetchGatekeeperSupportDestination,
  requestGatekeeperClassificationReview,
  requestGatekeeperOrganizationAccess,
} from "../api/gatekeeper-client";
import type {
  GatekeeperFrontendResult,
  GatekeeperRecoveryAction,
  GatekeeperRecoveryRequestInput,
  GatekeeperRecoveryRequestResponse,
  GatekeeperRecoveryRequestType,
} from "../contracts/gatekeeper.contracts";

export const ORG_ACCESS_REQUEST_RECEIVED_MESSAGE =
  "Your organization access request was submitted and received. This does not grant access.";

export const CLASSIFICATION_REVIEW_REQUEST_RECEIVED_MESSAGE =
  "Your user-initiated classification review request was submitted and received. This does not change the classification.";

type RecoveryRequestClients = {
  REQUEST_ORG_ACCESS: (
    input: GatekeeperRecoveryRequestInput,
  ) => Promise<GatekeeperRecoveryRequestResponse>;
  REQUEST_CLASSIFICATION_REVIEW: (
    input: GatekeeperRecoveryRequestInput,
  ) => Promise<GatekeeperRecoveryRequestResponse>;
};

const recoveryRequestClients: RecoveryRequestClients = {
  REQUEST_ORG_ACCESS: requestGatekeeperOrganizationAccess,
  REQUEST_CLASSIFICATION_REVIEW: requestGatekeeperClassificationReview,
};

export function isGatekeeperRecoveryActionAvailable(
  result: GatekeeperFrontendResult,
  action: GatekeeperRecoveryAction,
): boolean {
  return (
    result.recoveryActions.includes(action) &&
    (action !== "REQUEST_CLASSIFICATION_REVIEW" ||
      result.manualReviewEligible === true)
  );
}

export function visibleGatekeeperRecoveryActions(
  result: GatekeeperFrontendResult,
): GatekeeperRecoveryAction[] {
  return result.recoveryActions.filter((action) =>
    isGatekeeperRecoveryActionAvailable(result, action),
  );
}

export type GatekeeperRecoverySubmissionResult =
  | { status: "NOT_PERMITTED" }
  | { status: "MISSING_CONTEXT" }
  | { status: "ATTESTATION_REQUIRED" }
  | { status: "SUBMITTED"; response: GatekeeperRecoveryRequestResponse };

export async function submitGatekeeperRecoveryRequestForResult(
  input: {
    result: GatekeeperFrontendResult;
    action: GatekeeperRecoveryRequestType;
    requesterEmail: string;
    authorizedRepresentativeAttested: boolean;
  },
  clients: RecoveryRequestClients = recoveryRequestClients,
): Promise<GatekeeperRecoverySubmissionResult> {
  if (!isGatekeeperRecoveryActionAvailable(input.result, input.action)) {
    return { status: "NOT_PERMITTED" };
  }
  if (!input.result.leadId) {
    return { status: "MISSING_CONTEXT" };
  }
  if (!input.authorizedRepresentativeAttested) {
    return { status: "ATTESTATION_REQUIRED" };
  }

  const response = await clients[input.action]({
    leadId: input.result.leadId,
    requesterEmail: input.requesterEmail,
    authorizedRepresentativeAttested: true,
  });
  return { status: "SUBMITTED", response };
}

export async function navigateToGatekeeperSupportDestination(
  navigate: (href: string) => void = (href) => window.location.assign(href),
): Promise<void> {
  const destination = await fetchGatekeeperSupportDestination();
  navigate(destination.href);
}
