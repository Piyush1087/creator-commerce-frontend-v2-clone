import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  brandReturnRequestSchema,
  brandReturnSummarySchema,
  escrowLedgerEntrySchema,
  escrowTopUpIntentSchema,
  escrowVaultSchema,
  type BrandReturnRequestApiResponse,
  type BrandReturnSummaryApiResponse,
  type EscrowLedgerApiEntry,
  type EscrowTopUpIntentApiResponse,
  type EscrowVaultApiResponse,
} from "../contracts/escrow.contracts";

const BASE = `${env.apiUrl}/api/v1/escrow`;
const JSON_HEADERS = { "Content-Type": "application/json" } as const;

export class EscrowApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
    readonly outcomeUnknown = false,
  ) {
    super(message);
    this.name = "EscrowApiError";
  }
}

function errorProjection(body: unknown): {
  message: string | null;
  code: string | null;
} {
  if (typeof body !== "object" || body === null)
    return { message: null, code: null };
  const candidate = body as { message?: unknown; code?: unknown };
  if (typeof candidate.message === "object" && candidate.message !== null) {
    const nested = candidate.message as { message?: unknown; code?: unknown };
    return {
      message: typeof nested.message === "string" ? nested.message : null,
      code: typeof nested.code === "string" ? nested.code : null,
    };
  }
  return {
    message:
      typeof candidate.message === "string"
        ? candidate.message
        : Array.isArray(candidate.message)
          ? candidate.message
              .filter((item): item is string => typeof item === "string")
              .join(", ")
          : null,
    code: typeof candidate.code === "string" ? candidate.code : null,
  };
}

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new EscrowApiError(
      "The server returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }
  if (!response.ok) {
    const error = errorProjection(body);
    throw new EscrowApiError(
      error.message ?? `Request failed (${response.status}).`,
      response.status,
      error.code,
    );
  }
  return body;
}

async function mutationFetch(url: string, body: unknown): Promise<Response> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new EscrowApiError(
      error instanceof Error
        ? error.message
        : "The financial request outcome is unknown.",
      0,
      "OUTCOME_UNKNOWN",
      true,
    );
  }
}

function invalidContract(label: string, status: number): never {
  throw new EscrowApiError(
    `Unexpected ${label} response.`,
    status,
    "INVALID_RESPONSE",
  );
}

export async function fetchEscrowVault(): Promise<EscrowVaultApiResponse> {
  const response = await fetch(`${BASE}/vault`, { headers: JSON_HEADERS });
  const parsed = escrowVaultSchema.safeParse(await readJsonOrThrow(response));
  return parsed.success
    ? parsed.data
    : invalidContract("escrow vault", response.status);
}

export async function fetchEscrowLedger(
  limit = 50,
): Promise<EscrowLedgerApiEntry[]> {
  const response = await fetch(
    `${BASE}/ledger?limit=${encodeURIComponent(String(limit))}`,
    { headers: JSON_HEADERS },
  );
  const parsed = escrowLedgerEntrySchema
    .array()
    .safeParse(await readJsonOrThrow(response));
  return parsed.success
    ? parsed.data
    : invalidContract("escrow ledger", response.status);
}

export async function createEscrowTopUpIntent(input: {
  targetAllocation: number;
  idempotencyKey: string;
}): Promise<EscrowTopUpIntentApiResponse> {
  const response = await mutationFetch(`${BASE}/topup-intent`, {
    target_allocation: input.targetAllocation,
    idempotency_key: input.idempotencyKey,
  });
  const parsed = escrowTopUpIntentSchema.safeParse(
    await readJsonOrThrow(response),
  );
  return parsed.success
    ? parsed.data
    : invalidContract("top-up intent", response.status);
}

export async function fetchBrandReturnSummary(): Promise<BrandReturnSummaryApiResponse> {
  const response = await fetch(`${BASE}/brand-returns/summary`, {
    headers: JSON_HEADERS,
  });
  const parsed = brandReturnSummarySchema.safeParse(
    await readJsonOrThrow(response),
  );
  return parsed.success
    ? parsed.data
    : invalidContract("Brand Return summary", response.status);
}

export async function fetchBrandReturnRequests(
  limit = 50,
): Promise<BrandReturnRequestApiResponse[]> {
  const response = await fetch(
    `${BASE}/brand-returns?limit=${encodeURIComponent(String(limit))}`,
    { headers: JSON_HEADERS },
  );
  const parsed = brandReturnRequestSchema
    .array()
    .safeParse(await readJsonOrThrow(response));
  return parsed.success
    ? parsed.data
    : invalidContract("Brand Return list", response.status);
}

export async function fetchBrandReturnRequest(
  requestId: string,
): Promise<BrandReturnRequestApiResponse> {
  const response = await fetch(
    `${BASE}/brand-returns/${encodeURIComponent(requestId)}`,
    { headers: JSON_HEADERS },
  );
  const parsed = brandReturnRequestSchema.safeParse(
    await readJsonOrThrow(response),
  );
  return parsed.success
    ? parsed.data
    : invalidContract("Brand Return detail", response.status);
}

export async function createBrandReturn(input: {
  amount: number;
  idempotencyIdentity: string;
}): Promise<BrandReturnRequestApiResponse> {
  const response = await mutationFetch(`${BASE}/brand-returns`, {
    amount: input.amount,
    idempotency_identity: input.idempotencyIdentity,
  });
  const parsed = brandReturnRequestSchema.safeParse(
    await readJsonOrThrow(response),
  );
  return parsed.success
    ? parsed.data
    : invalidContract("Brand Return", response.status);
}
