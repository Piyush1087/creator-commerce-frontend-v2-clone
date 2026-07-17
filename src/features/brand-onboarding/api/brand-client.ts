import { env } from "../../../shared/config/env";
import type {
  DiscoverValidateBrandActive,
  DiscoverValidateOrgClaimed,
  DiscoverValidateVerificationRequired,
} from "../contracts/discovery.contracts";
import type {
  BrandProfileResponseBody,
  ConfirmCheckpoint2RequestBody,
  ConfirmCheckpoint2ResponseBody,
  Checkpoint2Response,
  ConfirmIdentityRequestBody,
  ConfirmIdentityResponseBody,
  CoreIdentitySnapshotResponse,
  IntelligenceStatusResponse,
  PatchBrandProfileRequestBody,
  SendBrandVerificationResponseBody,
  SurfaceScanProgressResponse,
  SurfaceScanResponseBody,
  SyncCompetitorItem,
  SyncOfferingItem,
  VerifyBrandVerificationResponseBody,
} from "../contracts/brand.contracts";
import type { SurfaceScanInfrastructureErrorBody } from "../contracts/brand.contracts";
import type { SurfaceScanTimeoutErrorBody } from "../contracts/brand.contracts";
import {
  isBrandProfileResponse,
  isCheckpoint2Response,
  isCoreIdentitySnapshotResponse,
  isSurfaceScanInfrastructureError,
  isSurfaceScanResponse,
  unwrapSurfaceScanTimeoutError,
  unwrapSurfaceScanInfrastructureError,
} from "../contracts/brand.contracts";
import { httpErrorFromResponse } from "./http-api-error";

/** Onboarding is anonymous until claim; do not attach dashboard JWT. */
function onboardingJsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

export type SurfaceScanGatePayload =
  | DiscoverValidateVerificationRequired
  | DiscoverValidateBrandActive
  | DiscoverValidateOrgClaimed;

export class SurfaceScanGateError extends Error {
  readonly gate: SurfaceScanGatePayload;

  constructor(gate: SurfaceScanGatePayload) {
    super(gate.message);
    this.name = "SurfaceScanGateError";
    this.gate = gate;
  }
}

/** Landing Page State F — infrastructure / live connection runtime error. */
export class SurfaceScanInfrastructureError extends Error {
  readonly payload: SurfaceScanInfrastructureErrorBody;

  constructor(payload: SurfaceScanInfrastructureErrorBody) {
    super(payload.message);
    this.name = "SurfaceScanInfrastructureError";
    this.payload = payload;
  }
}

/** Retryable Stage 1A timeout; handled directly on the scan page. */
export class SurfaceScanTimeoutError extends Error {
  readonly payload: SurfaceScanTimeoutErrorBody;

  constructor(payload: SurfaceScanTimeoutErrorBody) {
    super(payload.message);
    this.name = "SurfaceScanTimeoutError";
    this.payload = payload;
  }
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
    throw httpErrorFromResponse(response, body);
  }
  return body;
}

function parseSurfaceScanGate(body: unknown): SurfaceScanGatePayload | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const outcome = (body as { outcome?: unknown }).outcome;
  if (
    outcome === "verification_required" ||
    outcome === "brand_active" ||
    outcome === "org_claimed"
  ) {
    return body as SurfaceScanGatePayload;
  }
  return null;
}

export async function getSurfaceScanProgress(
  leadId: string,
): Promise<SurfaceScanProgressResponse> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/surface-scan/progress/${encodeURIComponent(leadId)}`,
    { method: "GET" },
  );
  const json = await readJsonOrThrow(response);
  if (!json || typeof json !== "object") {
    throw new Error("Unexpected response from surface scan progress.");
  }
  return json as SurfaceScanProgressResponse;
}

export async function postSurfaceScan(body: {
  leadId: string;
  force?: boolean;
}): Promise<SurfaceScanResponseBody> {
  const response = await fetch(`${env.apiUrl}/api/v1/brand/surface-scan`, {
    method: "POST",
    headers: onboardingJsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: unknown = undefined;
  try {
    parsed = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }
  if (!response.ok) {
    const gate = parseSurfaceScanGate(parsed);
    if (gate) {
      throw new SurfaceScanGateError(gate);
    }
    if (isSurfaceScanInfrastructureError(parsed)) {
      const payload = unwrapSurfaceScanInfrastructureError(parsed);
      if (payload) {
        throw new SurfaceScanInfrastructureError(payload);
      }
    }
    const timeout = unwrapSurfaceScanTimeoutError(parsed);
    if (timeout) {
      throw new SurfaceScanTimeoutError(timeout);
    }
    throw httpErrorFromResponse(response, parsed);
  }
  if (!isSurfaceScanResponse(parsed)) {
    throw new Error("Unexpected response from surface scan.");
  }
  return parsed;
}

export async function getCoreIdentitySnapshot(
  leadId: string,
): Promise<CoreIdentitySnapshotResponse> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/surface-scan/core-identity/${encodeURIComponent(leadId)}`,
    { method: "GET" },
  );
  const json = await readJsonOrThrow(response);
  if (!isCoreIdentitySnapshotResponse(json)) {
    throw new Error("Unexpected response from core identity snapshot.");
  }
  return json;
}

export async function postConfirmIdentity(
  leadId: string,
  body: ConfirmIdentityRequestBody,
): Promise<ConfirmIdentityResponseBody> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/surface-scan/confirm-identity/${encodeURIComponent(leadId)}`,
    {
      method: "POST",
      headers: onboardingJsonHeaders(),
      body: JSON.stringify(body),
    },
  );
  const json = await readJsonOrThrow(response);
  if (
    !json ||
    typeof json !== "object" ||
    (json as { success?: unknown }).success !== true
  ) {
    throw httpErrorFromResponse(response, json);
  }
  return json as ConfirmIdentityResponseBody;
}

export async function getIntelligenceStatus(
  leadId: string,
): Promise<IntelligenceStatusResponse> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/surface-scan/intelligence/${encodeURIComponent(leadId)}`,
    { method: "GET" },
  );
  const json = await readJsonOrThrow(response);
  if (
    !json ||
    typeof json !== "object" ||
    typeof (json as { leadId?: unknown }).leadId !== "string"
  ) {
    throw new Error("Unexpected response from intelligence status.");
  }
  return json as IntelligenceStatusResponse;
}

export async function getCheckpoint2(
  leadId: string,
): Promise<Checkpoint2Response> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/surface-scan/checkpoint-2/${encodeURIComponent(leadId)}`,
    { method: "GET" },
  );
  const json = await readJsonOrThrow(response);
  if (!isCheckpoint2Response(json)) {
    throw new Error("Unexpected response from checkpoint-2 fetch.");
  }
  return json;
}

export async function postConfirmCheckpoint2(
  leadId: string,
  body: ConfirmCheckpoint2RequestBody,
): Promise<ConfirmCheckpoint2ResponseBody> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/surface-scan/checkpoint-2/${encodeURIComponent(leadId)}/confirm`,
    {
      method: "POST",
      headers: onboardingJsonHeaders(),
      body: JSON.stringify(body),
    },
  );
  const json = await readJsonOrThrow(response);
  if (
    !json ||
    typeof json !== "object" ||
    (json as { success?: unknown }).success !== true
  ) {
    throw httpErrorFromResponse(response, json);
  }
  return json as ConfirmCheckpoint2ResponseBody;
}

export async function getBrandProfile(
  brandProfileId: string,
): Promise<BrandProfileResponseBody> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/profiles/${encodeURIComponent(brandProfileId)}`,
    { method: "GET" },
  );
  const json = await readJsonOrThrow(response);
  if (!isBrandProfileResponse(json)) {
    throw new Error("Unexpected response from brand profile fetch.");
  }
  return json;
}

export async function sendBrandVerificationOtp(
  brandProfileId: string,
  email: string,
): Promise<SendBrandVerificationResponseBody> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/profiles/${encodeURIComponent(brandProfileId)}/verification/send`,
    {
      method: "POST",
      headers: onboardingJsonHeaders(),
      body: JSON.stringify({ email }),
    },
  );
  const json = await readJsonOrThrow(response);
  if (
    !json ||
    typeof json !== "object" ||
    typeof (json as { sent?: unknown }).sent !== "boolean" ||
    typeof (json as { expiresAt?: unknown }).expiresAt !== "string"
  ) {
    throw new Error("Unexpected response from verification send.");
  }
  return json as SendBrandVerificationResponseBody;
}

export async function verifyBrandVerificationOtp(
  brandProfileId: string,
  body: { email: string; otp: string },
): Promise<VerifyBrandVerificationResponseBody> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/profiles/${encodeURIComponent(brandProfileId)}/verification/verify`,
    {
      method: "POST",
      headers: onboardingJsonHeaders(),
      body: JSON.stringify(body),
    },
  );
  const json = await readJsonOrThrow(response);
  if (
    !json ||
    typeof json !== "object" ||
    typeof (json as { verified?: unknown }).verified !== "boolean"
  ) {
    throw new Error("Unexpected response from verification verify.");
  }
  return json as VerifyBrandVerificationResponseBody;
}

export async function patchBrandProfile(
  brandProfileId: string,
  body: PatchBrandProfileRequestBody,
): Promise<BrandProfileResponseBody> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/profiles/${encodeURIComponent(brandProfileId)}`,
    {
      method: "PATCH",
      headers: onboardingJsonHeaders(),
      body: JSON.stringify(body),
    },
  );
  const json = await readJsonOrThrow(response);
  if (!isBrandProfileResponse(json)) {
    throw new Error("Unexpected response from brand profile update.");
  }
  return json;
}

export async function syncBrandOfferings(
  brandProfileId: string,
  offerings: SyncOfferingItem[],
): Promise<BrandProfileResponseBody> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/profiles/${encodeURIComponent(brandProfileId)}/offerings`,
    {
      method: "PATCH",
      headers: onboardingJsonHeaders(),
      body: JSON.stringify({ offerings }),
    },
  );
  const json = await readJsonOrThrow(response);
  if (!isBrandProfileResponse(json)) {
    throw new Error("Unexpected response from offerings sync.");
  }
  return json;
}

export async function uploadOfferingImage(
  brandProfileId: string,
  offeringId: string,
  body: { imageBase64: string; contentType?: string },
): Promise<{ imageUrl: string }> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/profiles/${encodeURIComponent(brandProfileId)}/offerings/${encodeURIComponent(offeringId)}/image`,
    {
      method: "POST",
      headers: onboardingJsonHeaders(),
      body: JSON.stringify(body),
    },
  );
  const json = await readJsonOrThrow(response);
  if (
    !json ||
    typeof json !== "object" ||
    typeof (json as { imageUrl?: unknown }).imageUrl !== "string"
  ) {
    throw new Error("Unexpected response from offering image upload.");
  }
  return json as { imageUrl: string };
}

export async function uploadBrandLogo(
  brandProfileId: string,
  body: { imageBase64: string; contentType?: string },
): Promise<{ imageUrl: string }> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/profiles/${encodeURIComponent(brandProfileId)}/logo`,
    {
      method: "POST",
      headers: onboardingJsonHeaders(),
      body: JSON.stringify(body),
    },
  );
  const json = await readJsonOrThrow(response);
  if (
    !json ||
    typeof json !== "object" ||
    typeof (json as { imageUrl?: unknown }).imageUrl !== "string"
  ) {
    throw new Error("Unexpected response from brand logo upload.");
  }
  return json as { imageUrl: string };
}

export async function uploadCompetitorLogo(
  brandProfileId: string,
  competitorId: string,
  body: { imageBase64: string; contentType?: string },
): Promise<{ imageUrl: string }> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/profiles/${encodeURIComponent(brandProfileId)}/competitors/${encodeURIComponent(competitorId)}/logo`,
    {
      method: "POST",
      headers: onboardingJsonHeaders(),
      body: JSON.stringify(body),
    },
  );
  const json = await readJsonOrThrow(response);
  if (
    !json ||
    typeof json !== "object" ||
    typeof (json as { imageUrl?: unknown }).imageUrl !== "string"
  ) {
    throw new Error("Unexpected response from competitor logo upload.");
  }
  return json as { imageUrl: string };
}

export async function syncBrandCompetitors(
  brandProfileId: string,
  competitors: SyncCompetitorItem[],
): Promise<BrandProfileResponseBody> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/profiles/${encodeURIComponent(brandProfileId)}/competitors`,
    {
      method: "PATCH",
      headers: onboardingJsonHeaders(),
      body: JSON.stringify({ competitors }),
    },
  );
  const json = await readJsonOrThrow(response);
  if (!isBrandProfileResponse(json)) {
    throw new Error("Unexpected response from competitors sync.");
  }
  return json;
}
