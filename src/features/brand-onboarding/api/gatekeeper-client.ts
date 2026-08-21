import { env } from "../../../shared/config/env";
import type {
  GatekeeperRecoveryRequestInput,
  GatekeeperRecoveryRequestResponse,
  GatekeeperRecoveryRequestType,
  GatekeeperSupportDestination,
  SupportedGatekeeperIndustry,
} from "../contracts/gatekeeper.contracts";
import {
  isResolveProceed,
  parseGatekeeperResult,
  parseIndustryConfirmation,
} from "../schemas/gatekeeper-runtime-schema";
import { httpErrorFromResponse } from "./http-api-error";

/**
 * Temporary legal-version identifiers for the current MVP placeholder pages.
 * Replace these values when canonical Terms and Privacy documents are published.
 */
export const GATEKEEPER_TERMS_VERSION = "draft-2026-08-20";
export const GATEKEEPER_PRIVACY_VERSION = "draft-2026-08-20";

export type GatekeeperSubmission = {
  url: string;
  brandOwnershipOrAuthorizationAttestation: true;
  termsAcceptance: true;
  privacyPolicyAcceptance: true;
};

async function requestJson(path: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers:
      init.body === undefined
        ? init.headers
        : { "Content-Type": "application/json", ...init.headers },
  });
  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error(
      "The server returned an invalid response. Please try again.",
    );
  }
  if (!response.ok) throw httpErrorFromResponse(response, parsed);
  return parsed;
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  return requestJson(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseRecoveryRequestResponse(
  value: unknown,
  expectedType: GatekeeperRecoveryRequestType,
  expectedLeadId: string,
): GatekeeperRecoveryRequestResponse {
  if (!isRecord(value) || !isRecord(value.request)) {
    throw new Error("The server returned an invalid recovery request receipt.");
  }

  const request = value.request;
  if (
    !isNonEmptyString(request.id) ||
    request.type !== expectedType ||
    request.status !== "RECEIVED" ||
    request.discoveryLeadId !== expectedLeadId ||
    !isNonEmptyString(request.normalizedDomain) ||
    !isNonEmptyString(request.submittedAt) ||
    Number.isNaN(Date.parse(request.submittedAt))
  ) {
    throw new Error("The server returned an invalid recovery request receipt.");
  }

  return {
    request: {
      id: request.id,
      type: expectedType,
      status: "RECEIVED",
      discoveryLeadId: expectedLeadId,
      normalizedDomain: request.normalizedDomain,
      submittedAt: request.submittedAt,
    },
  };
}

function parseSupportDestination(value: unknown): GatekeeperSupportDestination {
  if (!isRecord(value) || !isRecord(value.support)) {
    throw new Error(
      "The support destination could not be verified. Please try again later.",
    );
  }

  const support = value.support;
  if (support.type !== "URL" || !isNonEmptyString(support.href)) {
    throw new Error(
      "The support destination could not be verified. Please try again later.",
    );
  }

  try {
    const url = new URL(support.href);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Unsupported support URL protocol.");
    }
  } catch {
    throw new Error(
      "The support destination could not be verified. Please try again later.",
    );
  }

  return { type: "URL", href: support.href };
}

async function submitRecoveryRequest(
  path: string,
  expectedType: GatekeeperRecoveryRequestType,
  input: GatekeeperRecoveryRequestInput,
): Promise<GatekeeperRecoveryRequestResponse> {
  const { leadId, ...body } = input;
  const response = await postJson(
    `/api/v1/discovery/${encodeURIComponent(leadId)}/${path}`,
    body,
  );
  return parseRecoveryRequestResponse(response, expectedType, leadId);
}

export async function runGatekeeperAdmission(submission: GatekeeperSubmission) {
  // Resolve receives only the URL. The authoritative validate endpoint receives
  // the legal/authorization controls using the backend DTO field names.
  const resolve = await postJson("/api/v1/discovery/resolve", {
    url: submission.url,
  });
  if (!isResolveProceed(resolve)) return parseGatekeeperResult(resolve);

  const validate = await postJson("/api/v1/discovery/validate", {
    url: submission.url,
    ownershipAuthorizationAttested:
      submission.brandOwnershipOrAuthorizationAttestation,
    termsAccepted: submission.termsAcceptance,
    privacyPolicyAccepted: submission.privacyPolicyAcceptance,
    termsVersion: GATEKEEPER_TERMS_VERSION,
    privacyPolicyVersion: GATEKEEPER_PRIVACY_VERSION,
  });
  return parseGatekeeperResult(validate);
}

export async function confirmGatekeeperIndustry(input: {
  leadId: string;
  selectedIndustry: SupportedGatekeeperIndustry | string;
}) {
  const response = await postJson(
    `/api/v1/discovery/${encodeURIComponent(input.leadId)}/confirm-industry`,
    {
      selectedIndustry: input.selectedIndustry,
      explicitConfirmation: true,
    },
  );
  return parseIndustryConfirmation(response);
}

export async function requestGatekeeperOrganizationAccess(
  input: GatekeeperRecoveryRequestInput,
): Promise<GatekeeperRecoveryRequestResponse> {
  return submitRecoveryRequest(
    "request-org-access",
    "REQUEST_ORG_ACCESS",
    input,
  );
}

export async function requestGatekeeperClassificationReview(
  input: GatekeeperRecoveryRequestInput,
): Promise<GatekeeperRecoveryRequestResponse> {
  return submitRecoveryRequest(
    "request-classification-review",
    "REQUEST_CLASSIFICATION_REVIEW",
    input,
  );
}

export async function fetchGatekeeperSupportDestination(): Promise<GatekeeperSupportDestination> {
  const response = await requestJson("/api/v1/discovery/support", {
    method: "GET",
  });
  return parseSupportDestination(response);
}
