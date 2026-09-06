import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { parseApiErrorBody } from "../../../shared/api/parse-api-error";
import {
  adoptAuthSession,
  isAuthSession,
} from "../../../shared/auth/auth-session";
import { env } from "../../../shared/config/env";
import type {
  CampaignContinuationIssued,
  CampaignContinuationPresence,
  CampaignContinuationResolution,
  CreatorEntryState,
  InstagramAuthorization,
  InstagramCallbackBody,
  InstagramCompletion,
  InstagramRevalidation,
  RegistrationAccepted,
  RegistrationOtpRequested,
} from "../contracts/creator-entry.contracts";

const BASE = `${env.apiUrl}/api/v1/creator-entry`;
const JSON_HEADERS = { "Content-Type": "application/json" } as const;

async function bodyOf(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

async function read<T>(response: Response): Promise<T> {
  const body = await bodyOf(response);
  if (!response.ok) throw parseApiErrorBody(response.status, body);
  return body as T;
}

async function publicPost<T>(
  path: string,
  body: Record<string, string>,
): Promise<T> {
  return read<T>(
    await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: JSON_HEADERS,
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify(body),
    }),
  );
}

async function authenticated<T>(
  path: string,
  method: "GET" | "POST",
  body?: object,
): Promise<T> {
  return read<T>(
    await authenticatedFetch(`${BASE}${path}`, {
      method,
      cache: "no-store",
      ...(body ? { headers: JSON_HEADERS, body: JSON.stringify(body) } : {}),
    }),
  );
}

async function registrationSession(path: string, body: Record<string, string>) {
  const result = await publicPost<unknown>(path, body);
  if (!isAuthSession(result))
    throw new Error("Unexpected Creator registration response.");
  adoptAuthSession(result);
  return result;
}

export const registerCreatorPassword = (body: {
  email: string;
  password: string;
}) => publicPost<RegistrationAccepted>("/register/password", body);
export const requestCreatorRegistrationOtp = (email: string) =>
  publicPost<RegistrationOtpRequested>("/register/email/otp/request", {
    email,
  });
export const verifyCreatorRegistrationOtp = (body: {
  email: string;
  code: string;
}) => registrationSession("/register/email/otp/verify", body);
export const registerCreatorGoogle = (idToken: string) =>
  registrationSession("/register/google", { idToken });
export const fetchCreatorEntryState = () =>
  authenticated<CreatorEntryState>("/state", "GET");
export const authorizeCreatorInstagram = () =>
  authenticated<InstagramAuthorization>("/instagram/authorize", "POST");
export const completeCreatorInstagram = (body: InstagramCallbackBody) =>
  authenticated<InstagramCompletion>("/instagram/complete", "POST", body);
export const revalidateCreatorInstagram = () =>
  authenticated<InstagramRevalidation>("/instagram/revalidate", "POST");
export const authorizeCreatorInstagramReconnect = () =>
  authenticated<InstagramAuthorization>(
    "/instagram/reconnect/authorize",
    "POST",
  );
export const completeCreatorInstagramReconnect = (
  body: InstagramCallbackBody,
) =>
  authenticated<InstagramCompletion>(
    "/instagram/reconnect/complete",
    "POST",
    body,
  );
export const fetchCampaignApplyContinuationStatus = async () =>
  read<CampaignContinuationPresence>(
    await fetch(`${BASE}/campaign-apply/continuation/status`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }),
  );
export const discardCampaignApplyContinuation = async () =>
  read<CampaignContinuationPresence>(
    await fetch(`${BASE}/campaign-apply/continuation/discard`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    }),
  );
export const resolveCampaignApplyContinuation = () =>
  authenticated<CampaignContinuationResolution>(
    "/campaign-apply/continuation/resolve",
    "POST",
  );

export async function issueCampaignApplyContinuation(
  campaignId: string,
): Promise<CampaignContinuationIssued> {
  return read<CampaignContinuationIssued>(
    await fetch(
      `${env.apiUrl}/api/v1/public/marketplace/campaigns/${encodeURIComponent(campaignId)}/apply-continuation`,
      {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      },
    ),
  );
}
