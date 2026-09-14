import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  InstagramB4ResponseSchema,
  InstagramMediaDetailSchema,
  InstagramRefreshErrorSchema,
  InstagramRefreshResponseSchema,
  type InstagramB4Response,
  type InstagramMediaDetail,
  type InstagramRefreshResponse,
} from "../contracts/instagram-b4.schemas";

export const INSTAGRAM_B4_PATH = "/api/v1/brand-centre/instagram";
export const INSTAGRAM_REFRESH_PATH = `${INSTAGRAM_B4_PATH}/refresh`;
export const INSTAGRAM_MEDIA_PATH = `${INSTAGRAM_B4_PATH}/media`;

export type InstagramMediaDetailErrorKind =
  | "INVALID_RESPONSE"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "STALE_OR_CHANGED_GENERATION"
  | "REMOVED_AFTER_REFRESH"
  | "TRANSIENT_ERROR";

export class InstagramMediaDetailError extends Error {
  constructor(readonly kind: InstagramMediaDetailErrorKind) {
    super("Instagram post detail is unavailable.");
    this.name = "InstagramMediaDetailError";
  }
}

export async function getInstagramMediaDetail(
  mediaId: string,
  signal?: AbortSignal,
): Promise<InstagramMediaDetail> {
  const response = await authenticatedFetch(
    `${env.apiUrl}${INSTAGRAM_MEDIA_PATH}/${encodeURIComponent(mediaId)}`,
    { method: "GET", headers: { Accept: "application/json" }, signal },
  );
  if (!response.ok) {
    const kind: InstagramMediaDetailErrorKind =
      response.status === 401
        ? "UNAUTHORIZED"
        : response.status === 403
          ? "FORBIDDEN"
          : response.status === 404
            ? "NOT_FOUND"
            : response.status === 409
              ? "STALE_OR_CHANGED_GENERATION"
              : response.status === 410
                ? "REMOVED_AFTER_REFRESH"
                : "TRANSIENT_ERROR";
    throw new InstagramMediaDetailError(kind);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new InstagramMediaDetailError("INVALID_RESPONSE");
  }
  const parsed = InstagramMediaDetailSchema.safeParse(body);
  if (!parsed.success) throw new InstagramMediaDetailError("INVALID_RESPONSE");
  return parsed.data;
}

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
