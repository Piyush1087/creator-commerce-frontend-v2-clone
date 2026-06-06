export function parseCollaborationApiError(body: unknown, status: number): string {
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;
    const message = record.message;
    if (Array.isArray(message)) {
      return message.filter((m) => typeof m === "string").join(" ");
    }
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
    if (typeof record.error === "string") {
      return record.error;
    }
  }
  return `Request failed (${status}).`;
}
