import { env } from "../../../shared/config/env";
import { authAuthorizationHeader } from "../../../shared/auth/auth-session";
import type {
  CampaignBriefRecord,
  CampaignAssetProjection,
  CampaignListAggregates,
  CampaignListRow,
  CampaignProductRecord,
  CampaignReportingResponse,
  CampaignShellResponse,
  CreateCampaignBriefBody,
  CreateCampaignProductBody,
  PatchCampaignEssentialsBody,
  PatchCampaignStatusResponse,
  PipelineCollaborationRow,
  PipelineListResponse,
  UceCampaignObjective,
  UceCampaignStatus,
  UpdateCampaignProductBody,
  SelectableCampaignAsset,
  CampaignAssetKind,
  CanonicalCampaignBrief,
  CreateCanonicalCampaignBriefBody,
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

export class BrandUceWizardValidationError extends Error {
  readonly issues: unknown;

  constructor(message: string, issues: unknown) {
    super(message);
    this.name = "BrandUceWizardValidationError";
    this.issues = issues;
  }
}

export async function createCampaignFromWizard(
  payload: IntegratedCampaignWizardPayload,
): Promise<CampaignShellResponse> {
  const response = await fetch(`${BASE}/campaigns/wizard`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

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
    const issues =
      typeof body === "object" && body !== null && "issues" in body
        ? (body as { issues: unknown }).issues
        : undefined;

    if (response.status === 422 && issues !== undefined) {
      throw new BrandUceWizardValidationError(message, issues);
    }

    throw new Error(message);
  }

  return body as CampaignShellResponse;
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

export async function fetchSelectableCampaignAssets(): Promise<SelectableCampaignAsset[]> {
  const response = await fetch(`${BASE}/campaign-assets/selectable`, {
    method: "GET",
    headers: authHeaders(),
  });
  return (await readJsonOrThrow(response)) as SelectableCampaignAsset[];
}

export async function selectCampaignAsset(
  campaignId: string,
  selection: { kind: CampaignAssetKind; entity_id: string },
): Promise<CampaignAssetProjection> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/assets`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(selection),
    },
  );
  return (await readJsonOrThrow(response)) as CampaignAssetProjection;
}

export async function createCanonicalCampaignBrief(
  campaignId: string,
  body: CreateCanonicalCampaignBriefBody,
): Promise<CanonicalCampaignBrief> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/canonical-briefs`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    },
  );
  return (await readJsonOrThrow(response)) as CanonicalCampaignBrief;
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

export async function patchCampaignEssentials(
  campaignId: string,
  body: PatchCampaignEssentialsBody,
): Promise<CampaignShellResponse> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/essentials`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    },
  );
  return (await readJsonOrThrow(response)) as CampaignShellResponse;
}

export async function updateCampaignProduct(
  campaignId: string,
  productId: string,
  body: UpdateCampaignProductBody,
): Promise<CampaignProductRecord> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/products/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    },
  );
  return (await readJsonOrThrow(response)) as CampaignProductRecord;
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

export async function postApproveApplicant(
  campaignId: string,
  collaborationId: string,
  body?: { product_id?: string; total_quote?: number },
): Promise<PipelineCollaborationRow> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/pipeline/collaborations/${encodeURIComponent(collaborationId)}/approve`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body ?? {}),
    },
  );
  return (await readJsonOrThrow(response)) as PipelineCollaborationRow;
}

export async function postRejectApplicant(
  campaignId: string,
  collaborationId: string,
  rejectionReason: string,
): Promise<PipelineCollaborationRow> {
  const response = await fetch(
    `${BASE}/campaigns/${encodeURIComponent(campaignId)}/pipeline/collaborations/${encodeURIComponent(collaborationId)}/reject`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    },
  );
  return (await readJsonOrThrow(response)) as PipelineCollaborationRow;
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
