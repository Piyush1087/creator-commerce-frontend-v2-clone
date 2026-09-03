import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import type {
  CreatorLegalProfileWrite,
  CreatorPayoutDestinationWrite,
  CreatorPayoutSettingsResponse,
} from "../contracts/creator-payout-settings.contract";

const BASE = `${env.apiUrl}/api/v1/creator/settings/payouts`;

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error("Payout settings returned an invalid response.");
  }
  if (!response.ok) {
    const safeMessage =
      typeof body === "object" &&
      body !== null &&
      typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : "Payout settings could not be updated.";
    throw new Error(safeMessage);
  }
  return body;
}

const jsonHeaders: HeadersInit = { "Content-Type": "application/json" };

export async function fetchCreatorPayoutSettings(): Promise<CreatorPayoutSettingsResponse> {
  const response = await fetch(BASE, { method: "GET", headers: jsonHeaders });
  return (await readJsonOrThrow(response)) as CreatorPayoutSettingsResponse;
}

export async function replaceCreatorPayoutDestination(
  payload: CreatorPayoutDestinationWrite,
): Promise<void> {
  const response = await fetch(`${BASE}/destination`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  await readJsonOrThrow(response);
}

export async function disableCreatorPayoutDestination(
  destinationId: string,
): Promise<void> {
  const response = await fetch(
    `${BASE}/destination/${encodeURIComponent(destinationId)}`,
    { method: "DELETE", headers: jsonHeaders },
  );
  await readJsonOrThrow(response);
}

export async function upsertCreatorLegalProfile(
  payload: CreatorLegalProfileWrite,
): Promise<void> {
  const response = await fetch(`${BASE}/legal-profile`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  await readJsonOrThrow(response);
}
