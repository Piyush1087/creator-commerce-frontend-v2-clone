import { env } from "../../../shared/config/env";
import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import type {
  AnalyticsPulseResponse,
  MediaKitResponse,
  MediaKitSavePayload,
} from "../contracts/creator-centre.contracts";

const BASE = `${env.apiUrl}/api/v1/creator-centre`;

function jsonHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error(
      "The server returned an invalid response. Please try again.",
    );
  }
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return body;
}

export async function fetchMediaKit(): Promise<MediaKitResponse> {
  const response = await fetch(`${BASE}/media-kit`, {
    method: "GET",
    headers: jsonHeaders(),
  });
  return (await readJsonOrThrow(response)) as MediaKitResponse;
}

export async function saveMediaKit(
  payload: MediaKitSavePayload,
): Promise<MediaKitResponse> {
  const response = await fetch(`${BASE}/media-kit`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return (await readJsonOrThrow(response)) as MediaKitResponse;
}

export async function fetchAnalyticsPulse(
  limitCount = 5,
): Promise<AnalyticsPulseResponse> {
  const params = new URLSearchParams({ limitCount: String(limitCount) });
  const response = await fetch(`${BASE}/analytics/pulse?${params}`, {
    method: "GET",
    headers: jsonHeaders(),
  });
  return (await readJsonOrThrow(response)) as AnalyticsPulseResponse;
}
