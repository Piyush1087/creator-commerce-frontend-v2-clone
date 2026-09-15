import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { PortfolioCommandSchema } from "../contracts/portfolio-consumer";
import {
  readPortfolio,
  writePortfolio,
  PortfolioRequestError,
} from "./portfolio-client";
import {
  portfolioFixture,
  portfolioReferenceCommand,
} from "../testing/portfolio.fixture";
vi.mock("../../../shared/api/authenticated-fetch", () => ({
  authenticatedFetch: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
describe("Portfolio real authenticated client", () => {
  it("strictly reads named filter without credentials in URL and no-store", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify(portfolioFixture())),
    );
    await readPortfolio("REMOVED");
    expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining("?filter=REMOVED"),
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });
  it("validates PUT and preserves exact idempotency body", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify(portfolioFixture())),
    );
    await writePortfolio(portfolioReferenceCommand);
    expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/creator/portfolio"),
      expect.objectContaining({
        method: "PUT",
        cache: "no-store",
        body: JSON.stringify(
          PortfolioCommandSchema.parse(portfolioReferenceCommand),
        ),
      }),
    );
  });
  it.each([400, 401, 403, 409, 503])(
    "sanitizes failure %s without exposing body",
    async (status) => {
      vi.mocked(authenticatedFetch).mockResolvedValue(
        new Response("synthetic private diagnostic", { status }),
      );
      await expect(readPortfolio("ALL")).rejects.toEqual(
        new PortfolioRequestError(status),
      );
    },
  );
  it("fails closed invalid schema and rejects forbidden mutation before HTTP", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(
        JSON.stringify({ ...portfolioFixture(), providerPayload: {} }),
      ),
    );
    await expect(readPortfolio("ALL")).rejects.toThrow("invalid response");
    vi.mocked(authenticatedFetch).mockClear();
    await expect(
      writePortfolio({ ...portfolioReferenceCommand, title: "" }),
    ).rejects.toThrow();
    expect(authenticatedFetch).not.toHaveBeenCalled();
  });
});
