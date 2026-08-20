import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  GatekeeperFrontendResult,
  GatekeeperRecoveryRequestResponse,
} from "../contracts/gatekeeper.contracts";
import {
  CLASSIFICATION_REVIEW_REQUEST_RECEIVED_MESSAGE,
  navigateToGatekeeperSupportDestination,
  ORG_ACCESS_REQUEST_RECEIVED_MESSAGE,
  submitGatekeeperRecoveryRequestForResult,
  visibleGatekeeperRecoveryActions,
} from "./gatekeeper-recovery";

const baseResult: GatekeeperFrontendResult = {
  outcome: "CLASSIFICATION_UNCERTAIN",
  reasonCode: "INSUFFICIENT_EVIDENCE",
  recoveryActions: ["REQUEST_CLASSIFICATION_REVIEW", "RETRY"],
  manualReviewEligible: false,
  normalizedUrl: "https://brand.com/",
  normalizedDomain: "brand.com",
  leadId: "lead-1",
  brandProfileId: null,
  provisionalIndustry: null,
  message: null,
};

function requestResponse(
  type: "REQUEST_ORG_ACCESS" | "REQUEST_CLASSIFICATION_REVIEW",
): GatekeeperRecoveryRequestResponse {
  return {
    request: {
      id: "request-1",
      type,
      status: "RECEIVED",
      discoveryLeadId: "lead-1",
      normalizedDomain: "brand.com",
      submittedAt: "2026-08-21T12:00:00.000Z",
    },
  };
}

describe("Gatekeeper recovery capability handling", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("neither exposes nor invokes classification review when manual review is ineligible", async () => {
    const requestOrgAccess = vi.fn(async () =>
      requestResponse("REQUEST_ORG_ACCESS"),
    );
    const requestClassificationReview = vi.fn(async () =>
      requestResponse("REQUEST_CLASSIFICATION_REVIEW"),
    );

    expect(visibleGatekeeperRecoveryActions(baseResult)).toEqual(["RETRY"]);
    await expect(
      submitGatekeeperRecoveryRequestForResult(
        {
          result: baseResult,
          action: "REQUEST_CLASSIFICATION_REVIEW",
          requesterEmail: "requester@example.com",
          authorizedRepresentativeAttested: true,
        },
        {
          REQUEST_ORG_ACCESS: requestOrgAccess,
          REQUEST_CLASSIFICATION_REVIEW: requestClassificationReview,
        },
      ),
    ).resolves.toEqual({ status: "NOT_PERMITTED" });
    expect(requestClassificationReview).not.toHaveBeenCalled();
    expect(requestOrgAccess).not.toHaveBeenCalled();
  });

  it("does not invoke a request endpoint without lead context", async () => {
    const requestOrgAccess = vi.fn(async () =>
      requestResponse("REQUEST_ORG_ACCESS"),
    );
    const requestClassificationReview = vi.fn(async () =>
      requestResponse("REQUEST_CLASSIFICATION_REVIEW"),
    );
    const result: GatekeeperFrontendResult = {
      ...baseResult,
      outcome: "ORG_CLAIMED",
      recoveryActions: ["REQUEST_ORG_ACCESS"],
      leadId: null,
    };

    await expect(
      submitGatekeeperRecoveryRequestForResult(
        {
          result,
          action: "REQUEST_ORG_ACCESS",
          requesterEmail: "requester@example.com",
          authorizedRepresentativeAttested: true,
        },
        {
          REQUEST_ORG_ACCESS: requestOrgAccess,
          REQUEST_CLASSIFICATION_REVIEW: requestClassificationReview,
        },
      ),
    ).resolves.toEqual({ status: "MISSING_CONTEXT" });
    expect(requestOrgAccess).not.toHaveBeenCalled();
  });

  it("does not invoke a request endpoint without authorization attestation", async () => {
    const requestOrgAccess = vi.fn(async () =>
      requestResponse("REQUEST_ORG_ACCESS"),
    );
    const requestClassificationReview = vi.fn(async () =>
      requestResponse("REQUEST_CLASSIFICATION_REVIEW"),
    );
    const result: GatekeeperFrontendResult = {
      ...baseResult,
      outcome: "ORG_CLAIMED",
      recoveryActions: ["REQUEST_ORG_ACCESS"],
    };

    await expect(
      submitGatekeeperRecoveryRequestForResult(
        {
          result,
          action: "REQUEST_ORG_ACCESS",
          requesterEmail: "requester@example.com",
          authorizedRepresentativeAttested: false,
        },
        {
          REQUEST_ORG_ACCESS: requestOrgAccess,
          REQUEST_CLASSIFICATION_REVIEW: requestClassificationReview,
        },
      ),
    ).resolves.toEqual({ status: "ATTESTATION_REQUIRED" });
    expect(requestOrgAccess).not.toHaveBeenCalled();
  });

  it("navigates to the URL returned by the canonical support endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            support: {
              type: "URL",
              href: "https://support.example.com/canonical",
            },
          }),
          { status: 200 },
        ),
      ),
    );
    const navigate = vi.fn();

    await navigateToGatekeeperSupportDestination(navigate);

    expect(navigate).toHaveBeenCalledWith(
      "https://support.example.com/canonical",
    );
  });

  it("keeps organization-access success copy authority-safe", () => {
    expect(ORG_ACCESS_REQUEST_RECEIVED_MESSAGE).toMatch(
      /submitted and received/i,
    );
    expect(ORG_ACCESS_REQUEST_RECEIVED_MESSAGE).toMatch(
      /does not grant access/i,
    );
    expect(ORG_ACCESS_REQUEST_RECEIVED_MESSAGE).not.toMatch(
      /access (?:is|was|has been) granted/i,
    );
  });

  it("keeps classification-review success copy user-initiated and authority-safe", () => {
    expect(CLASSIFICATION_REVIEW_REQUEST_RECEIVED_MESSAGE).toMatch(
      /user-initiated.*submitted and received/i,
    );
    expect(CLASSIFICATION_REVIEW_REQUEST_RECEIVED_MESSAGE).toMatch(
      /does not change the classification/i,
    );
    expect(CLASSIFICATION_REVIEW_REQUEST_RECEIVED_MESSAGE).not.toMatch(
      /classification (?:is|was|has been) changed/i,
    );
  });
});
