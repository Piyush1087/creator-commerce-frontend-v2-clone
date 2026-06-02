import { env } from "../../../shared/config/env";
import { authAuthorizationHeader } from "../../../shared/auth/auth-session";
import type {
  CampaignBriefRecord,
  CampaignListAggregates,
  CampaignListRow,
  CampaignProductRecord,
  CampaignReportingResponse,
  CampaignShellResponse,
  CreateCampaignBriefBody,
  CreateCampaignProductBody,
  PatchCampaignStatusResponse,
  PipelineListResponse,
  UceCampaignObjective,
  UceCampaignStatus,
} from "../contracts/brand-uce.contracts";
import type { IntegratedCampaignWizardPayload } from "../schemas/campaign-wizard-schema";

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

const BASE = `${env.apiUrl}/api/v1/brand-uce`;

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

export type ListCampaignsParams = {
  status?: UceCampaignStatus;
  search?: string;
  objective?: UceCampaignObjective;
};

export async function fetchCampaignListAggregates(): Promise<CampaignListAggregates> {
  const response = await fetch(`${BASE}/campaigns/aggregates`, {
    method: "GET",
    headers: authHeaders(),
  });
  return (await readJsonOrThrow(response)) as CampaignListAggregates;
}

export async function fetchCampaignList(
  params?: ListCampaignsParams,
): Promise<CampaignListRow[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.objective) query.set("objective", params.objective);
  const qs = query.toString();
  const response = await fetch(`${BASE}/campaigns${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return (await readJsonOrThrow(response)) as CampaignListRow[];
}

export async function createCampaignFromWizard(
  payload: IntegratedCampaignWizardPayload,
): Promise<CampaignShellResponse> {
  const response = await fetch(`${BASE}/campaigns/wizard`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return (await readJsonOrThrow(response)) as CampaignShellResponse;
}

export async function fetchCampaignShell(
  campaignId: string,
): Promise<CampaignShellResponse> {
  const response = await fetch(`${BASE}/campaigns/${encodeURIComponent(campaignId)}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return (await readJsonOrThrow(response)) as CampaignShellResponse;
}

export async function patchCampaignStatus(
  campaignId: string,
  status: UceCampaignStatus,
): Promise<PatchCampaignStatusResponse> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/status`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    },
  );
  return (await readJsonOrThrow(response)) as PatchCampaignStatusResponse;
}

export async function createCampaignProduct(
  campaignId: string,
  body: CreateCampaignProductBody,
): Promise<CampaignProductRecord> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/products`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    },
  );
  return (await readJsonOrThrow(response)) as CampaignProductRecord;
}

export async function createCampaignBrief(
  campaignId: string,
  body: CreateCampaignBriefBody,
): Promise<CampaignBriefRecord> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/briefs`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    },
  );
  return (await readJsonOrThrow(response)) as CampaignBriefRecord;
}

export async function fetchPipelineProspects(
  campaignId: string,
): Promise<PipelineListResponse> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/pipeline/prospects`,
    { method: "GET", headers: authHeaders() },
  );
  return (await readJsonOrThrow(response)) as PipelineListResponse;
}

export async function fetchPipelineApplicants(
  campaignId: string,
): Promise<PipelineListResponse> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/pipeline/applicants`,
    { method: "GET", headers: authHeaders() },
  );
  return (await readJsonOrThrow(response)) as PipelineListResponse;
}

export async function fetchPipelineActiveCollabs(
  campaignId: string,
): Promise<PipelineListResponse> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/pipeline/active-collabs`,
    { method: "GET", headers: authHeaders() },
  );
  return (await readJsonOrThrow(response)) as PipelineListResponse;
}

export async function fetchCampaignReporting(
  campaignId: string,
): Promise<CampaignReportingResponse> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/reporting`,
    { method: "GET", headers: authHeaders() },
  );
  return (await readJsonOrThrow(response)) as CampaignReportingResponse;
}

export async function refreshCampaignReportingSync(
  campaignId: string,
): Promise<{ ok: boolean; last_api_sync_timestamp: string }> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/reporting/refresh-sync`,
    { method: "POST", headers: authHeaders() },
  );
  return (await readJsonOrThrow(response)) as {
    ok: boolean;
    last_api_sync_timestamp: string;
  };
}
