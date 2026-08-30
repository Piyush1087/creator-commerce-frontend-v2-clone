// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authenticatedFetch } from "../api/authenticated-fetch";
import {
  adoptAuthSession,
  bootstrapAuthSession,
  getAuthSession,
  getAuthSessionSnapshot,
  resetAuthSessionForTests,
} from "./auth-session";

const session = (token: string) => ({
  accessToken: token,
  accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
  user: {
    id: "user-1",
    email: "person@example.test",
    name: "Test Person",
    role: "BRAND",
  },
});

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("canonical auth session", () => {
  it("removes legacy storage and restores from the HttpOnly refresh cookie", async () => {
    localStorage.setItem(
      "ccs.auth.v1",
      JSON.stringify({ accessToken: "legacy" }),
    );
    fetchMock.mockResolvedValueOnce(response(session("access-new")));

    await expect(bootstrapAuthSession()).resolves.toBe(true);

    expect(localStorage.getItem("ccs.auth.v1")).toBeNull();
    expect(getAuthSession()).toEqual(session("access-new"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
  });

  it("becomes unauthenticated when startup refresh is invalid", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ message: "Invalid refresh" }, 401),
    );
    await expect(bootstrapAuthSession()).resolves.toBe(false);
    expect(getAuthSessionSnapshot().status).toBe("UNAUTHENTICATED");
  });

  it("refreshes and retries a protected request once", async () => {
    adoptAuthSession(session("access-old"));
    fetchMock
      .mockResolvedValueOnce(response({ message: "Expired" }, 401))
      .mockResolvedValueOnce(response(session("access-new")))
      .mockResolvedValueOnce(response({ ok: true }));

    const result = await authenticatedFetch("/api/v1/protected");

    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      new Headers(fetchMock.mock.calls[0][1]?.headers).get("Authorization"),
    ).toBe("Bearer access-old");
    expect(
      new Headers(fetchMock.mock.calls[2][1]?.headers).get("Authorization"),
    ).toBe("Bearer access-new");
  });

  it("deduplicates concurrent refresh and rotates only once", async () => {
    adoptAuthSession(session("access-old"));
    let protectedCalls = 0;
    let refreshCalls = 0;
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/refresh")) {
        refreshCalls += 1;
        await Promise.resolve();
        return response(session("access-new"));
      }
      protectedCalls += 1;
      return protectedCalls <= 2
        ? response({ message: "Expired" }, 401)
        : response({ ok: true });
    });

    const [first, second] = await Promise.all([
      authenticatedFetch("/api/v1/one"),
      authenticatedFetch("/api/v1/two"),
    ]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(refreshCalls).toBe(1);
  });

  it("does not refresh a 403", async () => {
    adoptAuthSession(session("access-current"));
    fetchMock.mockResolvedValueOnce(response({ message: "Forbidden" }, 403));
    const result = await authenticatedFetch("/api/v1/protected");
    expect(result.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("clears after refresh failure without an infinite retry", async () => {
    adoptAuthSession(session("access-old"));
    fetchMock
      .mockResolvedValueOnce(response({ message: "Expired" }, 401))
      .mockResolvedValueOnce(response({ message: "Invalid refresh" }, 401));

    const result = await authenticatedFetch("/api/v1/protected");

    expect(result.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getAuthSessionSnapshot().status).toBe("UNAUTHENTICATED");
  });

  it("never persists access or refresh token material", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    adoptAuthSession(session("memory-only-access"));
    expect(setItem).not.toHaveBeenCalled();
    expect(JSON.stringify(getAuthSessionSnapshot())).not.toContain(
      "refreshToken",
    );
    setItem.mockRestore();
  });
});
