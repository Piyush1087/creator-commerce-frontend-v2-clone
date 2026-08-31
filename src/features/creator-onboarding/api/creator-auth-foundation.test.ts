// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyCreatorSignupOtp } from "./creator-onboarding-client";
import {
  getAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  resetAuthSessionForTests();
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("Creator onboarding auth", () => {
  it("adopts the cookie-backed session returned by provider OTP verification", async () => {
    const session = {
      accessToken: "creator-access",
      accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
      user: {
        id: "creator-user",
        email: "creator@example.test",
        name: "Creator",
        role: "CREATOR",
      },
    };
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(session), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await verifyCreatorSignupOtp("creator@example.test", "654321");

    expect(String(fetchMock.mock.calls[0][0])).toContain("/verify-otp");
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe("include");
    expect(getAuthSession()).toEqual(session);
    expect(localStorage.length).toBe(0);
  });
});
