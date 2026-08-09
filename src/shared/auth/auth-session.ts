const STORAGE_KEY = "ccs.auth.v1";

export type AuthSessionV1 = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    organizationId: string | null;
  };
};

export function saveAuthSession(session: AuthSessionV1): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

type JwtPayload = {
  exp?: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = atob(padded);
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const exp = (parsed as { exp?: unknown }).exp;
    return typeof exp === "number" ? { exp } : {};
  } catch {
    return null;
  }
}

export function isAccessTokenValid(token: string | null | undefined): boolean {
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  if (typeof payload.exp !== "number") {
    return true;
  }

  return payload.exp * 1000 > Date.now();
}

function isGuestOnboardingPath(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }
  return (
    pathname.startsWith("/brand/onboarding") ||
    pathname.startsWith("/creator/onboarding") ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/b/")
  );
}

/** Clear session; only hard-redirect away from protected app routes. */
export function handleAuthFailure(): void {
  clearAuthSession();
  if (typeof window === "undefined") {
    return;
  }
  const { pathname } = window.location;
  if (isGuestOnboardingPath(pathname)) {
    return;
  }
  window.location.replace("/");
}

export function loadAuthSession(): AuthSessionV1 | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const v = parsed as {
      accessToken?: unknown;
      user?: unknown;
    };
    if (typeof v.accessToken !== "string" || !v.user || typeof v.user !== "object") {
      return null;
    }
    const u = v.user as {
      id?: unknown;
      email?: unknown;
      name?: unknown;
      role?: unknown;
      organizationId?: unknown;
    };
    if (typeof u.id !== "string" || typeof u.email !== "string" || typeof u.role !== "string") {
      return null;
    }
    return {
      accessToken: v.accessToken,
      user: {
        id: u.id,
        email: u.email,
        name: typeof u.name === "string" ? u.name : null,
        role: u.role,
        organizationId:
          typeof u.organizationId === "string" ? u.organizationId : null,
      },
    };
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAccessToken(): string | null {
  const token = loadAuthSession()?.accessToken ?? null;
  if (!isAccessTokenValid(token)) {
    return null;
  }
  return token;
}

export function authAuthorizationHeader(): Record<string, string> {
  const token = getAccessToken();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}
