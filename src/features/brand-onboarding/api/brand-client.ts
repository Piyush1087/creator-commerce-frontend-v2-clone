import { env } from "../../../shared/config/env";
import type {
  DiscoverValidateBrandActive,
  DiscoverValidateOrgClaimed,
  DiscoverValidateVerificationRequired,
} from "../contracts/discovery.contracts";
import type {
  BrandProfileResponseBody,
  PatchBrandProfileRequestBody,
  SendBrandVerificationResponseBody,
  SurfaceScanResponseBody,
  VerifyBrandVerificationResponseBody,
} from "../contracts/brand.contracts";
import {
  isBrandProfileResponse,
  isSurfaceScanResponse,
} from "../contracts/brand.contracts";
import { httpErrorFromResponse, nestHttpMessage } from "./http-api-error";

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
    throw httpErrorFromResponse(response, parsed);
  }
  if (!isSurfaceScanResponse(parsed)) {
    throw new Error("Unexpected response from surface scan.");
  }
  return parsed;
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
