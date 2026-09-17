import type { z } from "zod";

import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  creatorPayoutMethodResponseSchema,
  creatorPayoutsHistoryDetailSchema,
  creatorPayoutsHistoryResponseSchema,
  creatorPayoutsObligationDetailSchema,
  creatorPayoutsObligationsSchema,
  creatorPayoutsOverviewSchema,
} from "../contracts/creator-payouts.contracts";

const BASE = `${env.apiUrl}/api/v1/creator/payouts`;
export class CreatorPayoutsApiError extends Error {
  constructor(
    readonly kind: "AUTHORIZATION" | "NOT_FOUND" | "CONTRACT" | "UNAVAILABLE",
    readonly status: number | null,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CreatorPayoutsApiError";
  }
}

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await authenticatedFetch(`${BASE}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw await responseError(response);
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CreatorPayoutsApiError(
      "CONTRACT",
      response.status,
      "CREATOR_PAYOUTS_INVALID_JSON",
      "The payout workspace returned an unreadable response.",
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new CreatorPayoutsApiError(
      "CONTRACT",
      response.status,
      "CREATOR_PAYOUTS_SCHEMA_MISMATCH",
      "The payout workspace response could not be verified.",
    );
  return parsed.data;
}

async function responseError(
  response: Response,
): Promise<CreatorPayoutsApiError> {
  let code = "CREATOR_PAYOUTS_UNAVAILABLE";
  try {
    const body = (await response.json()) as { code?: unknown };
    if (typeof body.code === "string" && body.code.length <= 256)
      code = body.code;
  } catch {
    /* untrusted body */
  }
  if (response.status === 401 || response.status === 403)
    return new CreatorPayoutsApiError(
      "AUTHORIZATION",
      response.status,
      code,
      "Your current Creator role does not permit this payout view.",
    );
  if (response.status === 404)
    return new CreatorPayoutsApiError(
      "NOT_FOUND",
      response.status,
      code,
      "This payout record is unavailable for your current access.",
    );
  return new CreatorPayoutsApiError(
    "UNAVAILABLE",
    response.status,
    code,
    "Payout information is temporarily unavailable.",
  );
}

function page(cursor?: string) {
  const search = new URLSearchParams({ limit: "25" });
  if (cursor) search.set("cursor", cursor);
  return `?${search.toString()}`;
}
export const fetchCreatorPayoutsOverview = (signal?: AbortSignal) =>
  request("", creatorPayoutsOverviewSchema, signal);
export const fetchCreatorPayoutsObligations = (
  cursor?: string,
  signal?: AbortSignal,
) =>
  request(
    `/obligations${page(cursor)}`,
    creatorPayoutsObligationsSchema,
    signal,
  );
export const fetchCreatorPayoutsHistory = (
  cursor?: string,
  signal?: AbortSignal,
) =>
  request(
    `/history${page(cursor)}`,
    creatorPayoutsHistoryResponseSchema,
    signal,
  );
export const fetchCreatorPayoutMethod = (signal?: AbortSignal) =>
  request("/payout-method", creatorPayoutMethodResponseSchema, signal);
export const fetchCreatorPayoutObligation = (
  id: string,
  signal?: AbortSignal,
) =>
  request(
    `/obligations/${encodeURIComponent(id)}`,
    creatorPayoutsObligationDetailSchema,
    signal,
  );
export const fetchCreatorPayoutHistoryDetail = (
  id: string,
  signal?: AbortSignal,
) =>
  request(
    `/history/${encodeURIComponent(id)}`,
    creatorPayoutsHistoryDetailSchema,
    signal,
  );
export const isCreatorPayoutsAuthorizationError = (error: unknown): boolean =>
  error instanceof CreatorPayoutsApiError && error.kind === "AUTHORIZATION";
