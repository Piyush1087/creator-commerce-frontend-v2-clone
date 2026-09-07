// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adoptAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";
import {
  connectInvitedInstagram,
  inviteBrandSocialSyncTeammate,
  skipBrandSocialSync,
  startInvitedInstagramOAuth,
} from "./brand-social-sync-client";

const state = "p".repeat(43);
const fetchMock = vi.fn<typeof fetch>();

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  resetAuthSessionForTests();
  adoptAuthSession({
    accessToken: "owner-access-token",
    accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
    user: {
      id: "owner",
      email: "owner@example.test",
      name: "Owner",
      role: "BRAND",
    },
  });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetAuthSessionForTests();
});

describe("Brand social-sync API client", () => {
  it("sends the invitation only to bootstrap with a token-free redirect URI", async () => {
    fetchMock.mockResolvedValue(
      response({ url: "https://instagram.example.test/oauth", state }),
    );
    await startInvitedInstagramOAuth(
      "invite-token",
      "https://app.example.test/brand/onboarding/social-sync?context=agent",
    );
    const url = new URL(
      String(fetchMock.mock.calls[0][0]),
      window.location.origin,
    );
    expect(url.pathname).toContain("/social-sync/invite/instagram/oauth-url");
    expect(url.searchParams.get("token")).toBe("invite-token");
    expect(url.searchParams.get("redirectUri")).toBe(
      "https://app.example.test/brand/onboarding/social-sync?context=agent",
    );
    expect(url.searchParams.get("redirectUri")).not.toContain("invite-token");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      referrerPolicy: "no-referrer",
    });
  });

  it("fails closed when delegated OAuth omits backend-owned state", async () => {
    fetchMock.mockResolvedValue(
      response({ url: "https://instagram.example.test/oauth" }),
    );
    await expect(
      startInvitedInstagramOAuth(
        "invite-token",
        "https://app.example.test/callback",
      ),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("rejects a non-HTTP delegated OAuth destination", async () => {
    fetchMock.mockResolvedValue(
      response({ url: "data:text/html,unsafe", state }),
    );
    await expect(
      startInvitedInstagramOAuth(
        "invite-token",
        "https://app.example.test/callback",
      ),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("exchanges delegated code and state without auth-token persistence", async () => {
    fetchMock.mockResolvedValue(
      response({
        connected: true,
        handle: "@delegated",
        status: "PARTIALLY_CONNECTED",
        scopes: ["BASIC_PROFILE"],
        brandProfileId: "brand-profile",
        inviteCompleted: true,
      }),
    );
    await connectInvitedInstagram({
      token: "invite-token",
      code: "synthetic-code",
      state,
      redirectUri: "https://app.example.test/callback",
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      token: "invite-token",
      code: "synthetic-code",
      state,
      redirectUri: "https://app.example.test/callback",
    });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("rejects an unrecognized invited connection status", async () => {
    fetchMock.mockResolvedValue(
      response({
        connected: true,
        handle: "@delegated",
        status: "FULL_ACCESS",
        scopes: ["BASIC_PROFILE"],
        brandProfileId: "brand-profile",
        inviteCompleted: true,
      }),
    );
    await expect(
      connectInvitedInstagram({
        token: "invite-token",
        code: "synthetic-code",
        state,
        redirectUri: "https://app.example.test/callback",
      }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("uses authenticated canonical skip and invitation actions", async () => {
    fetchMock
      .mockResolvedValueOnce(response({ skipped: true }))
      .mockResolvedValueOnce(response({ sent: true }));
    await skipBrandSocialSync();
    await inviteBrandSocialSyncTeammate("manager@example.test");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/social-sync/skip");
    expect(String(fetchMock.mock.calls[1][0])).toContain("/social-sync/invite");
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      email: "manager@example.test",
    });
    expect(
      new Headers(fetchMock.mock.calls[0][1]?.headers).get("Authorization"),
    ).toBe("Bearer owner-access-token");
  });
});
