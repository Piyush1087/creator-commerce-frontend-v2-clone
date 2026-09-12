import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  InstagramB4ResponseSchema,
  InstagramRefreshErrorSchema,
  InstagramRefreshResponseSchema,
  type InstagramB4Response,
  type InstagramRefreshResponse,
} from "../contracts/instagram-b4.schemas";

export const INSTAGRAM_B4_PATH = "/api/v1/brand-centre/instagram";
export const INSTAGRAM_REFRESH_PATH = `${INSTAGRAM_B4_PATH}/refresh`;

export class InstagramRefreshError extends Error {
  constructor(
    message: string,
    readonly kind: "COOLDOWN" | "REJECTED" | "INVALID_RESPONSE",
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "InstagramRefreshError";
  }
}

export async function getInstagramB4(): Promise<InstagramB4Response> {
  const response = await authenticatedFetch(
    `${env.apiUrl}${INSTAGRAM_B4_PATH}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );
  const body: unknown = await response.json();
  if (!response.ok)
    throw new Error("Instagram Intelligence is temporarily unavailable.");
  const parsed = InstagramB4ResponseSchema.safeParse(body);
  if (!parsed.success)
    throw new Error(
      "Creator Shop returned an invalid Instagram Intelligence response.",
    );
  return parsed.data;
}

export async function refreshInstagram(): Promise<InstagramRefreshResponse> {
  const response = await authenticatedFetch(
    `${env.apiUrl}${INSTAGRAM_REFRESH_PATH}`,
    { method: "POST", headers: { Accept: "application/json" } },
  );
  const body: unknown = await response.json();
  if (response.status === 429) {
    const cooldown = InstagramRefreshErrorSchema.safeParse(body);
    throw new InstagramRefreshError(
      "Instagram refresh is cooling down. Try again when the waiting period ends.",
      "COOLDOWN",
      cooldown.success ? cooldown.data.retryAfterSeconds : null,
    );
  }
  if (!response.ok) {
    throw new InstagramRefreshError(
      "Instagram refresh could not be requested. Your current intelligence is unchanged.",
      "REJECTED",
    );
  }
  const parsed = InstagramRefreshResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new InstagramRefreshError(
      "Creator Shop returned an invalid refresh response.",
      "INVALID_RESPONSE",
    );
  }
  return parsed.data;
}
