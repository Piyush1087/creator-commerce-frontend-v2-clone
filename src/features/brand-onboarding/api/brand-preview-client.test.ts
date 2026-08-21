import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BrandPreviewRuntimeContractError,
  getBrandPreviewRuntime,
} from "./brand-preview-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Brand Preview runtime client contract errors", () => {
  it("makes a contract-incompatible successful response observable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              state: "PREVIEW_READY",
              completeness: "NORMAL",
              preview: { incompatible: true },
              verificationContext: { brandProfileId: "brand-profile-1" },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
      ),
    );

    await expect(getBrandPreviewRuntime("lead-1")).rejects.toBeInstanceOf(
      BrandPreviewRuntimeContractError,
    );
  });

  it("makes invalid JSON observable as a runtime contract error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not-json", { status: 200 })),
    );

    await expect(getBrandPreviewRuntime("lead-1")).rejects.toMatchObject({
      name: "BrandPreviewRuntimeContractError",
    });
  });
});
