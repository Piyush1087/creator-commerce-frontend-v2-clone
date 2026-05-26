export type AuthUserBody = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organizationId: string | null;
};

export type AuthTokenResponseBody = {
  accessToken: string;
  user: AuthUserBody;
};

export type CompleteBrandRegistrationResponseBody = AuthTokenResponseBody & {
  brandProfileId: string;
  organizationId: string;
};

export function isAuthTokenResponse(value: unknown): value is AuthTokenResponseBody {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as { accessToken?: unknown; user?: unknown };
  if (typeof v.accessToken !== "string" || !v.user || typeof v.user !== "object") {
    return false;
  }
  const u = v.user as { id?: unknown; email?: unknown; role?: unknown };
  return typeof u.id === "string" && typeof u.email === "string" && typeof u.role === "string";
}
