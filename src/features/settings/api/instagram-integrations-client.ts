import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  isInstagramConnectResponse,
  isInstagramDeletionReceipt,
  isInstagramIntegrationsReadModel,
  isInstagramOAuthUrlResponse,
  type InstagramConnectResponse,
  type InstagramDeletionReceipt,
  type InstagramIntegrationsReadModel,
  type InstagramOAuthIntent,
  type InstagramOAuthUrlResponse,
} from "../contracts/instagram-integrations.contracts";

const BASE = `${env.apiUrl}/api/v1/brand/settings/integrations`;
const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
} as const;

export class InstagramIntegrationsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);
    this.name = "InstagramIntegrationsApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorDetails(
  body: unknown,
  fallback: string,
): { message: string; code: string | null } {
  if (!isRecord(body)) return { message: fallback, code: null };
  const nested = isRecord(body.message) ? body.message : null;
  const message =
    typeof nested?.message === "string"
      ? nested.message
      : typeof body.message === "string"
        ? body.message
        : fallback;
  const code =
    typeof nested?.code === "string"
      ? nested.code
      : typeof body.code === "string"
        ? body.code
        : null;
  return { message, code };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new InstagramIntegrationsApiError(
      "The server returned an invalid Instagram response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }
  if (!response.ok) {
    const details = errorDetails(
      body,
      `Instagram request failed (${response.status}).`,
    );
    throw new InstagramIntegrationsApiError(
      details.message,
      response.status,
      details.code,
    );
  }
  return body;
}

function unexpected(response: Response, surface: string): never {
  throw new InstagramIntegrationsApiError(
    `The server returned an unexpected ${surface} response. Refresh and try again.`,
    response.status,
    "INVALID_RESPONSE",
  );
}

export async function fetchInstagramIntegrations(): Promise<InstagramIntegrationsReadModel> {
  const response = await fetch(BASE, { method: "GET", headers: JSON_HEADERS });
  const body = await readJson(response);
  if (!isInstagramIntegrationsReadModel(body))
    return unexpected(response, "integrations");
  return body;
}

export async function getInstagramOAuthUrl(
  redirectUri: string,
  intent: InstagramOAuthIntent,
): Promise<InstagramOAuthUrlResponse> {
  const query = new URLSearchParams({ redirectUri, intent });
  const response = await fetch(
    `${BASE}/instagram/oauth-url?${query.toString()}`,
    {
      method: "GET",
      headers: JSON_HEADERS,
      cache: "no-store",
      referrerPolicy: "no-referrer",
    },
  );
  const body = await readJson(response);
  if (!isInstagramOAuthUrlResponse(body))
    return unexpected(response, "OAuth URL");
  return body;
}

export async function connectInstagram(input: {
  code: string;
  state: string;
  redirectUri: string;
}): Promise<InstagramConnectResponse> {
  const response = await fetch(`${BASE}/instagram/connect`, {
    method: "POST",
    headers: JSON_HEADERS,
    referrerPolicy: "no-referrer",
    body: JSON.stringify(input),
  });
  const body = await readJson(response);
  if (!isInstagramConnectResponse(body)) return unexpected(response, "connect");
  return body;
}

export async function cancelPendingInstagramAccountChange(input: {
  integrationId: string;
  currentPlatformHandle: string;
  inboundOauthHandle: string;
}): Promise<void> {
  const response = await fetch(`${BASE}/resolve-identity-conflict`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ ...input, resolution: "CANCEL_CONNECT" }),
  });
  const body = await readJson(response);
  if (
    !isRecord(body) ||
    body.ok !== true ||
    body.resolution !== "CANCEL_CONNECT"
  ) {
    return unexpected(response, "account-change cancellation");
  }
}

export async function disconnectInstagram(
  integrationId: string,
): Promise<void> {
  const response = await fetch(`${BASE}/manage`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ integrationId, action: "DISCONNECT_INTEGRATION" }),
  });
  const body = await readJson(response);
  if (
    !isRecord(body) ||
    body.ok !== true ||
    body.action !== "DISCONNECT_INTEGRATION"
  ) {
    return unexpected(response, "disconnect");
  }
}

export async function deleteInstagramConnectionData(
  integrationId: string,
): Promise<InstagramDeletionReceipt> {
  const response = await fetch(`${BASE}/manage`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      integrationId,
      action: "DELETE_INGESTED_DATA",
      confirmDeleteData: true,
    }),
  });
  const body = await readJson(response);
  if (!isInstagramDeletionReceipt(body))
    return unexpected(response, "deletion receipt");
  return body;
}
