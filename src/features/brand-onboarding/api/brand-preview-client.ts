import { env } from "../../../shared/config/env";
import type { BrandPreviewRuntimeProjection } from "../contracts/brand-preview.contracts";
import { parseBrandPreviewRuntimeProjection } from "../schemas/brand-preview-runtime-schema";
import { httpErrorFromResponse } from "./http-api-error";

export class BrandPreviewRuntimeContractError extends Error {
  readonly contractCause: unknown;

  constructor(message: string, contractCause?: unknown) {
    super(message);
    this.name = "BrandPreviewRuntimeContractError";
    this.contractCause = contractCause;
  }
}

export function isBrandPreviewRuntimeContractError(
  error: unknown,
): error is BrandPreviewRuntimeContractError {
  return error instanceof BrandPreviewRuntimeContractError;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
  } catch (error) {
    throw new BrandPreviewRuntimeContractError(
      "The Brand Preview runtime returned invalid JSON.",
      error,
    );
  }
  if (!response.ok) {
    throw httpErrorFromResponse(response, parsed);
  }
  return parsed;
}

function parseRuntimeProjection(value: unknown): BrandPreviewRuntimeProjection {
  try {
    return parseBrandPreviewRuntimeProjection(value);
  } catch (error) {
    throw new BrandPreviewRuntimeContractError(
      "The Brand Preview runtime response did not match its public contract.",
      error,
    );
  }
}

export async function getBrandPreviewRuntime(
  leadId: string,
): Promise<BrandPreviewRuntimeProjection> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/discovery/${encodeURIComponent(leadId)}/brand-preview`,
    { method: "GET" },
  );
  return parseRuntimeProjection(await readJson(response));
}

export async function retryBrandPreviewRuntime(
  leadId: string,
): Promise<BrandPreviewRuntimeProjection> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/discovery/${encodeURIComponent(leadId)}/brand-preview/retry`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
  return parseRuntimeProjection(await readJson(response));
}
