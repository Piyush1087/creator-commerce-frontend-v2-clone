const STORAGE_KEY = "creator-entry.campaign-apply-continuation";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isCreatorEntryContinuationToken(
  value: unknown,
): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

export function readCreatorEntryContinuation(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(STORAGE_KEY);
  if (value === null) return null;
  if (isCreatorEntryContinuationToken(value)) return value;
  window.sessionStorage.removeItem(STORAGE_KEY);
  return null;
}

export function saveCreatorEntryContinuation(token: string): void {
  if (!isCreatorEntryContinuationToken(token))
    throw new Error("Invalid campaign continuation response.");
  window.sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearCreatorEntryContinuation(): void {
  if (typeof window !== "undefined")
    window.sessionStorage.removeItem(STORAGE_KEY);
}
