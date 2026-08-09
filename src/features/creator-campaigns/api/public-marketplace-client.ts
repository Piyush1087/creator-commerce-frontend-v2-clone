import { env } from "../../../shared/config/env";
import type {
  InvitationResolveResponse,
  MarketplaceDetailResponse,
  MarketplaceListQuery,
  MarketplaceListResponse,
} from "../contracts/creator-campaigns.contracts";

const PUBLIC_BASE = `${env.apiUrl}/api/v1/public/marketplace`;

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

export async function fetchPublicMarketplaceCampaigns(
  query: MarketplaceListQuery = {},
): Promise<MarketplaceListResponse> {
  const response = await fetch(
    `${PUBLIC_BASE}/campaigns${toQueryString(query)}`,
    { method: "GET" },
  );
  return (await readJsonOrThrow(response)) as MarketplaceListResponse;
}

export async function fetchPublicMarketplaceCampaignDetail(
  campaignId: string,
  inviteToken?: string,
): Promise<MarketplaceDetailResponse> {
  const params = inviteToken
    ? `?invite_token=${encodeURIComponent(inviteToken)}`
    : "";
  const response = await fetch(
    `${PUBLIC_BASE}/campaigns/${encodeURIComponent(campaignId)}${params}`,
    { method: "GET" },
  );
  return (await readJsonOrThrow(response)) as MarketplaceDetailResponse;
}

export async function resolvePublicInvitation(
  token: string,
): Promise<InvitationResolveResponse> {
  const response = await fetch(
    `${PUBLIC_BASE}/invitations/${encodeURIComponent(token)}`,
    { method: "GET" },
  );
  return (await readJsonOrThrow(response)) as InvitationResolveResponse;
}
