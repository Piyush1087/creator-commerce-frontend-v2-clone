import { env } from "../../../shared/config/env";
import { authAuthorizationHeader } from "../../../shared/auth/auth-session";
import type {
  CollaborationDetailResponse,
  CollaborationMessageRow,
  CollaborationThreadRow,
  ListMessagesResponse,
  ListThreadsResponse,
} from "../contracts/collaboration.contracts";
import { parseCollaborationApiError } from "../utils/parse-collaboration-api-error";

const BASE = `${env.apiUrl}/api/v1/collaboration`;

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function authHeaders(): Record<string, string> {
  return { ...JSON_HEADERS, ...authAuthorizationHeader() };
}

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown;
  try {
    body = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }
  if (!response.ok) {
    throw new Error(parseCollaborationApiError(body, response.status));
  }
  return body;
}

export type ListThreadsParams = {
  campaign_id?: string;
  brief_id?: string;
  stage?: string;
  search?: string;
};

export async function fetchCollaborationThreads(
  params?: ListThreadsParams,
): Promise<CollaborationThreadRow[]> {
  const query = new URLSearchParams();
  if (params?.campaign_id) query.set("campaign_id", params.campaign_id);
  if (params?.brief_id) query.set("brief_id", params.brief_id);
  if (params?.stage) query.set("stage", params.stage);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  const qs = query.toString();
  const response = await fetch(`${BASE}/threads${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
  const json = (await readJsonOrThrow(response)) as ListThreadsResponse;
  return json.rows;
}

export async function fetchCollaborationThread(
  collaborationId: string,
): Promise<CollaborationDetailResponse> {
  const response = await fetch(`${BASE}/threads/${collaborationId}`, {
    headers: authHeaders(),
  });
  return (await readJsonOrThrow(response)) as CollaborationDetailResponse;
}

export async function fetchCollaborationMessages(
  collaborationId: string,
): Promise<CollaborationMessageRow[]> {
  const response = await fetch(`${BASE}/threads/${collaborationId}/messages`, {
    headers: authHeaders(),
  });
  const json = (await readJsonOrThrow(response)) as ListMessagesResponse;
  return json.messages;
}

async function postAction(
  path: string,
  body?: Record<string, unknown>,
): Promise<CollaborationDetailResponse> {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await readJsonOrThrow(response)) as CollaborationDetailResponse;
}

export async function postCollaborationMessage(
  collaborationId: string,
  body: string,
): Promise<void> {
  const response = await fetch(`${BASE}/threads/${collaborationId}/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ body }),
  });
  await readJsonOrThrow(response);
}

export async function submitCreatorQuote(
  collaborationId: string,
  total_quote: number,
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/negotiation/quote`, {
    total_quote,
  });
}

export async function submitBrandCounterOffer(
  collaborationId: string,
  counter_offer: number,
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/negotiation/counter-offer`, {
    counter_offer,
  });
}

export async function acceptCollaborationCommercials(
  collaborationId: string,
  final_quote?: number,
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/negotiation/accept`, {
    ...(final_quote !== undefined ? { final_quote } : {}),
  });
}

export async function fundCollaborationEscrow(
  collaborationId: string,
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/securement/fund-escrow`, {});
}

export async function dispatchCollaborationLogistics(
  collaborationId: string,
  payload: {
    tracking_id?: string;
    courier_name?: string;
    digital_access_credentials?: string;
    redemption_code?: string;
  },
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/logistics/dispatch`, payload);
}

export async function confirmCollaborationReceipt(
  collaborationId: string,
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/logistics/confirm-receipt`);
}

export async function submitCollaborationMedia(
  collaborationId: string,
  payload: { media_url: string; phase?: "SCRIPTING" | "MEDIA"; deliverable_type?: string },
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/production/submit`, {
    phase: payload.phase ?? "MEDIA",
    media_url: payload.media_url,
    deliverable_type: payload.deliverable_type,
  });
}

export async function reviewCollaborationMedia(
  collaborationId: string,
  decision: "APPROVED" | "REJECTED",
  brand_feedback?: string,
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/production/review`, {
    decision,
    brand_feedback,
  });
}

export async function submitCollaborationLivePost(
  collaborationId: string,
  live_post_url: string,
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/posting/live-url`, {
    live_post_url,
  });
}

export async function verifyCollaborationCompliance(
  collaborationId: string,
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/posting/verify-compliance`);
}

export async function uploadAdvanceReceipt(
  collaborationId: string,
  receipt_url: string,
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/securement/advance-receipt`, {
    receipt_url,
  });
}

export async function confirmManualAdvance(
  collaborationId: string,
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/securement/confirm-manual-advance`);
}

export async function reportFulfillmentIssue(
  collaborationId: string,
  payload: { issue_type: string; description: string },
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/logistics/report-issue`, payload);
}

export async function submitCollaborationReview(
  collaborationId: string,
  payload: { rating: number; review_text?: string },
): Promise<CollaborationDetailResponse> {
  return postAction(`/threads/${collaborationId}/feedback/review`, payload);
}

export async function upsertCreatorBankDetails(payload: {
  account_holder: string;
  bank_name: string;
  account_number: string;
  ifsc_or_routing: string;
}): Promise<{ bank_details_id: string }> {
  const response = await fetch(`${BASE}/creator/bank-details`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return (await readJsonOrThrow(response)) as { bank_details_id: string };
}
