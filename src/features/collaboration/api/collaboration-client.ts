import { env } from "../../../shared/config/env";
import { authAuthorizationHeader } from "../../../shared/auth/auth-session";
import type { CollaborationDetailResponse, CollaborationMessageRow, CollaborationThreadRow, CommandEnvelope } from "../contracts/collaboration.contracts";
import {
  parseCollaborationDetail,
  parseCollaborationMessages,
  parseCollaborationThreads,
} from "../schemas/collaboration-read.schemas";
import { parseCollaborationApiError } from "../utils/parse-collaboration-api-error";

const BASE = `${env.apiUrl}/api/v1/collaboration`;
const JSON_HEADERS = { "Content-Type": "application/json" } as const;
const authHeaders = (): Record<string, string> => ({ ...JSON_HEADERS, ...authAuthorizationHeader() });

export class CollaborationCommandError extends Error {
  constructor(message: string, readonly status: number, readonly code: string | null) { super(message); }
  get stale(): boolean { return this.status === 409 || this.code === "STALE_AGGREGATE_VERSION"; }
}
async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown;
  try { body = text ? JSON.parse(text) : undefined; } catch { throw new CollaborationCommandError("The server returned an invalid response.", response.status, null); }
  if (!response.ok) {
    const code = typeof body === "object" && body && "code" in body && typeof (body as { code?: unknown }).code === "string" ? (body as { code: string }).code : null;
    throw new CollaborationCommandError(parseCollaborationApiError(body, response.status), response.status, code);
  }
  return body;
}
export const createCollaborationCommandId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `collaboration-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export type ListThreadsParams = { campaign_id?: string; brief_id?: string; stage?: string; search?: string };
export async function fetchCollaborationThreads(params?: ListThreadsParams): Promise<CollaborationThreadRow[]> {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => { if (value?.trim()) query.set(key, value.trim()); });
  const response = await fetch(`${BASE}/threads${query.size ? `?${query}` : ""}`, { headers: authHeaders() });
  return parseCollaborationThreads(await readJsonOrThrow(response)).rows;
}
export async function fetchCollaborationThread(id: string): Promise<CollaborationDetailResponse> {
  return parseCollaborationDetail(await readJsonOrThrow(await fetch(`${BASE}/threads/${id}`, { headers: authHeaders() })));
}
export async function fetchCollaborationMessages(id: string): Promise<CollaborationMessageRow[]> {
  const response = await fetch(`${BASE}/threads/${id}/messages`, { headers: authHeaders() });
  return parseCollaborationMessages(await readJsonOrThrow(response)).messages;
}
export async function postCollaborationMessage(id: string, body: string): Promise<void> {
  await readJsonOrThrow(await fetch(`${BASE}/threads/${id}/messages`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ body }) }));
}
async function command(id: string, path: string, body: Record<string, unknown>): Promise<CollaborationDetailResponse> {
  return parseCollaborationDetail(await readJsonOrThrow(await fetch(`${BASE}/threads/${id}/${path}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) })));
}
export const envelope = (expectedAggregateVersion: number, commandId = createCollaborationCommandId()): CommandEnvelope => ({ commandId, expectedAggregateVersion });
export const acceptProposedFee = (id: string, e: CommandEnvelope) => command(id, "negotiation/accept-proposed-fee", e);
export const counterOffer = (id: string, e: CommandEnvelope, counterFee: number) => command(id, "negotiation/counter-offer", { ...e, counterFee });
export const acceptCounterOffer = (id: string, e: CommandEnvelope) => command(id, "negotiation/accept-counter-offer", e);
export const declineNegotiation = (id: string, e: CommandEnvelope) => command(id, "negotiation/decline", e);
export const requestEscrowFunding = (id: string, e: CommandEnvelope) => command(id, "securement/request-escrow-funding", e);
export type ProvideFulfillmentPayload = { shipmentTrackingRef?: string; courierName?: string; accessEvidenceRef?: string; redemptionCode?: string; serviceEvidenceRef?: string; genericFulfillmentEvidence?: { description: string; evidenceRef?: string } };
export type ReportFulfillmentIssuePayload = { issueCode: string; description: string; evidenceRef?: string };
export const provideFulfillment = (id: string, e: CommandEnvelope, payload: ProvideFulfillmentPayload) => command(id, "fulfillment/provide", { ...e, ...payload });
export const confirmFulfillment = (id: string, e: CommandEnvelope) => command(id, "fulfillment/confirm", e);
export const reportFulfillmentIssue = (id: string, e: CommandEnvelope, payload: ReportFulfillmentIssuePayload) => command(id, "fulfillment/report-issue", { ...e, ...payload });
export const provideFulfillmentRemediation = (id: string, e: CommandEnvelope, remediationEvidenceRef: string) => command(id, "fulfillment/remediate", { ...e, remediationEvidenceRef });
export const submitDeliverable = (id: string, e: CommandEnvelope, payload: { deliverableExecutionId: string; assetRef: string; creatorNote?: string; submissionMetadata?: Record<string, unknown> }) => command(id, "production/submit-deliverable", { ...e, ...payload });
export const approveDeliverable = (id: string, e: CommandEnvelope, deliverableExecutionId: string, submissionVersionId: string) => command(id, "production/approve-deliverable", { ...e, deliverableExecutionId, submissionVersionId });
export const requestDeliverableRevision = (id: string, e: CommandEnvelope, payload: { deliverableExecutionId: string; submissionVersionId: string; brandFeedback: string }) => command(id, "production/request-revision", { ...e, ...payload });
export const rejectFinalDeliverable = (id: string, e: CommandEnvelope, payload: { deliverableExecutionId: string; submissionVersionId: string; brandFeedback: string }) => command(id, "production/reject-final", { ...e, ...payload });
export const authorizePublishing = (id: string, e: CommandEnvelope, deliverableExecutionId: string) => command(id, "publishing/authorize", { ...e, deliverableExecutionId });
export const declinePublishing = (id: string, e: CommandEnvelope, deliverableExecutionId: string) => command(id, "publishing/decline", { ...e, deliverableExecutionId });
export const submitPublishingEvidence = (id: string, e: CommandEnvelope, payload: { deliverableExecutionId: string; evidenceRef: string; platform?: string; creatorNote?: string }) => command(id, "publishing/evidence", { ...e, ...payload });
export const submitCorrectedPublishingEvidence = (id: string, e: CommandEnvelope, payload: { deliverableExecutionId: string; evidenceRef: string; platform?: string; creatorNote?: string }) => command(id, "publishing/corrected-evidence", { ...e, ...payload });
export const verifyPublishing = (id: string, e: CommandEnvelope, deliverableExecutionId: string, publishingEvidenceId: string, complianceEvidenceRef?: string) => command(id, "publishing/verify", { ...e, deliverableExecutionId, publishingEvidenceId, complianceEvidenceRef });
export const requestPublishingCorrection = (id: string, e: CommandEnvelope, payload: { deliverableExecutionId: string; publishingEvidenceId: string; correctionReason: string }) => command(id, "publishing/request-correction", { ...e, ...payload });
export const endCollaborationByBrand = (id: string, e: CommandEnvelope) => command(id, "end-by-brand", e);
export const cancelCollaborationByCreator = (id: string, e: CommandEnvelope) => command(id, "cancel-by-creator", e);
export const submitCollaborationFeedback = async (id: string, e: CommandEnvelope, rating: number, reviewText?: string) => {
  await command(id, "feedback/review", { collaborationId: id, ...e, rating, reviewText });
  return fetchCollaborationThread(id);
};
