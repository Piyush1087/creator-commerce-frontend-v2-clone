import { env } from "../../../shared/config/env";
import type {
  DiscoverValidateRequestBody,
  DiscoverValidateResponse,
  DiscoverWaitlistRequestBody,
  DiscoverWaitlistResponseBody,
  DiscoveryResolveResponse,
} from "../contracts/discovery.contracts";
import {
  isDiscoverValidateResponse,
  isDiscoveryResolveResponse,
  isDiscoverWaitlistResponse,
} from "../contracts/discovery.contracts";
import { httpErrorFromResponse } from "./http-api-error";

/** Onboarding is anonymous until claim; do not attach dashboard JWT. */
function onboardingJsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
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
    headers: onboardingJsonHeaders(),
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
    headers: onboardingJsonHeaders(),
    body: JSON.stringify(body),
  });
  const json = await readJsonOrThrow(response);
  if (!isDiscoverValidateResponse(json)) {
    throw new Error("Unexpected response from discovery validate.");
  }
  return json;
}

export async function postDiscoveryWaitlist(
  body: DiscoverWaitlistRequestBody,
): Promise<DiscoverWaitlistResponseBody> {
  const response = await fetch(`${env.apiUrl}/api/v1/discovery/waitlist`, {
    method: "POST",
    headers: onboardingJsonHeaders(),
    body: JSON.stringify(body),
  });
  const json = await readJsonOrThrow(response);
  if (!isDiscoverWaitlistResponse(json)) {
    throw new Error("Unexpected response from discovery waitlist.");
  }
  return json;
}
