import { env } from "../../../shared/config/env";
import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import {
  isEscrowBreakdownApiResponse,
  isEscrowLedgerApiResponse,
  isEscrowTopUpIntentApiResponse,
  isEscrowVaultApiResponse,
  type EscrowBreakdownApiResponse,
  type EscrowLedgerApiEntry,
  type EscrowTopUpIntentApiResponse,
  type EscrowVaultApiResponse,
} from "../contracts/escrow.contracts";

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

export class EscrowApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "EscrowApiError";
    this.status = status;
  }
}

function authHeaders(): Record<string, string> {
  return {
    ...JSON_HEADERS,
  };
}

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new EscrowApiError(
      "The server returned an invalid response. Please try again.",
      response.status,
    );
  }

  if (!response.ok) {
    const rawMessage =
      typeof body === "object" && body !== null
        ? (body as { message?: unknown }).message
        : undefined;
    const message = Array.isArray(rawMessage)
      ? rawMessage
          .filter((item): item is string => typeof item === "string")
          .join(", ")
      : typeof rawMessage === "string"
        ? rawMessage
        : `Request failed (${response.status}).`;
    throw new EscrowApiError(message, response.status);
  }

  return body;
}

export async function fetchEscrowVault(): Promise<EscrowVaultApiResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/escrow/vault`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isEscrowVaultApiResponse(json)) {
    throw new EscrowApiError(
      "Unexpected escrow vault response.",
      response.status,
    );
  }
  return json;
}

export async function initializeEscrowVault(): Promise<EscrowVaultApiResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/escrow/initialize`, {
    method: "POST",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isEscrowVaultApiResponse(json)) {
    throw new EscrowApiError(
      "Unexpected escrow initialize response.",
      response.status,
    );
  }
  return json;
}

export async function fetchEscrowLedger(
  limit = 50,
): Promise<EscrowLedgerApiEntry[]> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/escrow/ledger?limit=${encodeURIComponent(String(limit))}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );
  const json = await readJsonOrThrow(response);
  if (!isEscrowLedgerApiResponse(json)) {
    throw new EscrowApiError(
      "Unexpected escrow ledger response.",
      response.status,
    );
  }
  return json;
}

export async function createEscrowTopUpIntent(input: {
  targetAllocation: number;
  idempotencyKey: string;
}): Promise<EscrowTopUpIntentApiResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/escrow/topup-intent`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      target_allocation: input.targetAllocation,
      idempotency_key: input.idempotencyKey,
    }),
  });
  const json = await readJsonOrThrow(response);
  if (!isEscrowTopUpIntentApiResponse(json)) {
    throw new EscrowApiError(
      "Unexpected top-up intent response.",
      response.status,
    );
  }
  return json;
}

export async function fetchEscrowBreakdown(input: {
  grossCreatorQuote: number;
  currency: "INR" | "USD";
  expectedTdsPercentage: 0 | 1 | 2;
}): Promise<EscrowBreakdownApiResponse> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/escrow/calculate-breakdown`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        gross_creator_quote: input.grossCreatorQuote,
        currency: input.currency,
        expected_tds_percentage: input.expectedTdsPercentage,
      }),
    },
  );
  const json = await readJsonOrThrow(response);
  if (!isEscrowBreakdownApiResponse(json)) {
    throw new EscrowApiError("Unexpected breakdown response.", response.status);
  }
  return json;
}
