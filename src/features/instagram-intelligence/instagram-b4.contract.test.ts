import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedFetch } from "../../shared/api/authenticated-fetch";
import { env } from "../../shared/config/env";
import { getInstagramB4, INSTAGRAM_B4_PATH } from "./api/instagram-b4-client";
import { InstagramB4ResponseSchema } from "./contracts/instagram-b4.schemas";
import { instagramB4Fixture } from "./testing/instagram-b4-fixture";

vi.mock("../../shared/api/authenticated-fetch", () => ({
  authenticatedFetch: vi.fn(),
}));
const fetchMock = vi.mocked(authenticatedFetch);
beforeEach(() => fetchMock.mockReset());

describe("Instagram Intelligence B4 consumer contract", () => {
  it("accepts only the narrow partial-current proof", () => {
    expect(
      InstagramB4ResponseSchema.parse(instagramB4Fixture()).contentBehavior
        ?.readiness,
    ).toBe("PARTIAL");
    expect(
      InstagramB4ResponseSchema.safeParse({
        ...instagramB4Fixture(),
        objects: [],
      }).success,
    ).toBe(false);
    expect(
      InstagramB4ResponseSchema.safeParse({
        ...instagramB4Fixture(),
        accessToken: "forbidden",
      }).success,
    ).toBe(false);
  });
  it("uses authenticatedFetch and the exact GET endpoint", async () => {
    const fixture = instagramB4Fixture();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(fixture), { status: 200 }),
    );
    await expect(getInstagramB4()).resolves.toEqual(fixture);
    expect(fetchMock).toHaveBeenCalledWith(
      `${env.apiUrl}${INSTAGRAM_B4_PATH}`,
      { method: "GET", headers: { Accept: "application/json" } },
    );
  });
  it("fails closed on invalid or unsuccessful responses", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ ...instagramB4Fixture(), contractVersion: "future" }),
        { status: 200 },
      ),
    );
    await expect(getInstagramB4()).rejects.toThrow(
      "invalid Instagram Intelligence response",
    );
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 403 }));
    await expect(getInstagramB4()).rejects.toThrow("temporarily unavailable");
  });
});
