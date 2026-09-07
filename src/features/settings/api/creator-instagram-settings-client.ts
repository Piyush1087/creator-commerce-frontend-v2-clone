import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import { authorizeCreatorInstagram } from "../../creator-onboarding/api/creator-entry-client";
import {
  isCreatorInstagramMutationResponse,
  isCreatorInstagramReconnectAuthorization,
  isCreatorInstagramSettingsReadModel,
  type CreatorInstagramCallbackBody,
  type CreatorInstagramMutationResponse,
  type CreatorInstagramReconnectAuthorization,
  type CreatorInstagramSettingsReadModel,
} from "../contracts/creator-instagram-settings.contracts";

const BASE = `${env.apiUrl}/api/v1/creator/settings/instagram`;
const JSON_HEADERS = { "Content-Type": "application/json" } as const;

export class CreatorInstagramSettingsApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly manualReviewRequired = false,
  ) {
    super(message);
    this.name = "CreatorInstagramSettingsApiError";
  }
}

async function bodyOf(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new CreatorInstagramSettingsApiError(
      "The server returned an invalid response.",
      "INVALID_RESPONSE",
    );
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

async function read<T>(
  response: Response,
  validate: (value: unknown) => value is T,
): Promise<T> {
  const body = await bodyOf(response);
  if (!response.ok) {
    const record = asRecord(body);
    throw new CreatorInstagramSettingsApiError(
      typeof record?.message === "string"
        ? record.message
        : `Instagram Settings request failed (${response.status}).`,
      typeof record?.code === "string" ? record.code : undefined,
      record?.manualReviewRequired === true,
    );
  }
  if (!validate(body)) {
    throw new CreatorInstagramSettingsApiError(
      "Instagram Settings returned an unexpected response.",
      "INVALID_RESPONSE",
    );
  }
  return body;
}

async function request<T>(
  path: string,
  method: "GET" | "POST" | "DELETE",
  validate: (value: unknown) => value is T,
  body?: object,
): Promise<T> {
  return read(
    await authenticatedFetch(`${BASE}${path}`, {
      method,
      cache: "no-store",
      ...(body ? { headers: JSON_HEADERS, body: JSON.stringify(body) } : {}),
    }),
    validate,
  );
}

export const fetchCreatorInstagramSettings = () =>
  request<CreatorInstagramSettingsReadModel>(
    "",
    "GET",
    isCreatorInstagramSettingsReadModel,
  );

/** C01 remains the sole initial permanent-identity connection authority. */
export const authorizeCreatorInstagramSettingsInitial = () =>
  authorizeCreatorInstagram();

export const revalidateCreatorInstagramSettings = () =>
  request<CreatorInstagramMutationResponse>(
    "/revalidate",
    "POST",
    isCreatorInstagramMutationResponse,
  );

export const authorizeCreatorInstagramSettingsReconnect = () =>
  request<CreatorInstagramReconnectAuthorization>(
    "/reconnect/authorize",
    "POST",
    isCreatorInstagramReconnectAuthorization,
  );

export const completeCreatorInstagramSettingsReconnect = (
  body: CreatorInstagramCallbackBody,
) =>
  request<CreatorInstagramMutationResponse>(
    "/reconnect/complete",
    "POST",
    isCreatorInstagramMutationResponse,
    body,
  );

export const disconnectCreatorInstagramSettings = () =>
  request<CreatorInstagramMutationResponse>(
    "",
    "DELETE",
    isCreatorInstagramMutationResponse,
  );
