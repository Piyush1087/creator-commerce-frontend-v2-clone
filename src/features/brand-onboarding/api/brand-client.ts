import { env } from "../../../shared/config/env";
import type {
  BrandProfileResponseBody,
  PatchBrandProfileRequestBody,
  SurfaceScanResponseBody,
} from "../contracts/brand.contracts";
import {
  isBrandProfileResponse,
  isSurfaceScanResponse,
} from "../contracts/brand.contracts";

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

function nestHttpMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const raw = (body as { message?: unknown }).message;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw;
  }
  if (Array.isArray(raw)) {
    const parts = raw.filter((item): item is string => typeof item === "string");
    if (parts.length > 0) {
      return parts.join(" ");
    }
  }
  return undefined;
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
      nestHttpMessage(body) ?? `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return body;
}

export async function postSurfaceScan(body: {
  leadId: string;
  force?: boolean;
}): Promise<SurfaceScanResponseBody> {
  const response = await fetch(`${env.apiUrl}/api/v1/brand/surface-scan`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  const json = await readJsonOrThrow(response);
  if (!isSurfaceScanResponse(json)) {
    throw new Error("Unexpected response from surface scan.");
  }
  return json;
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

export async function patchBrandProfile(
  brandProfileId: string,
  body: PatchBrandProfileRequestBody,
): Promise<BrandProfileResponseBody> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/profiles/${encodeURIComponent(brandProfileId)}`,
    {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    },
  );
  const json = await readJsonOrThrow(response);
  if (!isBrandProfileResponse(json)) {
    throw new Error("Unexpected response from brand profile update.");
  }
  return json;
}
