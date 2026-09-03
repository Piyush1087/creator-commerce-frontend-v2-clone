import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import { BrandHomeResponseSchema } from "../contracts/brand-home.schemas";
import { brandHomeResponseFixture } from "../testing/brand-home-fixtures";
import { BRAND_HOME_PATH, getBrandHome } from "./brand-home-client";

vi.mock("../../../shared/api/authenticated-fetch", () => ({
  authenticatedFetch: vi.fn(),
}));

const fetchMock = vi.mocked(authenticatedFetch);

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => fetchMock.mockReset());

describe("Brand Home 1.0 API client", () => {
  it("uses the authenticated permanent Home GET and parses the exact contract", async () => {
    const home = brandHomeResponseFixture();
    fetchMock.mockResolvedValueOnce(response(home));

    await expect(getBrandHome()).resolves.toEqual(home);
    expect(fetchMock).toHaveBeenCalledWith(`${env.apiUrl}${BRAND_HOME_PATH}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  });

  it("rejects unknown response fields through strict validation", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ ...brandHomeResponseFixture(), inventedAuthority: true }),
    );

    await expect(getBrandHome()).rejects.toThrow(
      "invalid Brand Home response",
    );
  });

  it("rejects a contract version other than 1.0", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ ...brandHomeResponseFixture(), contractVersion: "2.0" }),
    );

    await expect(getBrandHome()).rejects.toThrow(
      "invalid Brand Home response",
    );
  });

  it("rejects any section order other than the canonical four", () => {
    const home = brandHomeResponseFixture();
    expect(
      BrandHomeResponseSchema.safeParse({
        ...home,
        sections: [
          home.sections[1],
          home.sections[0],
          home.sections[2],
          home.sections[3],
        ],
      }).success,
    ).toBe(false);
  });
});
