/** Nest HTTP throttle (429) — short burst protection, not the 7-day scan cap. */
export const RATE_LIMIT_USER_MESSAGE =
  "You're sending requests too quickly. Wait about a minute, then try again.";

export class HttpApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "HttpApiError";
    this.status = status;
    this.body = body;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

export function nestHttpMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const raw = (body as { message?: unknown }).message;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw;
  }
  if (Array.isArray(raw)) {
    const parts = raw.filter((item): item is string => typeof item === "string");
    if (parts.length > 0) {
      return parts.join(" ");
    }
  }
  return undefined;
}

function humanizeHttpMessage(status: number, raw: string): string {
  const lower = raw.toLowerCase();
  if (
    status === 413 ||
    lower.includes("entity too large") ||
    lower.includes("payload too large") ||
    lower.includes("request entity too large")
  ) {
    return "That image is too large to upload. Use a file under 5MB.";
  }
  if (lower === "bad request" || lower === "validation issue" || lower.startsWith("validation")) {
    return "We couldn’t upload that image. Use a JPEG, PNG, WebP, GIF, or SVG under 5MB.";
  }
  return raw;
}

export function httpErrorFromResponse(
  response: Response,
  body: unknown,
): HttpApiError {
  const raw =
    nestHttpMessage(body) ?? `Request failed (${response.status}).`;
  const message =
    response.status === 429
      ? RATE_LIMIT_USER_MESSAGE
      : humanizeHttpMessage(response.status, raw);
  return new HttpApiError(response.status, message, body);
}

/** Prefer for image upload UX under the upload control. */
export function uploadErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return humanizeHttpMessage(
      isHttpApiError(err) ? err.status : 0,
      err.message,
    );
  }
  return "We couldn’t upload that image. Please try a different file under 5MB.";
}

export function isHttpApiError(err: unknown): err is HttpApiError {
  return err instanceof HttpApiError;
}
