// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  sendBrandVerificationOtp,
  setBrandVerificationPassword,
  verifyBrandVerificationOtp,
} from "./brand-client";
import {
  getAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";

const fetchMock = vi.fn<typeof fetch>();

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  resetAuthSessionForTests();
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("Brand auth activation", () => {
  it("uses provider-backed OTP request and verification endpoints", async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({
          sent: true,
          expiresInMinutes: 10,
          expiresAt: "2030-01-01T00:10:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        response({
          identityConfirmed: true,
          brandProfileId: "brand-1",
          domain: "example.test",
          email: "owner@example.test",
          nextStep: "password",
        }),
      );

    await sendBrandVerificationOtp("brand-1", "owner@example.test");
    await verifyBrandVerificationOtp("brand-1", {
      email: "owner@example.test",
      otp: "654321",
    });

    expect(String(fetchMock.mock.calls[0][0])).toContain("/verification/send");
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      "/verification/verify",
    );
    expect(localStorage.length).toBe(0);
  });

  it("includes credentials and adopts the canonical activation session", async () => {
    const activation = {
      activated: true,
      brandProfileId: "brand-1",
      domain: "example.test",
      organizationId: "organization-1",
      accessToken: "brand-access",
      accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
      user: {
        id: "brand-user",
        email: "owner@example.test",
        name: "Owner",
        role: "BRAND",
        organizationId: "organization-1",
      },
    };
    fetchMock.mockResolvedValueOnce(response(activation));

    await setBrandVerificationPassword("brand-1", {
      email: "owner@example.test",
      password: "synthetic-password",
    });

    expect(fetchMock.mock.calls[0][1]?.credentials).toBe("include");
    expect(getAuthSession()).toEqual({
      accessToken: activation.accessToken,
      accessTokenExpiresAt: activation.accessTokenExpiresAt,
      user: activation.user,
    });
    expect(localStorage.length).toBe(0);
  });
});
