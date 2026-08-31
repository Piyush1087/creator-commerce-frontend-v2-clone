import { env } from "../../../shared/config/env";
import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import type { CreatorPayoutsHubResponse } from "../contracts/creator-payouts.contracts";

const BASE = `${env.apiUrl}/api/v1/creator/payouts`;

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

export async function fetchCreatorPayoutsHub(): Promise<CreatorPayoutsHubResponse> {
  const response = await fetch(BASE, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return (await readJsonOrThrow(response)) as CreatorPayoutsHubResponse;
}
