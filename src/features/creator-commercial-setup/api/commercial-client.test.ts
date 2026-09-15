import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { commercialFixture } from "../testing/commercial.fixture";
import {
  fetchWork,
  fetchRates,
  saveRates,
  CommercialRequestError,
} from "./commercial-client";
vi.mock("../../../shared/api/authenticated-fetch", () => ({
  authenticatedFetch: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
describe("strict scoped Commercial client", () => {
  it("reads authenticated no-store independently", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify(commercialFixture().work)),
    );
    await fetchWork();
    expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/commercial-setup/work-preferences"),
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });
  it("rejects unknown response data", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          ...commercialFixture().rates,
          providerPayload: "forbidden",
        }),
      ),
    );
    await expect(fetchRates()).rejects.toThrow();
  });
  it("does not fetch with an injected currency command", async () => {
    const fixture = commercialFixture();
    await expect(
      saveRates({
        expectedRevision: 1,
        expectedWorkPreferencesRevision: 1,
        authorityFingerprint: fixture.rates.country.authorityFingerprint!,
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
        values: fixture.rates.values!,
        currency: "USD",
      } as never),
    ).rejects.toThrow();
    expect(authenticatedFetch).not.toHaveBeenCalled();
  });
  it("does not read or leak rejected response payloads", async () => {
    const response = new Response("UNTRUSTED_DIAGNOSTIC", { status: 409 });
    const json = vi.spyOn(response, "json");
    vi.mocked(authenticatedFetch).mockResolvedValue(response);
    await expect(fetchWork()).rejects.toBeInstanceOf(CommercialRequestError);
    expect(json).not.toHaveBeenCalled();
  });
});
