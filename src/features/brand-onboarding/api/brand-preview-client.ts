import { env } from "../../../shared/config/env";
import type { BrandPreviewRuntimeProjection } from "../contracts/brand-preview.contracts";
import { parseBrandPreviewRuntimeProjection } from "../schemas/brand-preview-runtime-schema";
import { httpErrorFromResponse } from "./http-api-error";

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }
  if (!response.ok) {
    throw httpErrorFromResponse(response, parsed);
  }
  return parsed;
}

export async function getBrandPreviewRuntime(
  leadId: string,
): Promise<BrandPreviewRuntimeProjection> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/discovery/${encodeURIComponent(leadId)}/brand-preview`,
    { method: "GET" },
  );
  return parseBrandPreviewRuntimeProjection(await readJson(response));
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
  return parseBrandPreviewRuntimeProjection(await readJson(response));
}
