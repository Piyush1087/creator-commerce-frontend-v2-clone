import type { ReportFulfillmentIssuePayload } from "../api/collaboration-client";

/**
 * Transport-only opaque issueCode required by the canonical report-issue command.
 * Backend remediation is sequence-driven and does not branch on this value.
 * Do not present or interpret it as Product taxonomy.
 */
export const FULFILLMENT_ISSUE_TRANSPORT_CODE = "FULFILLMENT_NOT_AS_EXPECTED";

export const FULFILLMENT_ISSUE_DESCRIPTION_MIN = 3;
export const FULFILLMENT_ISSUE_DESCRIPTION_MAX = 2000;

export type FulfillmentIssueDescriptionResult =
  | { ok: true; description: string }
  | { ok: false; error: string };

export function validateFulfillmentIssueDescription(
  raw: string,
): FulfillmentIssueDescriptionResult {
  const description = raw.trim();
  if (description.length < FULFILLMENT_ISSUE_DESCRIPTION_MIN) {
    return { ok: false, error: "Describe the issue in at least three characters." };
  }
  if (description.length > FULFILLMENT_ISSUE_DESCRIPTION_MAX) {
    return {
      ok: false,
      error: `Keep the description to ${FULFILLMENT_ISSUE_DESCRIPTION_MAX} characters or fewer.`,
    };
  }
  return { ok: true, description };
}

/** Build the canonical report-issue payload without exposing taxonomy to the UI. */
export function buildFulfillmentIssuePayload(
  descriptionRaw: string,
  evidenceRefRaw?: string,
): { ok: true; payload: ReportFulfillmentIssuePayload } | { ok: false; error: string } {
  const validated = validateFulfillmentIssueDescription(descriptionRaw);
  if (!validated.ok) return validated;
  const evidenceRef = evidenceRefRaw?.trim() || undefined;
  return {
    ok: true,
    payload: {
      issueCode: FULFILLMENT_ISSUE_TRANSPORT_CODE,
      description: validated.description,
      ...(evidenceRef ? { evidenceRef } : {}),
    },
  };
}
