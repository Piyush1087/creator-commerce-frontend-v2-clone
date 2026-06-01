import { env } from "../../../shared/config/env";
import { authAuthorizationHeader } from "../../../shared/auth/auth-session";
import {
  isBrandCentreAccountResponse,
  isBrandCentreBudgetResponse,
  isBrandCentreDnaResponse,
  isBrandCentreIntelligenceResponse,
  isBrandCentrePlannerDashboardResponse,
  isBrandCentreScanStatusResponse,
  type BrandCentreAccountResponse,
  type BrandCentreBudgetResponse,
  type BrandCentreDnaResponse,
  type BrandCentreIntelligenceLeakSummary,
  type BrandCentreIntelligenceResponse,
  type BrandCentrePlannerDashboardResponse,
  type BrandCentreScanStatusResponse,
} from "../contracts/brand-centre.contracts";
import { mapIntelligenceResponse } from "../utils/map-intelligence-view";

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

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

export async function fetchBrandCentreDna(): Promise<BrandCentreDnaResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/brand-centre/dna`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isBrandCentreDnaResponse(json)) {
    throw new Error("Unexpected Brand DNA response.");
  }
  return json;
}

export async function fetchBrandCentreBudget(): Promise<BrandCentreBudgetResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/brand-centre/dna/budget`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isBrandCentreBudgetResponse(json)) {
    throw new Error("Unexpected budget response.");
  }
  return json;
}

export async function fetchBrandCentreAccount(): Promise<BrandCentreAccountResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/brand-centre/dna/account`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isBrandCentreAccountResponse(json)) {
    throw new Error("Unexpected account response.");
  }
  return json;
}

export async function fetchBrandCentreScanStatus(): Promise<BrandCentreScanStatusResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/brand-centre/scan-status`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isBrandCentreScanStatusResponse(json)) {
    throw new Error("Unexpected scan status response.");
  }
  return json;
}

export async function fetchBrandCentreIntelligence(): Promise<BrandCentreIntelligenceResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/brand-centre/intelligence`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isBrandCentreIntelligenceResponse(json)) {
    throw new Error("Unexpected intelligence response.");
  }
  return mapIntelligenceResponse(json);
}

export type BrandCentreMoveToPlannerResponse = { jobId: string };

export type BrandCentreLeakDetailResponse =
  BrandCentreIntelligenceLeakSummary & {
    drawerDeepDive?: {
      underlyingDataLogic?: string;
      competitiveDiscrepancy?: string;
      actionableStepsChecklist?: Array<{
        stepId?: string;
        stepLabel?: string;
        isCompleted?: boolean;
      }>;
    };
    createdAt?: string;
    updatedAt?: string;
  };

export async function fetchBrandCentreLeakDetail(
  leakId: string,
): Promise<BrandCentreLeakDetailResponse> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand-centre/intelligence/leaks/${encodeURIComponent(leakId)}`,
    { method: "GET", headers: authHeaders() },
  );
  const json = await readJsonOrThrow(response);
  if (!json || typeof json !== "object") {
    throw new Error("Unexpected leak detail response.");
  }
  return json as BrandCentreLeakDetailResponse;
}

export async function postMoveLeakToPlanner(
  leakId: string,
): Promise<BrandCentreMoveToPlannerResponse> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand-centre/intelligence/leaks/${encodeURIComponent(leakId)}/move-to-planner`,
    { method: "POST", headers: authHeaders() },
  );
  const json = await readJsonOrThrow(response);
  if (
    !json ||
    typeof json !== "object" ||
    typeof (json as { jobId?: unknown }).jobId !== "string"
  ) {
    throw new Error("Unexpected move-to-planner response.");
  }
  return { jobId: (json as { jobId: string }).jobId };
}

export async function fetchBrandCentrePlanner(): Promise<BrandCentrePlannerDashboardResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/brand-centre/planner`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isBrandCentrePlannerDashboardResponse(json)) {
    throw new Error("Unexpected planner response.");
  }
  return json;
}

export async function postBrandCentreSessionEvict(): Promise<{ archived: number }> {
  const response = await fetch(`${env.apiUrl}/api/v1/brand-centre/session/evict`, {
    method: "POST",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!json || typeof json !== "object") {
    return { archived: 0 };
  }
  const archived = (json as { archived?: unknown }).archived;
  return { archived: typeof archived === "number" ? archived : 0 };
}
