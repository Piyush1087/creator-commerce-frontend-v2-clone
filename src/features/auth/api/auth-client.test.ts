// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  changePassword,
  fetchAuthMe,
  forgotPassword,
  loginWithPassword,
  logoutAllSessions,
  logoutCurrentSession,
  requestLoginOtp,
  resetPassword,
  signInWithGoogle,
  verifyLoginOtp,
} from "./auth-client";
import {
  adoptAuthSession,
  bootstrapAuthSession,
  getAuthSession,
  getAuthSessionSnapshot,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";

const canonicalSession = {
  accessToken: "access-fixture",
  accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
  user: {
    id: "user-1",
    email: "person@example.test",
    name: "Person",
    role: "CREATOR",
  },
};

const refreshedSession = {
  ...canonicalSession,
  accessToken: "access-refreshed",
};

function response(body: unknown, status = 200): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  resetAuthSessionForTests();
  localStorage.clear();
  sessionStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("auth API contract", () => {
  it("reads active authentication methods from the canonical auth profile", async () => {
    adoptAuthSession(canonicalSession);
    const profile = {
      ...canonicalSession.user,
      authState: "ACTIVE",
      authMethods: [
        { type: "PASSWORD", verifiedAt: "2026-08-30T00:00:00.000Z" },
        { type: "GOOGLE", verifiedAt: "2026-08-30T00:00:00.000Z" },
      ],
      brandMemberships: [
        { brandProfileId: "brand-1", role: "BRAND_OWNER", isActive: true },
      ],
    };
    fetchMock.mockResolvedValueOnce(response(profile));
    await expect(fetchAuthMe()).resolves.toEqual(profile);
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer access-fixture");
  });

  it("logs in with email/password, includes credentials, and adopts memory session", async () => {
    fetchMock.mockResolvedValueOnce(response(canonicalSession));
    await loginWithPassword({
      email: "person@example.test",
      password: "synthetic-password",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/v1/auth/login");
    expect(init?.credentials).toBe("include");
    expect(JSON.parse(String(init?.body))).toEqual({
      email: "person@example.test",
      password: "synthetic-password",
    });
    expect(getAuthSession()).toEqual(canonicalSession);
    expect(localStorage.length).toBe(0);
  });

  it("uses the two-step OTP endpoints without persisting the code", async () => {
    fetchMock
      .mockResolvedValueOnce(response({ accepted: true }, 202))
      .mockResolvedValueOnce(response(canonicalSession));
    await requestLoginOtp("person@example.test");
    await verifyLoginOtp({ email: "person@example.test", code: "654321" });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/auth/otp/request");
    expect(String(fetchMock.mock.calls[1][0])).toContain("/auth/otp/verify");
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it("sends a Google ID token without inventing an onboarding admission", async () => {
    fetchMock.mockResolvedValueOnce(response(canonicalSession));
    await signInWithGoogle({ idToken: "synthetic-google-credential" });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      idToken: "synthetic-google-credential",
    });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("preserves the backend's generic password-login error", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ message: "Invalid email or password." }, 401),
    );
    await expect(
      loginWithPassword({ email: "person@example.test", password: "wrong" }),
    ).rejects.toThrow("Invalid email or password.");
  });

  it("preserves invalid OTP and Google conflict errors", async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ message: "Invalid or expired verification code." }, 401),
      )
      .mockResolvedValueOnce(
        response(
          { message: "Google account admission is not available." },
          409,
        ),
      );
    await expect(
      verifyLoginOtp({ email: "person@example.test", code: "000000" }),
    ).rejects.toThrow("Invalid or expired verification code.");
    await expect(
      signInWithGoogle({ idToken: "synthetic-google-credential" }),
    ).rejects.toThrow("Google account admission is not available.");
  });

  it("uses generic forgot response and sends reset token only in the body", async () => {
    fetchMock
      .mockResolvedValueOnce(response({ accepted: true }, 202))
      .mockResolvedValueOnce(response(undefined, 204));
    await forgotPassword("person@example.test");
    await resetPassword({
      token: "synthetic-reset-secret",
      newPassword: "new-password",
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/password/forgot");
    expect(String(fetchMock.mock.calls[1][0])).not.toContain(
      "synthetic-reset-secret",
    );
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      token: "synthetic-reset-secret",
      newPassword: "new-password",
    });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("provides password-change API and clears the memory session", async () => {
    adoptAuthSession(canonicalSession);
    fetchMock.mockResolvedValueOnce(response(undefined, 204));
    await changePassword({
      currentPassword: "synthetic-current-password",
      newPassword: "synthetic-new-password",
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/password/change");
    expect(getAuthSession()).toBeNull();
  });

  it("finalizes current logout with fresh access without refreshing", async () => {
    adoptAuthSession(canonicalSession);
    fetchMock.mockResolvedValueOnce(response(undefined, 204));

    await logoutCurrentSession();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/auth/logout");
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe("include");
    expect(getAuthSessionSnapshot().status).toBe("UNAUTHENTICATED");
  });

  it("refreshes an expired access token and retries current logout once", async () => {
    adoptAuthSession(canonicalSession);
    fetchMock
      .mockResolvedValueOnce(response({ message: "Expired" }, 401))
      .mockResolvedValueOnce(response(refreshedSession))
      .mockResolvedValueOnce(response(undefined, 204));

    await logoutCurrentSession();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining("/auth/logout"),
      expect.stringContaining("/auth/refresh"),
      expect.stringContaining("/auth/logout"),
    ]);
    expect(
      new Headers(fetchMock.mock.calls[0][1]?.headers).get("Authorization"),
    ).toBe("Bearer access-fixture");
    expect(
      new Headers(fetchMock.mock.calls[2][1]?.headers).get("Authorization"),
    ).toBe("Bearer access-refreshed");
    expect(getAuthSessionSnapshot().status).toBe("UNAUTHENTICATED");
  });

  it("finishes locally when logout refresh proves the session is invalid", async () => {
    adoptAuthSession(canonicalSession);
    fetchMock
      .mockResolvedValueOnce(response({ message: "Expired" }, 401))
      .mockResolvedValueOnce(response({ message: "Invalid refresh" }, 401));

    await expect(logoutCurrentSession()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).endsWith("/api/v1/auth/refresh"),
      ),
    ).toHaveLength(1);
    expect(getAuthSessionSnapshot().status).toBe("UNAUTHENTICATED");
  });

  it("refreshes an expired access token and retries logout-all once", async () => {
    adoptAuthSession(canonicalSession);
    fetchMock
      .mockResolvedValueOnce(response({ message: "Expired" }, 401))
      .mockResolvedValueOnce(response(refreshedSession))
      .mockResolvedValueOnce(response(undefined, 204));

    await logoutAllSessions();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining("/auth/logout-all"),
      expect.stringContaining("/auth/refresh"),
      expect.stringContaining("/auth/logout-all"),
    ]);
    expect(getAuthSessionSnapshot().status).toBe("UNAUTHENTICATED");
  });

  it("finishes logout-all when refresh proves the session is invalid", async () => {
    adoptAuthSession(canonicalSession);
    fetchMock
      .mockResolvedValueOnce(response({ message: "Expired" }, 401))
      .mockResolvedValueOnce(response({ message: "Invalid refresh" }, 401));

    await expect(logoutAllSessions()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getAuthSessionSnapshot().status).toBe("UNAUTHENTICATED");
  });

  it("shares one refresh across concurrent logout operations", async () => {
    adoptAuthSession(canonicalSession);
    let logoutAttempts = 0;
    let refreshCalls = 0;
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/refresh")) {
        refreshCalls += 1;
        await Promise.resolve();
        return response(refreshedSession);
      }
      logoutAttempts += 1;
      return logoutAttempts <= 2
        ? response({ message: "Expired" }, 401)
        : response(undefined, 204);
    });

    await Promise.all([logoutCurrentSession(), logoutAllSessions()]);

    expect(refreshCalls).toBe(1);
    expect(logoutAttempts).toBe(4);
    expect(getAuthSessionSnapshot().status).toBe("UNAUTHENTICATED");
  });

  it("does not report server failure as successful logout", async () => {
    adoptAuthSession(canonicalSession);
    fetchMock.mockResolvedValueOnce(
      response({ message: "Logout service unavailable." }, 500),
    );

    await expect(logoutCurrentSession()).rejects.toThrow(
      "Logout service unavailable.",
    );

    expect(getAuthSession()).toEqual(canonicalSession);
  });

  it("cannot restore a server session after refreshed logout succeeds", async () => {
    let serverSessionActive = true;
    let refreshCalls = 0;
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/refresh")) {
        refreshCalls += 1;
        return serverSessionActive
          ? response(refreshedSession)
          : response({ message: "Invalid refresh" }, 401);
      }
      if (url.endsWith("/api/v1/auth/logout")) {
        const authorization = new Headers(init?.headers).get("Authorization");
        if (authorization === "Bearer access-fixture") {
          return response({ message: "Expired" }, 401);
        }
        if (authorization === "Bearer access-refreshed") {
          serverSessionActive = false;
          return response(undefined, 204);
        }
      }
      return response({ message: "Unexpected request" }, 500);
    });

    adoptAuthSession(canonicalSession);
    await logoutCurrentSession();
    expect(serverSessionActive).toBe(false);
    expect(getAuthSessionSnapshot().status).toBe("UNAUTHENTICATED");

    resetAuthSessionForTests();
    await expect(bootstrapAuthSession()).resolves.toBe(false);
    expect(refreshCalls).toBe(2);
    expect(getAuthSessionSnapshot().status).toBe("UNAUTHENTICATED");
  });
});
