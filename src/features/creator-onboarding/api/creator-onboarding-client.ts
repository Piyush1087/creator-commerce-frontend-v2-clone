import { env } from "../../../shared/config/env";

import {

  ApiRequestError,

  parseApiErrorBody,

} from "../../../shared/api/parse-api-error";

import {

  authAuthorizationHeader,

  saveAuthSession,

  type AuthSessionV1,

} from "../../../shared/auth/auth-session";

import { isAuthTokenResponse } from "../../auth/contracts/auth.contracts";

import type {

  ActivateSyncResponse,

  HandleCheckResponse,

  MetaConnectResponse,

  OnboardingTrackResponse,

  SignupResponse,

  StageFeaturesResponse,

} from "../contracts/creator-onboarding.contracts";

import type { ActivatedModule } from "../contracts/creator-onboarding.contracts";



const BASE = `${env.apiUrl}/api/v1/creator-onboarding`;

const INSTAGRAM_BASE = `${env.apiUrl}/api/v1/instagram`;



const JSON_HEADERS = { "Content-Type": "application/json" } as const;



async function readJsonOrThrow(response: Response): Promise<unknown> {

  const text = await response.text();

  let body: unknown = undefined;

  try {

    body = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;

  } catch {

    throw new Error("The server returned an invalid response. Please try again.");

  }

  if (!response.ok) {

    throw parseApiErrorBody(response.status, body);

  }

  return body;

}



export { ApiRequestError, isApiRequestError } from "../../../shared/api/parse-api-error";



export async function fetchInstagramOAuthUrl(

  redirectUri: string,

): Promise<{ url: string; state: string }> {

  const response = await fetch(

    `${INSTAGRAM_BASE}/oauth-url?redirectUri=${encodeURIComponent(redirectUri)}`,

  );

  const json = (await readJsonOrThrow(response)) as { url?: string; state?: string };

  if (!json.url || !json.state) {

    throw new Error("Instagram OAuth is not configured on the server.");

  }

  return { url: json.url, state: json.state };

}



export async function checkCreatorHandle(

  instagramHandle: string,

): Promise<HandleCheckResponse> {

  const response = await fetch(`${BASE}/handle-check`, {

    method: "POST",

    headers: JSON_HEADERS,

    body: JSON.stringify({ instagramHandle }),

  });

  return (await readJsonOrThrow(response)) as HandleCheckResponse;

}



export async function stageCreatorFeatures(

  onboardingTrackId: string,

  stagedModules: ActivatedModule[],

): Promise<StageFeaturesResponse> {

  const response = await fetch(`${BASE}/stage-features`, {

    method: "POST",

    headers: JSON_HEADERS,

    body: JSON.stringify({ onboardingTrackId, stagedModules }),

  });

  return (await readJsonOrThrow(response)) as StageFeaturesResponse;

}



export async function signupCreatorAccount(args: {

  onboardingTrackId: string;

  email: string;

  password: string;

}): Promise<SignupResponse> {

  const response = await fetch(`${BASE}/signup`, {

    method: "POST",

    headers: JSON_HEADERS,

    body: JSON.stringify(args),

  });

  return (await readJsonOrThrow(response)) as SignupResponse;

}



export async function verifyCreatorSignupOtp(

  email: string,

  otpCode: string,

): Promise<{ accessToken: string }> {

  const response = await fetch(`${BASE}/verify-otp`, {

    method: "POST",

    headers: JSON_HEADERS,

    body: JSON.stringify({ email, otpCode }),

  });

  const json = await readJsonOrThrow(response);

  if (!isAuthTokenResponse(json)) {

    throw new Error("Unexpected verification response.");

  }

  const session: AuthSessionV1 = {

    accessToken: json.accessToken,

    user: json.user,

  };

  saveAuthSession(session);

  return { accessToken: json.accessToken };

}



export async function joinCreatorWaitlist(

  onboardingTrackId: string,

  email: string,

): Promise<{ waitlistLeadId: string }> {

  const response = await fetch(`${BASE}/waitlist`, {

    method: "POST",

    headers: JSON_HEADERS,

    body: JSON.stringify({ onboardingTrackId, email }),

  });

  return (await readJsonOrThrow(response)) as { waitlistLeadId: string };

}



export async function connectCreatorMeta(args: {

  onboardingTrackId: string;

  code: string;

  redirectUri: string;

}): Promise<MetaConnectResponse> {

  const response = await fetch(`${BASE}/meta-connect`, {

    method: "POST",

    headers: {

      ...JSON_HEADERS,

      ...authAuthorizationHeader(),

    },

    body: JSON.stringify(args),

  });

  return (await readJsonOrThrow(response)) as MetaConnectResponse;

}



export async function activateCreatorSync(

  onboardingTrackId: string,

  options?: { skipInstagramConnect?: boolean },

): Promise<ActivateSyncResponse> {

  const response = await fetch(`${BASE}/activate-sync`, {

    method: "POST",

    headers: {

      ...JSON_HEADERS,

      ...authAuthorizationHeader(),

    },

    body: JSON.stringify({

      onboardingTrackId,

      userConfirmedSync: true,

      skipInstagramConnect: options?.skipInstagramConnect ?? false,

    }),

  });

  return (await readJsonOrThrow(response)) as ActivateSyncResponse;

}



export async function fetchOnboardingTrack(

  trackId: string,

): Promise<OnboardingTrackResponse> {

  const response = await fetch(`${BASE}/track/${encodeURIComponent(trackId)}`, {

    method: "GET",

    headers: JSON_HEADERS,

  });

  return (await readJsonOrThrow(response)) as OnboardingTrackResponse;

}


