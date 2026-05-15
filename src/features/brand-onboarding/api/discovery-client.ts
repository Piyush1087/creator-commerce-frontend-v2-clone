import { env } from "../../../shared/config/env";
import type {
  DiscoverValidateRequestBody,
  DiscoverValidateResponse,
  DiscoveryResolveResponse,
} from "../contracts/discovery.contracts";
import {
  isDiscoverValidateResponse,
  isDiscoveryResolveResponse,
} from "../contracts/discovery.contracts";

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

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
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return body;
}

export async function postDiscoveryResolve(
  body: DiscoverValidateRequestBody,
): Promise<DiscoveryResolveResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/discovery/resolve`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  const json = await readJsonOrThrow(response);
  if (!isDiscoveryResolveResponse(json)) {
    throw new Error("Unexpected response from discovery resolve.");
  }
  return json;
}

export async function postDiscoveryValidate(
  body: DiscoverValidateRequestBody,
): Promise<DiscoverValidateResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/discovery/validate`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  const json = await readJsonOrThrow(response);
  if (!isDiscoverValidateResponse(json)) {
    throw new Error("Unexpected response from discovery validate.");
  }
  return json;
}
