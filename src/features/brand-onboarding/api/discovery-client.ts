import { env } from "../../../shared/config/env";
import { authAuthorizationHeader } from "../../../shared/auth/auth-session";
import type {
  DiscoverValidateRequestBody,
  DiscoverValidateResponse,
  DiscoveryResolveResponse,
} from "../contracts/discovery.contracts";
import {
  isDiscoverValidateResponse,
  isDiscoveryResolveResponse,
} from "../contracts/discovery.contracts";
import { httpErrorFromResponse } from "./http-api-error";

function jsonHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
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
    throw httpErrorFromResponse(response, body);
  }
  return body;
}

export async function postDiscoveryResolve(
  body: DiscoverValidateRequestBody,
): Promise<DiscoveryResolveResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/discovery/resolve`, {
    method: "POST",
    headers: jsonHeaders(),
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
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const json = await readJsonOrThrow(response);
  if (!isDiscoverValidateResponse(json)) {
    throw new Error("Unexpected response from discovery validate.");
  }
  return json;
}
