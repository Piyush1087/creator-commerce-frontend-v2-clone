import { env } from "../../../shared/config/env";
import { authAuthorizationHeader } from "../../../shared/auth/auth-session";
import type {
  CampaignsHistoryResponse,
  CampaignsWorkspaceResponse,
  MarketplaceAlternativesResponse,
  MarketplaceDetailResponse,
  MarketplaceListQuery,
  MarketplaceListResponse,
  MarketplaceShareLinkResponse,
} from "../contracts/creator-campaigns.contracts";

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

const MARKETPLACE_BASE = `${env.apiUrl}/api/v1/creator/marketplace`;
const CAMPAIGNS_BASE = `${env.apiUrl}/api/v1/creator/campaigns`;

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

function toQueryString(query: MarketplaceListQuery): string {
  const params = new URLSearchParams();
  if (query.search_query?.trim()) params.set("search_query", query.search_query.trim());
  if (query.brand_slug?.trim()) params.set("brand_slug", query.brand_slug.trim());
  if (query.show_match_eligible_only) params.set("show_match_eligible_only", "true");
  if (query.niche?.trim()) params.set("niche", query.niche.trim());
  if (query.deliverable_type) params.set("deliverable_type", query.deliverable_type);
  if (query.target_geography?.trim()) {
    params.set("target_geography", query.target_geography.trim().toUpperCase());
  }
  for (const tier of query.creator_tier ?? []) {
    params.append("creator_tier", tier);
  }
  for (const timeline of query.production_timeline ?? []) {
    params.append("production_timeline", timeline);
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export async function fetchMarketplaceCampaigns(
  query: MarketplaceListQuery = {},
): Promise<MarketplaceListResponse> {
  const response = await fetch(
    `${MARKETPLACE_BASE}/campaigns${toQueryString(query)}`,
    { method: "GET", headers: authHeaders() },
  );
  return (await readJsonOrThrow(response)) as MarketplaceListResponse;
}

export async function fetchMarketplaceCampaignDetail(
  campaignId: string,
  inviteToken?: string,
): Promise<MarketplaceDetailResponse> {
  const params = inviteToken
    ? `?invite_token=${encodeURIComponent(inviteToken)}`
    : "";
  const response = await fetch(
    `${MARKETPLACE_BASE}/campaigns/${encodeURIComponent(campaignId)}${params}`,
    { method: "GET", headers: authHeaders() },
  );
  return (await readJsonOrThrow(response)) as MarketplaceDetailResponse;
}

export async function fetchMarketplaceAlternatives(
  campaignId: string,
): Promise<MarketplaceAlternativesResponse> {
  const response = await fetch(
    `${MARKETPLACE_BASE}/campaigns/${encodeURIComponent(campaignId)}/alternatives`,
    { method: "GET", headers: authHeaders() },
  );
  return (await readJsonOrThrow(response)) as MarketplaceAlternativesResponse;
}

export async function fetchMarketplaceShareLink(
  campaignId: string,
  origin: string,
): Promise<MarketplaceShareLinkResponse> {
  const params = new URLSearchParams({ origin });
  const response = await fetch(
    `${MARKETPLACE_BASE}/campaigns/${encodeURIComponent(campaignId)}/share-link?${params}`,
    { method: "GET", headers: authHeaders() },
  );
  return (await readJsonOrThrow(response)) as MarketplaceShareLinkResponse;
}

export async function claimMarketplaceInvitation(
  inviteToken: string,
): Promise<{ collaboration_id: string; campaign_id: string; claimed: boolean }> {
  const response = await fetch(`${MARKETPLACE_BASE}/invitations/claim`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ invite_token: inviteToken }),
  });
  return (await readJsonOrThrow(response)) as {
    collaboration_id: string;
    campaign_id: string;
    claimed: boolean;
  };
}

export async function fetchCampaignsWorkspace(): Promise<CampaignsWorkspaceResponse> {
  const response = await fetch(`${CAMPAIGNS_BASE}/workspace`, {
    method: "GET",
    headers: authHeaders(),
  });
  return (await readJsonOrThrow(response)) as CampaignsWorkspaceResponse;
}

export async function fetchCampaignsHistory(): Promise<CampaignsHistoryResponse> {
  const response = await fetch(`${CAMPAIGNS_BASE}/history`, {
    method: "GET",
    headers: authHeaders(),
  });
  return (await readJsonOrThrow(response)) as CampaignsHistoryResponse;
}
