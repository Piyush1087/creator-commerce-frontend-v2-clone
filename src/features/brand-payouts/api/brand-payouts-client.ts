import type { z } from "zod";

import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  BRAND_PAYOUTS_V2_MEDIA_TYPE,
  brandPayoutsActivityDetailResponseSchema,
  brandPayoutsActivityResponseSchema,
  brandPayoutsObligationDetailResponseSchema,
  brandPayoutsObligationsResponseSchema,
  brandPayoutsOverviewResponseSchema,
  type BrandPayoutsActivityCategory,
  type BrandPayoutsActivityDetailResponse,
  type BrandPayoutsActivityResponse,
  type BrandPayoutsObligationDetailResponse,
  type BrandPayoutsObligationsResponse,
  type BrandPayoutsOverviewResponse,
} from "../contracts/brand-payouts.contracts";

const BASE = `${env.apiUrl}/api/v1/brand/payouts`;
const ERROR_BODY_MAX = 8_192;

export type BrandPayoutsApiErrorKind =
  | "AUTHORIZATION"
  | "NOT_FOUND"
  | "CONTRACT"
  | "UNAVAILABLE";

export class BrandPayoutsApiError extends Error {
  constructor(
    readonly kind: BrandPayoutsApiErrorKind,
    readonly status: number | null,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "BrandPayoutsApiError";
  }
}

type PageQuery = {
  readonly cursor?: string;
  readonly limit?: number;
};

type ActivityQuery = PageQuery & {
  readonly categories?: readonly BrandPayoutsActivityCategory[];
};

async function requestV2<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await authenticatedFetch(`${BASE}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: BRAND_PAYOUTS_V2_MEDIA_TYPE },
    signal,
  });
  if (!response.ok) {
    throw await responseError(response);
  }
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const responseMediaType = contentType.split(";", 1)[0]?.trim();
  if (responseMediaType !== BRAND_PAYOUTS_V2_MEDIA_TYPE) {
    throw new BrandPayoutsApiError(
      "CONTRACT",
      response.status,
      "BRAND_PAYOUTS_REPRESENTATION_MISMATCH",
      "The Payouts service returned an unsupported representation.",
    );
  }
  let body: unknown;
  try {
    body = (await response.json()) as unknown;
  } catch {
    throw new BrandPayoutsApiError(
      "CONTRACT",
      response.status,
      "BRAND_PAYOUTS_INVALID_JSON",
      "The Payouts service returned an unreadable response.",
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BrandPayoutsApiError(
      "CONTRACT",
      response.status,
      "BRAND_PAYOUTS_SCHEMA_MISMATCH",
      "The Payouts service response could not be verified.",
    );
  }
  return parsed.data;
}

async function responseError(
  response: Response,
): Promise<BrandPayoutsApiError> {
  const status = response.status;
  let code = "BRAND_PAYOUTS_UNAVAILABLE";
  try {
    const text = (await response.text()).slice(0, ERROR_BODY_MAX);
    const value = text ? (JSON.parse(text) as unknown) : null;
    if (value && typeof value === "object") {
      const candidate = value as { code?: unknown };
      if (typeof candidate.code === "string" && candidate.code.length <= 256) {
        code = candidate.code;
      }
    }
  } catch {
    // Error bodies are never trusted as user-facing copy.
  }
  if (status === 401 || status === 403) {
    return new BrandPayoutsApiError(
      "AUTHORIZATION",
      status,
      code,
      "Your current Brand membership does not permit this Payouts view.",
    );
  }
  if (status === 404) {
    return new BrandPayoutsApiError(
      "NOT_FOUND",
      status,
      code,
      "This financial record is unavailable for your current access.",
    );
  }
  if (status === 406) {
    return new BrandPayoutsApiError(
      "CONTRACT",
      status,
      code,
      "The Payouts service contract could not be negotiated.",
    );
  }
  return new BrandPayoutsApiError(
    "UNAVAILABLE",
    status,
    code,
    "Payouts data is temporarily unavailable.",
  );
}

function pageSearch(query: PageQuery): URLSearchParams {
  const search = new URLSearchParams();
  search.set("limit", String(query.limit ?? 25));
  if (query.cursor) search.set("cursor", query.cursor);
  return search;
}

export function fetchBrandPayoutsOverview(
  signal?: AbortSignal,
): Promise<BrandPayoutsOverviewResponse> {
  return requestV2("", brandPayoutsOverviewResponseSchema, signal);
}

export function fetchBrandPayoutsActivity(
  query: ActivityQuery = {},
  signal?: AbortSignal,
): Promise<BrandPayoutsActivityResponse> {
  const search = pageSearch(query);
  if (query.categories?.length) {
    search.set("categories", query.categories.join(","));
  }
  return requestV2(
    `/activity?${search.toString()}`,
    brandPayoutsActivityResponseSchema,
    signal,
  );
}

export function fetchBrandPayoutsObligations(
  query: PageQuery = {},
  signal?: AbortSignal,
): Promise<BrandPayoutsObligationsResponse> {
  const search = pageSearch(query);
  return requestV2(
    `/obligations?${search.toString()}`,
    brandPayoutsObligationsResponseSchema,
    signal,
  );
}

export function fetchBrandPayoutsActivityDetail(
  reference: string,
  signal?: AbortSignal,
): Promise<BrandPayoutsActivityDetailResponse> {
  return requestV2(
    `/activity/${encodeURIComponent(reference)}`,
    brandPayoutsActivityDetailResponseSchema,
    signal,
  );
}

export function fetchBrandPayoutsObligationDetail(
  reference: string,
  signal?: AbortSignal,
): Promise<BrandPayoutsObligationDetailResponse> {
  return requestV2(
    `/obligations/${encodeURIComponent(reference)}`,
    brandPayoutsObligationDetailResponseSchema,
    signal,
  );
}

export function isBrandPayoutsAuthorizationError(
  error: unknown,
): error is BrandPayoutsApiError {
  return (
    error instanceof BrandPayoutsApiError && error.kind === "AUTHORIZATION"
  );
}
