import { env } from "../../../shared/config/env";
import type { SupportedGatekeeperIndustry } from "../contracts/gatekeeper.contracts";
import {
  isResolveProceed,
  parseGatekeeperResult,
  parseIndustryConfirmation,
} from "../schemas/gatekeeper-runtime-schema";
import { httpErrorFromResponse } from "./http-api-error";

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
  const resolve = await postJson("/api/v1/discovery/resolve", submission);
  if (!isResolveProceed(resolve)) return parseGatekeeperResult(resolve);

  const validate = await postJson("/api/v1/discovery/validate", submission);
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
