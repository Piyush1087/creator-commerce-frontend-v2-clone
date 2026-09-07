// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adoptAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";
import { creatorInstagramSettingsFixture } from "../mock/creator-instagram-settings.fixture";
import {
  authorizeCreatorInstagramSettingsInitial,
  authorizeCreatorInstagramSettingsReconnect,
  completeCreatorInstagramSettingsReconnect,
  disconnectCreatorInstagramSettings,
  fetchCreatorInstagramSettings,
  CreatorInstagramSettingsApiError,
} from "./creator-instagram-settings-client";

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
    accessToken: "creator-settings-token",
    accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
    user: {
      id: "creator-manager",
      email: "manager@example.test",
      name: "Manager",
      role: "CREATOR",
    },
  });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetAuthSessionForTests();
});

describe("Creator Instagram Settings API client", () => {
  it("reads only the canonical Creator Settings facade", async () => {
    fetchMock.mockResolvedValue(response(creatorInstagramSettingsFixture()));
    await expect(fetchCreatorInstagramSettings()).resolves.toMatchObject({
      platform: "INSTAGRAM",
      lifecycleState: "CONNECTED_HEALTHY",
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/v1/creator/settings/instagram",
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET" });
  });

  it("fails closed on an unknown backend lifecycle state", async () => {
    fetchMock.mockResolvedValue(
      response({
        ...creatorInstagramSettingsFixture(),
        lifecycleState: "SILENT_ACCOUNT_REPLACEMENT",
      }),
    );
    await expect(fetchCreatorInstagramSettings()).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("reuses the accepted C01 initial-connect endpoint for NOT_CONNECTED", async () => {
    fetchMock.mockResolvedValue(
      response({
        authorizationUrl:
          "https://www.instagram.com/oauth/authorize?state=initial",
      }),
    );
    await expect(authorizeCreatorInstagramSettingsInitial()).resolves.toEqual({
      authorizationUrl:
        "https://www.instagram.com/oauth/authorize?state=initial",
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/v1/creator-entry/instagram/authorize",
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
  });

  it("retains the manual-review marker for a different-account block", async () => {
    fetchMock.mockResolvedValue(
      response(
        {
          code: "INSTAGRAM_DIFFERENT_ACCOUNT_BLOCKED",
          manualReviewRequired: true,
          message: "Different account blocked.",
        },
        409,
      ),
    );
    await expect(authorizeCreatorInstagramSettingsReconnect()).rejects.toEqual(
      expect.objectContaining<Partial<CreatorInstagramSettingsApiError>>({
        code: "INSTAGRAM_DIFFERENT_ACCOUNT_BLOCKED",
        manualReviewRequired: true,
      }),
    );
  });

  it("sends reconnect callback bodies only to the same-ID Settings endpoint", async () => {
    fetchMock.mockResolvedValue(
      response({
        connected: true,
        settings: creatorInstagramSettingsFixture(),
      }),
    );
    await completeCreatorInstagramSettingsReconnect({
      state: "s".repeat(43),
      code: "provider-code",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/instagram/reconnect/complete");
    expect(init).toMatchObject({ method: "POST" });
    expect(String(init?.body)).not.toMatch(/providerUserId|redirectUri/);
  });

  it("uses DELETE without accepting a platform selector", async () => {
    fetchMock.mockResolvedValue(
      response({
        disconnected: true,
        settings: creatorInstagramSettingsFixture({
          lifecycleState: "DISCONNECTED_IDENTITY_RETAINED",
        }),
      }),
    );
    await disconnectCreatorInstagramSettings();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/creator\/settings\/instagram$/);
    expect(init).toMatchObject({ method: "DELETE" });
  });
});
