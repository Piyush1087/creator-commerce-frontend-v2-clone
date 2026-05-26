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
  return loadAuthSession()?.accessToken ?? null;
}

export function authAuthorizationHeader(): Record<string, string> {
  const token = getAccessToken();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}
