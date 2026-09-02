import { env } from "../config/env";

const LEGACY_STORAGE_KEY = "ccs.auth.v1";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  sessionId?: string;
  organizationId?: string | null;
};

export type AuthSession = {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: AuthUser;
};

export type AuthSessionStatus =
  | "INITIALIZING"
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "REFRESHING";

export type AuthSessionSnapshot = {
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  currentUser: AuthUser | null;
  status: AuthSessionStatus;
};

const listeners = new Set<() => void>();

let snapshot: AuthSessionSnapshot = {
  accessToken: null,
  accessTokenExpiresAt: null,
  currentUser: null,
  status: "INITIALIZING",
};

let refreshPromise: Promise<AuthSession> | null = null;

function publish(next: AuthSessionSnapshot): void {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function removeLegacySession(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in privacy-restricted browser contexts.
  }
}

export function subscribeToAuthSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthSessionSnapshot(): AuthSessionSnapshot {
  return snapshot;
}

export function getAuthSession(): AuthSession | null {
  if (
    snapshot.status !== "AUTHENTICATED" ||
    !snapshot.accessToken ||
    !snapshot.accessTokenExpiresAt ||
    !snapshot.currentUser
  ) {
    return null;
  }
  return {
    accessToken: snapshot.accessToken,
    accessTokenExpiresAt: snapshot.accessTokenExpiresAt,
    user: snapshot.currentUser,
  };
}

export function getAccessToken(): string | null {
  return snapshot.accessToken;
}

/** Compatibility for origin API clients; prefer authenticatedFetch for new work. */
export function authAuthorizationHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function adoptAuthSession(session: AuthSession): void {
  removeLegacySession();
  publish({
    accessToken: session.accessToken,
    accessTokenExpiresAt: session.accessTokenExpiresAt,
    currentUser: session.user,
    status: "AUTHENTICATED",
  });
}

export function updateCurrentUser(user: AuthUser): void {
  if (!snapshot.accessToken || !snapshot.accessTokenExpiresAt) {
    return;
  }
  publish({ ...snapshot, currentUser: user, status: "AUTHENTICATED" });
}

export function clearAuthSession(): void {
  removeLegacySession();
  publish({
    accessToken: null,
    accessTokenExpiresAt: null,
    currentUser: null,
    status: "UNAUTHENTICATED",
  });
}

export function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as {
    accessToken?: unknown;
    accessTokenExpiresAt?: unknown;
    user?: unknown;
  };
  if (
    typeof candidate.accessToken !== "string" ||
    typeof candidate.accessTokenExpiresAt !== "string" ||
    !Number.isFinite(Date.parse(candidate.accessTokenExpiresAt)) ||
    !candidate.user ||
    typeof candidate.user !== "object"
  ) {
    return false;
  }
  const user = candidate.user as {
    id?: unknown;
    email?: unknown;
    name?: unknown;
    role?: unknown;
  };
  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    (typeof user.name === "string" || user.name === null) &&
    typeof user.role === "string"
  );
}

async function readRefreshResponse(response: Response): Promise<AuthSession> {
  let body: unknown;
  try {
    const text = await response.text();
    body = text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error("The session service returned an invalid response.");
  }
  if (!response.ok || !isAuthSession(body)) {
    throw new Error("Your session could not be restored.");
  }
  return body;
}

/**
 * The only refresh authority. The shared promise protects one-time rotating
 * refresh credentials from concurrent browser requests.
 */
export function refreshAuthSession(): Promise<AuthSession> {
  if (refreshPromise) {
    return refreshPromise;
  }

  if (snapshot.status !== "INITIALIZING") {
    publish({ ...snapshot, status: "REFRESHING" });
  }

  refreshPromise = fetch(`${env.apiUrl}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  })
    .then(readRefreshResponse)
    .then((session) => {
      adoptAuthSession(session);
      return session;
    })
    .catch((error: unknown) => {
      clearAuthSession();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/** Remove obsolete persisted JWT state, then restore from the HttpOnly cookie. */
export async function bootstrapAuthSession(): Promise<boolean> {
  removeLegacySession();
  if (snapshot.status !== "INITIALIZING") {
    return snapshot.status === "AUTHENTICATED";
  }
  try {
    await refreshAuthSession();
    return true;
  } catch {
    return false;
  }
}

/** Test-only reset; no token material is persisted by this module. */
export function resetAuthSessionForTests(): void {
  refreshPromise = null;
  snapshot = {
    accessToken: null,
    accessTokenExpiresAt: null,
    currentUser: null,
    status: "INITIALIZING",
  };
}
