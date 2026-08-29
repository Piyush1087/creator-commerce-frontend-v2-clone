import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCanonicalOfferings, fetchProductIntelligence, putManualOfferingPrice } from "./product-intelligence-client";
import { productFixture } from "../testing/product-intelligence-fixtures";
type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
afterEach(() => vi.unstubAllGlobals());
beforeEach(() => vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => undefined, removeItem: () => undefined }));
describe("Product clients", () => {
  it("discovers only through the canonical endpoint", async () => { const mock = vi.fn<Fetch>(async () => new Response(JSON.stringify({ offerings: [] }), { status: 200 })); vi.stubGlobal("fetch", mock); await fetchCanonicalOfferings(); expect(String(mock.mock.calls[0][0])).toContain("/api/v1/brand-centre/offerings"); expect(String(mock.mock.calls[0][0])).not.toContain("/dna/offerings"); });
  it("reads the exact selected Offering", async () => { const mock = vi.fn<Fetch>(async () => new Response(JSON.stringify(productFixture), { status: 200 })); vi.stubGlobal("fetch", mock); await fetchProductIntelligence(productFixture.offering.id); expect(String(mock.mock.calls[0][0])).toContain(`${productFixture.offering.id}/intelligence`); });
  it("writes the exact manual DTO to the accepted route", async () => { const mock = vi.fn<Fetch>(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })); vi.stubGlobal("fetch", mock); await putManualOfferingPrice(productFixture.offering.id, { mode: "EXACT", currentMinAmount: "25", currentMaxAmount: "25", currency: "USD" }); const [url, init] = mock.mock.calls[0]; expect(String(url)).toContain(`/dna/offerings/${productFixture.offering.id}/price`); expect(JSON.parse(String(init?.body))).toEqual({ mode: "EXACT", currentMinAmount: "25", currentMaxAmount: "25", currency: "USD" }); });
  it("fails boundedly when a manual write is rejected", async () => { const mock = vi.fn<Fetch>(async () => new Response(JSON.stringify({ message: "invalid" }), { status: 422 })); vi.stubGlobal("fetch", mock); await expect(putManualOfferingPrice(productFixture.offering.id, { mode: "EXACT", currentMinAmount: "25", currentMaxAmount: "25", currency: "USD" })).rejects.toMatchObject({ status: 422 }); });
});
