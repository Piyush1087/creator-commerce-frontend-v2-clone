export type ApiFieldErrors = Record<string, string>;

export class ApiRequestError extends Error {
  readonly status: number;
  readonly fieldErrors: ApiFieldErrors;
  readonly formError?: string;
  readonly code?: string;

  constructor(args: {
    message: string;
    status: number;
    fieldErrors?: ApiFieldErrors;
    formError?: string;
    code?: string;
  }) {
    super(args.message);
    this.name = "ApiRequestError";
    this.status = args.status;
    this.fieldErrors = args.fieldErrors ?? {};
    this.formError = args.formError;
    this.code = args.code;
  }
}

function flattenZodFieldErrors(
  fieldErrors: Record<string, unknown>,
  prefix = "",
): ApiFieldErrors {
  const out: ApiFieldErrors = {};
  for (const [key, value] of Object.entries(fieldErrors)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      const first = value.find((item): item is string => typeof item === "string");
      if (first) {
        out[path] = first;
      }
      continue;
    }
    if (value && typeof value === "object") {
      Object.assign(out, flattenZodFieldErrors(value as Record<string, unknown>, path));
    }
  }
  return out;
}

function nestHttpMessage(body: unknown): string | undefined {
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

export function parseApiErrorBody(status: number, body: unknown): ApiRequestError {
  if (typeof body !== "object" || body === null) {
    return new ApiRequestError({
      message: `Request failed (${status}).`,
      status,
    });
  }

  const record = body as {
    message?: unknown;
    code?: unknown;
  };

  const nestedMessage = record.message;
  if (typeof nestedMessage === "object" && nestedMessage !== null) {
    const zodShape = nestedMessage as {
      formErrors?: unknown;
      fieldErrors?: unknown;
      code?: unknown;
      message?: unknown;
    };

    if (zodShape.fieldErrors && typeof zodShape.fieldErrors === "object") {
      const fieldErrors = flattenZodFieldErrors(
        zodShape.fieldErrors as Record<string, unknown>,
      );
      const formErrors = Array.isArray(zodShape.formErrors)
        ? zodShape.formErrors.filter((item): item is string => typeof item === "string")
        : [];
      const firstField = Object.values(fieldErrors)[0];
      return new ApiRequestError({
        message: firstField ?? formErrors[0] ?? `Request failed (${status}).`,
        status,
        fieldErrors,
        formError: formErrors[0],
      });
    }

    if (typeof zodShape.code === "string") {
      const detail =
        typeof zodShape.message === "string"
          ? zodShape.message
          : `Request failed (${status}).`;
      return new ApiRequestError({
        message: detail,
        status,
        code: zodShape.code,
      });
    }
  }

  const topLevelCode = typeof record.code === "string" ? record.code : undefined;

  return new ApiRequestError({
    message: nestHttpMessage(body) ?? `Request failed (${status}).`,
    status,
    ...(topLevelCode ? { code: topLevelCode } : {}),
    ...(mapConflictFieldErrors(status, nestHttpMessage(body))),
  });
}

function mapConflictFieldErrors(
  status: number,
  message: string | undefined,
): { fieldErrors?: ApiFieldErrors } {
  if (!message) {
    return {};
  }
  const lower = message.toLowerCase();
  if (status === 409 && lower.includes("email")) {
    return { fieldErrors: { email: message } };
  }
  return {};
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}
