import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { creatorBrandFixture } from "../testing/creator-brand.fixture";
import { emptyCreatorBrandProfile } from "../contracts/creator-brand-profile.contract";
import { fetchCreatorBrand, mutateCreatorBrand } from "./creator-brand-client";
vi.mock("../../../shared/api/authenticated-fetch", () => ({
  authenticatedFetch: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
describe("Creator Brand authenticated adapter", () => {
  it("GET has no caller-selected subject or writes", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify(creatorBrandFixture())),
    );
    await fetchCreatorBrand();
    const [url, options] = vi.mocked(authenticatedFetch).mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/creator\/brand$/u);
    expect(options?.method).toBe("GET");
    expect(options?.body).toBeUndefined();
    expect(options?.cache).toBe("no-store");
  });
  it("PUT sends only the strict full canonical command", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify(creatorBrandFixture("OWNER", true))),
    );
    const command = {
      intent: "MANUAL" as const,
      expectedRevision: 0,
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
      values: emptyCreatorBrandProfile(),
    };
    await mutateCreatorBrand(command);
    const options = vi.mocked(authenticatedFetch).mock.calls[0][1];
    expect(options?.method).toBe("PUT");
    expect(JSON.parse(String(options?.body))).toEqual(command);
  });
  it("rejects invalid consumer material rather than exposing it", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          ...creatorBrandFixture(),
          privateMaterial: "untrusted",
        }),
      ),
    );
    await expect(fetchCreatorBrand()).rejects.toThrow(/invalid response/u);
  });
  it.each([400, 403, 409, 503])(
    "sanitizes HTTP %s without reading private error body",
    async (status) => {
      vi.mocked(authenticatedFetch).mockResolvedValue(
        new Response("PRIVATE_ERROR_BODY", { status }),
      );
      await expect(fetchCreatorBrand()).rejects.not.toThrow(
        /PRIVATE_ERROR_BODY/u,
      );
    },
  );
});
