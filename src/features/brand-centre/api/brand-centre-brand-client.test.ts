import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  adoptAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";
import { consumerFixture } from "../testing/brand-consumer-fixtures";
import { fetchBrandCentreBrand } from "./brand-centre-brand-client";

beforeEach(() => {
  adoptAuthSession({
    accessToken: "test-only-token",
    accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
    user: {
      id: "brand-user",
      email: "brand@example.test",
      name: "Brand User",
      role: "BRAND",
    },
  });
});

afterEach(() => {
  resetAuthSessionForTests();
  vi.unstubAllGlobals();
});

describe("authenticated Brand consumer client", () => {
  it("uses only the bounded route, existing authorization, abort and no Brand selector", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(consumerFixture())));
    vi.stubGlobal("fetch", fetcher);
    const signal = new AbortController().signal;
    await fetchBrandCentreBrand(signal);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0][0]).toMatch(
      /\/api\/v1\/brand-centre\/brand$/u,
    );
    const init = fetcher.mock.calls[0][1];
    expect(init).toMatchObject({
      method: "GET",
      signal,
      cache: "no-store",
      credentials: "include",
    });
    const headers = new Headers(init.headers);
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer test-only-token");
  });
  it.each(["{", JSON.stringify({ legacyDna: true })])(
    "returns MALFORMED_RESPONSE for invalid success body",
    async (body) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body)));
      await expect(fetchBrandCentreBrand()).rejects.toMatchObject({
        code: "MALFORMED_RESPONSE",
      });
    },
  );
  it.each([401, 403, 500])(
    "bounds HTTP %i without rendering internal errors",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            new Response("provider SECRET failed", { status }),
          ),
      );
      await expect(fetchBrandCentreBrand()).rejects.toMatchObject({
        code: "REQUEST_FAILED",
        status,
        message: "Brand information is temporarily unavailable.",
      });
    },
  );
});
