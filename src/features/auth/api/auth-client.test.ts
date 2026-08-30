// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  changePassword,
  forgotPassword,
  loginWithPassword,
  logoutAllSessions,
  requestLoginOtp,
  resetPassword,
  signInWithGoogle,
  verifyLoginOtp,
} from "./auth-client";
import {
  adoptAuthSession,
  getAuthSession,
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

  it("provides logout-all and password-change APIs that clear the memory session", async () => {
    adoptAuthSession(canonicalSession);
    fetchMock.mockResolvedValueOnce(response(undefined, 204));
    await changePassword({
      currentPassword: "synthetic-current-password",
      newPassword: "synthetic-new-password",
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/password/change");
    expect(getAuthSession()).toBeNull();

    adoptAuthSession(canonicalSession);
    fetchMock.mockResolvedValueOnce(response(undefined, 204));
    await logoutAllSessions();
    expect(String(fetchMock.mock.calls[1][0])).toContain("/auth/logout-all");
    expect(fetchMock.mock.calls[1][1]?.credentials).toBe("include");
    expect(getAuthSession()).toBeNull();
  });
});
