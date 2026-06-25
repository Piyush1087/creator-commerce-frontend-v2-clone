import { env } from "../../../shared/config/env";
import type { PublicBrandLandingResponse } from "../contracts/public-brand.contracts";

const PUBLIC_BRAND_BASE = `${env.apiUrl}/api/v1/public/brands`;

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
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

export async function fetchPublicBrandLanding(
  slug: string,
): Promise<PublicBrandLandingResponse> {
  const response = await fetch(
    `${PUBLIC_BRAND_BASE}/${encodeURIComponent(slug)}`,
    { method: "GET" },
  );
  return (await readJsonOrThrow(response)) as PublicBrandLandingResponse;
}

export function publicBrandPagePath(slug: string): string {
  return `/brand/${encodeURIComponent(slug)}`;
}
