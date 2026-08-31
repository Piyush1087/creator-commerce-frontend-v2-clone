import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  BrandConsumerContractError,
  parseBrandCentreBrand,
} from "../schemas/brand-centre-brand-schema";

export class BrandConsumerRequestError extends Error {
  readonly code = "REQUEST_FAILED";
  constructor(readonly status?: number) {
    super("Brand information is temporarily unavailable.");
    this.name = "BrandConsumerRequestError";
  }
}

/** Ownership is resolved by the authenticated backend. Never send a Brand selector. */
export async function fetchBrandCentreBrand(signal?: AbortSignal) {
  const response = await fetch(`${env.apiUrl}/api/v1/brand-centre/brand`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new BrandConsumerRequestError(response.status);
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new BrandConsumerContractError();
  }
  return parseBrandCentreBrand(json);
}
