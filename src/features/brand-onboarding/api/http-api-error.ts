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

export function httpErrorFromResponse(
  response: Response,
  body: unknown,
): HttpApiError {
  const raw =
    nestHttpMessage(body) ?? `Request failed (${response.status}).`;
  const message =
    response.status === 429 ? RATE_LIMIT_USER_MESSAGE : raw;
  return new HttpApiError(response.status, message, body);
}

export function isHttpApiError(err: unknown): err is HttpApiError {
  return err instanceof HttpApiError;
}
