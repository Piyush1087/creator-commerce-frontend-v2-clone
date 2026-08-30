// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adoptAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";
import {
  BrandSettingsApiError,
  fetchBrandGeneralSettings,
} from "./brand-settings-client";

const fetchMock = vi.fn<typeof fetch>();
const session = {
  accessToken: "settings-access-token",
  accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
  user: {
    id: "brand-user",
    email: "owner@example.test",
    name: "Owner",
    role: "BRAND",
  },
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  resetAuthSessionForTests();
  adoptAuthSession(session);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("Brand Settings client", () => {
  it("uses the FE-0 bearer authority for General", async () => {
    const body = { current_user_role: "BRAND_OWNER" };
    fetchMock.mockResolvedValueOnce(response(body));
    await expect(fetchBrandGeneralSettings()).resolves.toEqual(body);
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer settings-access-token");
  });

  it("preserves a workspace 403 and backend code without refreshing", async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        {
          code: "ACTIVE_BRAND_MEMBERSHIP_REQUIRED",
          message: "Active Brand team membership required.",
        },
        403,
      ),
    );
    const error = await fetchBrandGeneralSettings().catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(BrandSettingsApiError);
    expect(error).toMatchObject({
      message: "Active Brand team membership required.",
      status: 403,
      code: "ACTIVE_BRAND_MEMBERSHIP_REQUIRED",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
