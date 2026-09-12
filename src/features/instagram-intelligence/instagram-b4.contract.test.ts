import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedFetch } from "../../shared/api/authenticated-fetch";
import { env } from "../../shared/config/env";
import {
  getInstagramB4,
  getInstagramMediaDetail,
  INSTAGRAM_B4_PATH,
  INSTAGRAM_MEDIA_PATH,
  INSTAGRAM_REFRESH_PATH,
  refreshInstagram,
} from "./api/instagram-b4-client";
import {
  InstagramB4ResponseSchema,
  InstagramMediaDetailSchema,
  InstagramSourceValueSchema,
} from "./contracts/instagram-b4.schemas";
import {
  instagramB4Fixture,
  instagramMediaDetailFixture,
} from "./testing/instagram-b4-fixture";

vi.mock("../../shared/api/authenticated-fetch", () => ({
  authenticatedFetch: vi.fn(),
}));
const fetchMock = vi.mocked(authenticatedFetch);
beforeEach(() => fetchMock.mockReset());

describe("Instagram Intelligence E2/E3 consumer contract", () => {
  it("accepts only the complete three-Object workspace contract", () => {
    expect(
      InstagramB4ResponseSchema.parse(instagramB4Fixture()).objects[0]
        .readiness,
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
  it("preserves explicit absence and rejects malformed enums and shapes", () => {
    expect(
      InstagramSourceValueSchema.safeParse({
        state: "EXPLICIT_NULL",
        reasonCode: "METRIC_NOT_RETURNED",
      }).success,
    ).toBe(true);
    expect(
      InstagramSourceValueSchema.safeParse({ state: "AVAILABLE", value: null })
        .success,
    ).toBe(false);
    const fixture = instagramB4Fixture();
    expect(
      InstagramB4ResponseSchema.safeParse({
        ...fixture,
        connection: { ...fixture.connection, state: "MAYBE_CONNECTED" },
      }).success,
    ).toBe(false);
    expect(
      InstagramB4ResponseSchema.safeParse({
        ...fixture,
        hiddenBrandGenerations: [],
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
  it("uses the exact authenticated refresh endpoint and discards request internals", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accepted: true,
          requestIdentity: "synthetic-request-identity",
          cooldownSeconds: 900,
        }),
        { status: 202 },
      ),
    );
    await expect(refreshInstagram()).resolves.toEqual({
      accepted: true,
      cooldownSeconds: 900,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${env.apiUrl}${INSTAGRAM_REFRESH_PATH}`,
      { method: "POST", headers: { Accept: "application/json" } },
    );
    expect(
      JSON.stringify(
        await Promise.resolve({ accepted: true, cooldownSeconds: 900 }),
      ),
    ).not.toContain("requestIdentity");
  });
  it("handles server cooldown without treating it as completion", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: "INSTAGRAM_REFRESH_COOLDOWN",
          retryAfterSeconds: 420,
        }),
        { status: 429 },
      ),
    );
    await expect(refreshInstagram()).rejects.toMatchObject({
      kind: "COOLDOWN",
      retryAfterSeconds: 420,
    });
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

  it("strictly parses the 1.0 media detail while preserving zero and absence", () => {
    const detail = InstagramMediaDetailSchema.parse(
      instagramMediaDetailFixture(),
    );
    expect(detail.metrics[0]).toMatchObject({
      availability: "OBSERVED_ZERO",
      value: 0,
    });
    expect(detail.metrics[1]).toMatchObject({ availability: "UNAVAILABLE" });
    expect(
      InstagramMediaDetailSchema.safeParse({
        ...detail,
        contractVersion: "2.0",
      }).success,
    ).toBe(false);
    expect(
      InstagramMediaDetailSchema.safeParse({ ...detail, rawProvider: {} })
        .success,
    ).toBe(false);
    expect(
      InstagramMediaDetailSchema.safeParse({
        ...detail,
        inspection: {
          ...detail.inspection,
          depth: "FULL_VIDEO_ANALYSIS",
        },
      }).success,
    ).toBe(false);
  });

  it("uses one authenticated, encoded media-detail GET and supports cancellation", async () => {
    const detail = instagramMediaDetailFixture();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(detail), { status: 200 }),
    );
    const controller = new AbortController();
    await expect(
      getInstagramMediaDetail("post/with unsafe space", controller.signal),
    ).resolves.toEqual(detail);
    expect(fetchMock).toHaveBeenCalledWith(
      `${env.apiUrl}${INSTAGRAM_MEDIA_PATH}/post%2Fwith%20unsafe%20space`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );
  });

  it.each([
    [401, "UNAUTHORIZED"],
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
    [409, "STALE_OR_CHANGED_GENERATION"],
    [410, "REMOVED_AFTER_REFRESH"],
    [503, "TRANSIENT_ERROR"],
  ] as const)(
    "maps media-detail HTTP %s without exposing response content",
    async (status, kind) => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "sensitive server detail" }), {
          status,
        }),
      );
      await expect(
        getInstagramMediaDetail("synthetic-media"),
      ).rejects.toMatchObject({ kind });
    },
  );

  it("fails closed on malformed media-detail JSON or shape", async () => {
    fetchMock.mockResolvedValueOnce(new Response("not-json", { status: 200 }));
    await expect(
      getInstagramMediaDetail("synthetic-media"),
    ).rejects.toMatchObject({
      kind: "INVALID_RESPONSE",
    });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ contractVersion: "1.0" }), { status: 200 }),
    );
    await expect(
      getInstagramMediaDetail("synthetic-media"),
    ).rejects.toMatchObject({
      kind: "INVALID_RESPONSE",
    });
  });
});
