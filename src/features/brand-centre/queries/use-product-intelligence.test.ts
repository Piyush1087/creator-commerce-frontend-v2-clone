import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => {
  let memoIdentity: unknown;
  let memoValue: unknown;
  let effectIdentity: unknown;
  let cleanup: (() => void) | undefined;
  const caches = new Map<string, { refresh: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn>; getSnapshot: ReturnType<typeof vi.fn> }>();
  return {
    caches,
    reset() { memoIdentity = undefined; memoValue = undefined; effectIdentity = undefined; cleanup = undefined; caches.clear(); },
    useMemo(factory: () => unknown, dependencies: unknown[]) { if (memoIdentity !== dependencies[0]) { memoIdentity = dependencies[0]; memoValue = factory(); } return memoValue; },
    useEffect(effect: () => void | (() => void), dependencies: unknown[]) { if (effectIdentity !== dependencies[0]) { cleanup?.(); effectIdentity = dependencies[0]; cleanup = effect() ?? undefined; } },
  };
});

vi.mock("react", () => ({
  useMemo: harness.useMemo,
  useEffect: harness.useEffect,
  useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
  useState: (initial: unknown) => [typeof initial === "function" ? (initial as () => unknown)() : initial, vi.fn()],
}));
vi.mock("./product-intelligence-cache", () => ({
  createOfferingDiscoveryCache: vi.fn(),
  createProductDetailCache: vi.fn((offeringId: string) => {
    const cache = { refresh: vi.fn(async () => undefined), cancel: vi.fn(), subscribe: vi.fn(() => () => undefined), getSnapshot: vi.fn(() => ({ status: "LOADING", offeringId })) };
    harness.caches.set(offeringId, cache);
    return cache;
  }),
}));

import { useProductDetail } from "./use-product-intelligence";

describe("mounted Product detail identity", () => {
  beforeEach(() => harness.reset());
  it("transitions A to B with a fresh B cache and cancels superseded A", () => {
    const a = useProductDetail("offering-a");
    expect(a.state).toMatchObject({ offeringId: "offering-a" });
    const b = useProductDetail("offering-b");
    expect(b.state).toMatchObject({ offeringId: "offering-b" });
    expect(harness.caches.get("offering-a")?.cancel).toHaveBeenCalledOnce();
    expect(harness.caches.get("offering-b")?.refresh).toHaveBeenCalledOnce();
    expect(b.state).not.toBe(a.state);
  });
});
