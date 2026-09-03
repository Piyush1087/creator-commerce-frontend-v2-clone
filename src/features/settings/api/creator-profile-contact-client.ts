import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import type {
  CreatorCanonicalProfileResponse,
  CreatorDefaultContactResponse,
  UpdateCreatorCanonicalProfilePayload,
  UpsertCreatorDefaultContactPayload,
} from "../contracts/creator-profile-contact.contracts";

const BASE = `${env.apiUrl}/api/v1/creator/settings`;

export class CreatorProfileContactApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CreatorProfileContactApiError";
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new CreatorProfileContactApiError(
      "The server returned an invalid response.",
      response.status,
    );
  }
  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed (${response.status}).`;
    throw new CreatorProfileContactApiError(message, response.status);
  }
  return body as T;
}

const jsonRequest = (method: "PATCH" | "PUT", body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function fetchCreatorCanonicalProfile(): Promise<CreatorCanonicalProfileResponse> {
  return readJson(
    await authenticatedFetch(`${BASE}/profile`, { method: "GET" }),
  );
}

export async function updateCreatorCanonicalProfile(
  payload: UpdateCreatorCanonicalProfilePayload,
): Promise<CreatorCanonicalProfileResponse> {
  return readJson(
    await authenticatedFetch(`${BASE}/profile`, jsonRequest("PATCH", payload)),
  );
}

export async function fetchCreatorDefaultContact(): Promise<CreatorDefaultContactResponse> {
  return readJson(
    await authenticatedFetch(`${BASE}/contact`, { method: "GET" }),
  );
}

export async function upsertCreatorDefaultContact(
  payload: UpsertCreatorDefaultContactPayload,
): Promise<CreatorDefaultContactResponse> {
  return readJson(
    await authenticatedFetch(`${BASE}/contact`, jsonRequest("PUT", payload)),
  );
}
