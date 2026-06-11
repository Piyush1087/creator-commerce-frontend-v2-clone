import { env } from "../../../shared/config/env";
import { authAuthorizationHeader } from "../../../shared/auth/auth-session";
import type {
  CreatorApplyResponse,
  CreatorOpenCampaignRow,
} from "../contracts/creator-uce.contracts";

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

const BASE = `${env.apiUrl}/api/v1/creator-uce`;

function authHeaders(): Record<string, string> {
  return {
    ...JSON_HEADERS,
    ...authAuthorizationHeader(),
  };
}

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return body;
}

export async function fetchCreatorOpenCampaigns(): Promise<CreatorOpenCampaignRow[]> {
  const response = await fetch(`${BASE}/campaigns`, {
    method: "GET",
    headers: authHeaders(),
  });
  return (await readJsonOrThrow(response)) as CreatorOpenCampaignRow[];
}

export async function postCreatorApply(
  campaignId: string,
  body: { brief_id: string; product_id?: string },
): Promise<CreatorApplyResponse> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/apply`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    },
  );
  return (await readJsonOrThrow(response)) as CreatorApplyResponse;
}
