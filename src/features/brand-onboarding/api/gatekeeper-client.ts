import { env } from "../../../shared/config/env";
import type { SupportedGatekeeperIndustry } from "../contracts/gatekeeper.contracts";
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

async function postJson(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }
  if (!response.ok) throw httpErrorFromResponse(response, parsed);
  return parsed;
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
