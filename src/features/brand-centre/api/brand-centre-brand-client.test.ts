import { afterEach, describe, expect, it, vi } from "vitest";
import { consumerFixture } from "../testing/brand-consumer-fixtures";
import { fetchBrandCentreBrand } from "./brand-centre-brand-client";

vi.mock("../../../shared/auth/auth-session", () => ({
  authAuthorizationHeader: () => ({ Authorization: "Bearer test-only-token" }),
}));
afterEach(() => vi.unstubAllGlobals());

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
    expect(fetcher.mock.calls[0][1]).toEqual({
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer test-only-token",
      },
      signal,
      cache: "no-store",
    });
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
