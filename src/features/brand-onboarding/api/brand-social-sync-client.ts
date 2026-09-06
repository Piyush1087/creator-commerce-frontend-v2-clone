import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import { InstagramIntegrationsApiError } from "../../settings/api/instagram-integrations-client";
import {
  INSTAGRAM_INTEGRATION_SCOPES,
  INSTAGRAM_LEGACY_STATUSES,
  type InstagramIntegrationScope,
  type InstagramLegacyStatus,
} from "../../settings/contracts/instagram-integrations.contracts";

const BASE = `${env.apiUrl}/api/v1/brand/social-sync`;
const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
} as const;

export type InvitedInstagramConnectResult = {
  connected: true;
  handle: string;
  status: InstagramLegacyStatus;
  scopes: InstagramIntegrationScope[];
  brandProfileId: string;
  inviteCompleted: true;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCanonicalString<T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === "string" && values.includes(value as T[number]);
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function details(
  body: unknown,
  fallback: string,
): { message: string; code: string | null } {
  if (!isRecord(body)) return { message: fallback, code: null };
  const nested = isRecord(body.message) ? body.message : null;
  return {
    message:
      typeof nested?.message === "string"
        ? nested.message
        : typeof body.message === "string"
          ? body.message
          : fallback,
    code:
      typeof nested?.code === "string"
        ? nested.code
        : typeof body.code === "string"
          ? body.code
          : null,
  };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new InstagramIntegrationsApiError(
      "The server returned an invalid social-sync response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }
  if (!response.ok) {
    const error = details(
      body,
      `Social-sync request failed (${response.status}).`,
    );
    throw new InstagramIntegrationsApiError(
      error.message,
      response.status,
      error.code,
    );
  }
  return body;
}

export async function startInvitedInstagramOAuth(
  token: string,
  redirectUri: string,
): Promise<{ url: string; state: string }> {
  const query = new URLSearchParams({ token, redirectUri });
  const response = await globalThis.fetch(
    `${BASE}/invite/instagram/oauth-url?${query.toString()}`,
    {
      method: "GET",
      headers: JSON_HEADERS,
      referrerPolicy: "no-referrer",
    },
  );
  const body = await readJson(response);
  if (
    !isRecord(body) ||
    !isHttpUrl(body.url) ||
    typeof body.state !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(body.state)
  ) {
    throw new InstagramIntegrationsApiError(
      "The server returned an unexpected invitation OAuth response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }
  return { url: body.url, state: body.state };
}

export async function connectInvitedInstagram(input: {
  token: string;
  code: string;
  state: string;
  redirectUri: string;
}): Promise<InvitedInstagramConnectResult> {
  const response = await globalThis.fetch(`${BASE}/invite/connect`, {
    method: "POST",
    headers: JSON_HEADERS,
    referrerPolicy: "no-referrer",
    body: JSON.stringify(input),
  });
  const body = await readJson(response);
  if (
    !isRecord(body) ||
    body.connected !== true ||
    typeof body.handle !== "string" ||
    !isCanonicalString(INSTAGRAM_LEGACY_STATUSES, body.status) ||
    !Array.isArray(body.scopes) ||
    !body.scopes.every((scope) =>
      isCanonicalString(INSTAGRAM_INTEGRATION_SCOPES, scope),
    ) ||
    typeof body.brandProfileId !== "string" ||
    body.inviteCompleted !== true
  ) {
    throw new InstagramIntegrationsApiError(
      "The server returned an unexpected invitation connect response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }
  return body as InvitedInstagramConnectResult;
}

export async function skipBrandSocialSync(): Promise<void> {
  const response = await authenticatedFetch(`${BASE}/skip`, {
    method: "POST",
    headers: JSON_HEADERS,
  });
  const body = await readJson(response);
  if (!isRecord(body) || body.skipped !== true) {
    throw new InstagramIntegrationsApiError(
      "The server did not confirm social-sync skip.",
      response.status,
      "INVALID_RESPONSE",
    );
  }
}

export async function inviteBrandSocialSyncTeammate(
  email: string,
): Promise<void> {
  const response = await authenticatedFetch(`${BASE}/invite`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  });
  const body = await readJson(response);
  if (!isRecord(body) || body.sent !== true) {
    throw new InstagramIntegrationsApiError(
      "The server did not confirm the invitation.",
      response.status,
      "INVALID_RESPONSE",
    );
  }
}
