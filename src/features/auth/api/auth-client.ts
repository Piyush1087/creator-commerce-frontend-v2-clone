import { env } from "../../../shared/config/env";
import {
  authAuthorizationHeader,
  loadAuthSession,
  saveAuthSession,
  type AuthSessionV1,
} from "../../../shared/auth/auth-session";
import type {
  AuthTokenResponseBody,
  CompleteBrandRegistrationResponseBody,
} from "../contracts/auth.contracts";
import { isAuthTokenResponse } from "../contracts/auth.contracts";

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

function persistAuthResponse(body: AuthTokenResponseBody): void {
  const session: AuthSessionV1 = {
    accessToken: body.accessToken,
    user: body.user,
  };
  saveAuthSession(session);
}

/** Unified login — role is inferred from the user record (brand or creator). */
export async function login(body: {
  email: string;
  otp: string;
}): Promise<AuthTokenResponseBody> {
  const response = await fetch(`${env.apiUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      email: body.email,
      otp: body.otp,
    }),
  });
  const json = await readJsonOrThrow(response);
  if (!isAuthTokenResponse(json)) {
    throw new Error("Unexpected login response.");
  }
  persistAuthResponse(json);
  try {
    await refreshAuthSessionFromServer();
  } catch {
    // keep login token + user from login response
  }
  return json;
}

/** @deprecated Use `login` — kept for call-site compatibility during migration. */
export const loginBrand = login;

export async function refreshAuthSessionFromServer(): Promise<void> {
  const session = loadAuthSession();
  if (!session?.accessToken) {
    return;
  }
  const user = await fetchAuthMe();
  saveAuthSession({ accessToken: session.accessToken, user });
}

export async function completeBrandRegistration(body: {
  brandProfileId: string;
}): Promise<CompleteBrandRegistrationResponseBody> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/auth/brand/complete-registration`,
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    },
  );
  const json = await readJsonOrThrow(response);
  if (!isAuthTokenResponse(json)) {
    throw new Error("Unexpected registration response.");
  }
  persistAuthResponse(json);
  try {
    await refreshAuthSessionFromServer();
  } catch {
    // keep registration token + user from response
  }
  return json as CompleteBrandRegistrationResponseBody;
}

export async function fetchAuthMe(): Promise<AuthTokenResponseBody["user"]> {
  const response = await fetch(`${env.apiUrl}/api/v1/auth/me`, {
    method: "GET",
    headers: {
      ...JSON_HEADERS,
      ...authAuthorizationHeader(),
    },
  });
  const json = await readJsonOrThrow(response);
  if (!json || typeof json !== "object") {
    throw new Error("Unexpected profile response.");
  }
  const u = json as { id?: unknown; email?: unknown; role?: unknown };
  if (typeof u.id !== "string" || typeof u.email !== "string" || typeof u.role !== "string") {
    throw new Error("Unexpected profile response.");
  }
  return json as AuthTokenResponseBody["user"];
}
