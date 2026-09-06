import { afterEach, describe, expect, it, vi } from "vitest";

import { env } from "../config/env";
import { getApiHealth } from "./health";

afterEach(() => vi.unstubAllGlobals());

describe("API health client", () => {
  it("uses native fetch against the fixed configured API origin", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getApiHealth()).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith(`${env.apiUrl}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  });

  it("fails closed on an unsuccessful health response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );
    await expect(getApiHealth()).rejects.toThrow("Health request failed (503).");
  });
});
