import { describe, expect, it, vi } from "vitest";
import { createOfferingDiscoveryCache, createProductDetailCache, productQueryKeys } from "./product-intelligence-cache";
import { productFixture } from "../testing/product-intelligence-fixtures";
describe("Product cache identity", () => {
  it("uses dedicated discovery and exact Offering detail keys", () => { expect(productQueryKeys.discovery).toEqual(["brand-centre", "offerings"]); expect(productQueryKeys.detail("a")).not.toEqual(productQueryKeys.detail("b")); });
  it("isolates Offering A and B reads", async () => { const read = vi.fn(async (id: string) => ({ ...productFixture, offering: { ...productFixture.offering, id } })); const a = createProductDetailCache("11111111-1111-4111-8111-111111111111", read); const b = createProductDetailCache("22222222-2222-4222-8222-222222222222", read); await Promise.all([a.refresh(), b.refresh()]); expect(a.getSnapshot().data?.offering.id).not.toBe(b.getSnapshot().data?.offering.id); });
  it("preserves discovery order", async () => { const offerings = [{ offeringId: "b", name: "B", kind: "PRODUCT" as const, subtype: null, lifecycle: "ACTIVE" as const }, { offeringId: "a", name: "A", kind: "SERVICE" as const, subtype: null, lifecycle: "PAUSED_INACTIVE" as const }]; const cache = createOfferingDiscoveryCache(async () => ({ offerings })); await cache.refresh(); expect(cache.getSnapshot().data?.offerings).toEqual(offerings); });
});
