// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adoptAuthSession,
  getAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";
import {
  authorizeCreatorInstagram,
  authorizeCreatorInstagramReconnect,
  completeCreatorInstagram,
  completeCreatorInstagramReconnect,
  fetchCreatorEntryState,
  issueCampaignApplyContinuation,
  registerCreatorGoogle,
  registerCreatorPassword,
  requestCreatorRegistrationOtp,
  resolveCampaignApplyContinuation,
  revalidateCreatorInstagram,
  verifyCreatorRegistrationOtp,
} from "./creator-entry-client";

const session = {
  accessToken: "access",
  accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
  user: {
    id: "u1",
    email: "creator@example.test",
    name: "Creator",
    role: "CREATOR",
  },
};
const state = {
  accountContext: "CREATOR_READY",
  onboardingStatus: "INCOMPLETE",
  canEnterCreatorPlatform: false,
  nextAction: "CONNECT_INSTAGRAM",
  instagram: {
    identityConnection: "NOT_CONNECTED",
    basicAuthorization: "UNKNOWN",
    insightsCapability: "UNKNOWN",
    authorizationHealth: "UNKNOWN",
  },
};
const fetchMock = vi.fn<typeof fetch>();
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  resetAuthSessionForTests();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("Creator Entry API authority", () => {
  it("uses the password/OTP facade and adopts only a verified shared session", async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        { accepted: true, message: "Verify", nextAction: "VERIFY_EMAIL" },
        202,
      ),
    );
    await registerCreatorPassword({
      email: "creator@example.test",
      password: "password-123",
    });
    expect(getAuthSession()).toBeNull();
    fetchMock.mockResolvedValueOnce(
      response({ accepted: true, message: "Sent" }, 202),
    );
    await requestCreatorRegistrationOtp("creator@example.test");
    fetchMock.mockResolvedValueOnce(response(session));
    await verifyCreatorRegistrationOtp({
      email: "creator@example.test",
      code: "123456",
    });
    expect(getAuthSession()).toEqual(session);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining("/creator-entry/register/password"),
      expect.stringContaining("/creator-entry/register/email/otp/request"),
      expect.stringContaining("/creator-entry/register/email/otp/verify"),
    ]);
  });

  it("registers Google through Creator Entry and adopts shared auth", async () => {
    fetchMock.mockResolvedValueOnce(response(session));
    await registerCreatorGoogle("google-id-token");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      idToken: "google-id-token",
    });
    expect(getAuthSession()).toEqual(session);
  });

  it("reads state and calls all Instagram transitions without redirectUri or client state", async () => {
    adoptAuthSession(session);
    fetchMock
      .mockResolvedValueOnce(response(state))
      .mockResolvedValueOnce(
        response({ authorizationUrl: "https://provider.test/initial" }),
      )
      .mockResolvedValueOnce(response({ connected: true, state }))
      .mockResolvedValueOnce(
        response({ authorizationUrl: "https://provider.test/reconnect" }),
      )
      .mockResolvedValueOnce(response({ connected: true, state }))
      .mockResolvedValueOnce(response({ revalidated: true, state }));
    await fetchCreatorEntryState();
    await authorizeCreatorInstagram();
    await completeCreatorInstagram({
      state: "server-state",
      code: "provider-code",
    });
    await authorizeCreatorInstagramReconnect();
    await completeCreatorInstagramReconnect({
      state: "server-state",
      error: "access_denied",
      errorDescription: "Denied",
    });
    await revalidateCreatorInstagram();
    expect(fetchMock.mock.calls[1][1]?.body).toBeUndefined();
    expect(fetchMock.mock.calls[3][1]?.body).toBeUndefined();
    const bodies = fetchMock.mock.calls
      .map(([, init]) => (init?.body ? String(init.body) : ""))
      .join(" ");
    expect(bodies).not.toContain("redirectUri");
    expect(bodies).not.toContain("returnUrl");
  });

  it("issues once without a body and resolves using only the opaque token", async () => {
    adoptAuthSession(session);
    const token = "A".repeat(43);
    fetchMock
      .mockResolvedValueOnce(
        response(
          {
            intent: "CAMPAIGN_APPLY",
            continuationToken: token,
            expiresAt: "2030-01-01T00:00:00.000Z",
          },
          201,
        ),
      )
      .mockResolvedValueOnce(
        response({
          status: "PENDING_CREATOR_ENTRY",
          intent: "CAMPAIGN_APPLY",
          nextAction: "CONNECT_INSTAGRAM",
        }),
      );
    await issueCampaignApplyContinuation("campaign-1");
    await resolveCampaignApplyContinuation(token);
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      continuationToken: token,
    });
  });

  it("preserves top-level backend error codes for bounded UI handling", async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        { code: "ACCOUNT_EXISTS_SIGN_IN_REQUIRED", message: "Exists" },
        409,
      ),
    );
    await expect(
      registerCreatorPassword({
        email: "creator@example.test",
        password: "password-123",
      }),
    ).rejects.toMatchObject({
      code: "ACCOUNT_EXISTS_SIGN_IN_REQUIRED",
      status: 409,
    });
  });
});
