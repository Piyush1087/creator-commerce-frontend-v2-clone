import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import {
  adoptAuthSession,
  clearAuthSession,
  getAuthSessionSnapshot,
  updateCurrentUser,
} from "../../../shared/auth/auth-session";
import { env } from "../../../shared/config/env";
import type {
  AuthMeResponseBody,
  AuthTokenResponseBody,
} from "../contracts/auth.contracts";
import { isAuthTokenResponse } from "../contracts/auth.contracts";

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

function nestedHttpMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const raw = (body as { message?: unknown }).message;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw;
  }
  if (Array.isArray(raw)) {
    const parts = raw.filter(
      (item): item is string => typeof item === "string",
    );
    return parts.length > 0 ? parts.join(" ") : undefined;
  }
  return undefined;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(
      "The server returned an invalid response. Please try again.",
    );
  }
}

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const body = await readBody(response);
  if (!response.ok) {
    throw new Error(
      nestedHttpMessage(body) ?? `Request failed (${response.status}).`,
    );
  }
  return body;
}

async function publicJsonRequest(
  path: string,
  body: Record<string, string>,
): Promise<unknown> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(body),
  });
  return readJsonOrThrow(response);
}

function adoptTokenResponse(body: unknown, fallbackMessage: string) {
  if (!isAuthTokenResponse(body)) {
    throw new Error(fallbackMessage);
  }
  adoptAuthSession(body);
  return body;
}

export async function loginWithPassword(body: {
  email: string;
  password: string;
}): Promise<AuthTokenResponseBody> {
  const result = await publicJsonRequest("/api/v1/auth/login", body);
  return adoptTokenResponse(result, "Unexpected login response.");
}

export async function requestLoginOtp(email: string): Promise<void> {
  await publicJsonRequest("/api/v1/auth/otp/request", { email });
}

export async function verifyLoginOtp(body: {
  email: string;
  code: string;
}): Promise<AuthTokenResponseBody> {
  const result = await publicJsonRequest("/api/v1/auth/otp/verify", body);
  return adoptTokenResponse(result, "Unexpected verification response.");
}

export async function signInWithGoogle(body: {
  idToken: string;
  onboardingTrackId?: string;
}): Promise<AuthTokenResponseBody> {
  const result = await publicJsonRequest("/api/v1/auth/google/signin", body);
  return adoptTokenResponse(result, "Unexpected Google sign-in response.");
}

export async function fetchAuthMe(): Promise<AuthMeResponseBody> {
  const response = await authenticatedFetch(`${env.apiUrl}/api/v1/auth/me`, {
    method: "GET",
    cache: "no-store",
  });
  const json = await readJsonOrThrow(response);
  if (!json || typeof json !== "object") {
    throw new Error("Unexpected profile response.");
  }
  const user = json as {
    id?: unknown;
    email?: unknown;
    name?: unknown;
    role?: unknown;
    authState?: unknown;
    authMethods?: unknown;
    brandMemberships?: unknown;
  };
  if (
    typeof user.id !== "string" ||
    typeof user.email !== "string" ||
    (typeof user.name !== "string" && user.name !== null) ||
    typeof user.role !== "string" ||
    typeof user.authState !== "string" ||
    !Array.isArray(user.authMethods) ||
    !user.authMethods.every(
      (method) =>
        method &&
        typeof method === "object" &&
        ["PASSWORD", "GOOGLE", "EMAIL_OTP"].includes(
          String((method as { type?: unknown }).type),
        ) &&
        (typeof (method as { verifiedAt?: unknown }).verifiedAt === "string" ||
          (method as { verifiedAt?: unknown }).verifiedAt === null),
    ) ||
    !Array.isArray(user.brandMemberships) ||
    !user.brandMemberships.every(
      (membership) =>
        membership &&
        typeof membership === "object" &&
        typeof (membership as { brandProfileId?: unknown }).brandProfileId ===
          "string" &&
        typeof (membership as { role?: unknown }).role === "string" &&
        typeof (membership as { isActive?: unknown }).isActive === "boolean",
    )
  ) {
    throw new Error("Unexpected profile response.");
  }
  return json as AuthMeResponseBody;
}

export async function refreshAuthSessionFromServer(): Promise<AuthMeResponseBody> {
  const user = await fetchAuthMe();
  updateCurrentUser(user);
  return user;
}

async function endSession(path: "logout" | "logout-all"): Promise<void> {
  const response = await authenticatedFetch(
    `${env.apiUrl}/api/v1/auth/${path}`,
    {
      method: "POST",
      cache: "no-store",
    },
  );
  if (response.ok) {
    clearAuthSession();
    return;
  }
  if (
    response.status === 401 &&
    getAuthSessionSnapshot().status === "UNAUTHENTICATED"
  ) {
    // The shared refresh authority already proved this browser session cannot
    // be restored through its refresh credential.
    return;
  }
  await readJsonOrThrow(response);
}

export function logoutCurrentSession(): Promise<void> {
  return endSession("logout");
}

export function logoutAllSessions(): Promise<void> {
  return endSession("logout-all");
}

export async function forgotPassword(email: string): Promise<void> {
  await publicJsonRequest("/api/v1/auth/password/forgot", { email });
}

export async function resetPassword(body: {
  token: string;
  newPassword: string;
}): Promise<void> {
  await publicJsonRequest("/api/v1/auth/password/reset", body);
  clearAuthSession();
}

export async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const response = await authenticatedFetch(
    `${env.apiUrl}/api/v1/auth/password/change`,
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    },
  );
  await readJsonOrThrow(response);
  clearAuthSession();
}
