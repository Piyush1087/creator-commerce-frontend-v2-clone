import {
  isAuthSession,
  type AuthSession,
  type AuthUser,
} from "../../../shared/auth/auth-session";

export type AuthUserBody = AuthUser;
export type AuthTokenResponseBody = AuthSession;

export const isAuthTokenResponse = isAuthSession;
