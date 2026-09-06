import type { z } from "zod";

import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { parseApiErrorBody } from "../../../shared/api/parse-api-error";
import { env } from "../../../shared/config/env";
import {
  BrandHomeResponseSchema,
  type BrandHomeResponse,
} from "../contracts/brand-home.schemas";

export const BRAND_HOME_PATH = "/api/v1/brand/home";

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Creator Shop returned an invalid Brand Home response.");
  }
}
async function readValidated<T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<T> {
  const body = await readResponseBody(response);
  if (!response.ok) throw parseApiErrorBody(response.status, body);

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new Error("Creator Shop returned an invalid Brand Home response.");
  }
  return parsed.data;
}

export async function getBrandHome(): Promise<BrandHomeResponse> {
  const response = await authenticatedFetch(`${env.apiUrl}${BRAND_HOME_PATH}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return readValidated(response, BrandHomeResponseSchema);
}
