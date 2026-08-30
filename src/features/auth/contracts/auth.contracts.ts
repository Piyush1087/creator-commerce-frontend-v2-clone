import {
  isAuthSession,
  type AuthSession,
  type AuthUser,
} from "../../../shared/auth/auth-session";

export type AuthUserBody = AuthUser;
export type AuthTokenResponseBody = AuthSession;

export type AuthMethodType = "PASSWORD" | "GOOGLE" | "EMAIL_OTP";

export type AuthMeResponseBody = AuthUserBody & {
  authState: string;
  authMethods: Array<{
    type: AuthMethodType;
    verifiedAt: string | null;
  }>;
  brandMemberships: Array<{
    brandProfileId: string;
    role: string;
    isActive: boolean;
  }>;
};

export const isAuthTokenResponse = isAuthSession;
