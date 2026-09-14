import { afterEach, describe, expect, it, vi } from "vitest";
import { contentFixture } from "../contracts/creator-content.schema.test";
import { fetchCreatorContent } from "./creator-content-client";

afterEach(() => vi.unstubAllGlobals());
describe("Creator Content authenticated client", () => {
  it("reads and validates the no-store consumer response", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(contentFixture), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetch);
    await expect(fetchCreatorContent()).resolves.toMatchObject({
      contractVersion: "creator_content_v0.1",
    });
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: "GET",
      cache: "no-store",
    });
  });
  it("fails closed for invalid responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ ...contentFixture, token: "forbidden" }),
            { status: 200 },
          ),
        ),
    );
    await expect(fetchCreatorContent()).rejects.toThrow();
  });
});
