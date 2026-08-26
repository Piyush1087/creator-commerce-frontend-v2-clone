import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { consumerFixture } from "../testing/brand-consumer-fixtures";
import { BrandConsumerContractError } from "../schemas/brand-centre-brand-schema";
import { BrandWorkspaceState } from "../components/brand-workspace/BrandWorkspace";
import { createBrandWorkspaceCache } from "./brand-workspace-cache";

describe("Brand consumer query/cache", () => {
  it("loads without cache and retains content throughout a background request", async () => {
    let resolve: (value: ReturnType<typeof consumerFixture>) => void = () =>
      undefined;
    const read = vi
      .fn()
      .mockResolvedValueOnce(consumerFixture())
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      );
    const cache = createBrandWorkspaceCache(read);
    expect(cache.getSnapshot()).toEqual({ status: "REQUEST_LOADING" });
    await cache.refresh();
    const previous = cache.getSnapshot().projection;
    const refresh = cache.refresh();
    expect(cache.getSnapshot().status).toBe("BACKGROUND_LOADING");
    expect(cache.getSnapshot().projection).toBe(previous);
    const html = renderToStaticMarkup(
      createElement(BrandWorkspaceState, { state: cache.getSnapshot() }),
    );
    expect(html).toContain("Protected current");
    expect(html).not.toContain("Loading Brand information");
    resolve(consumerFixture(2));
    await refresh;
    expect(cache.getSnapshot().projection?.audience.personas).toHaveLength(2);
  });
  it.each(["CURRENT", "STALE"] as const)(
    "failed refresh preserves %s current and READY result",
    async (freshness) => {
      const p = consumerFixture();
      p.brandIdentity.positioning.freshness = freshness;
      const read = vi
        .fn()
        .mockResolvedValueOnce(p)
        .mockRejectedValueOnce(new Error("provider/attempt secret"));
      const cache = createBrandWorkspaceCache(read);
      await cache.refresh();
      const previous = cache.getSnapshot();
      await cache.refresh();
      expect(cache.getSnapshot()).toMatchObject({
        status: "REQUEST_ERROR_WITH_CURRENT",
        issue: "REQUEST_FAILED",
      });
      expect(cache.getSnapshot().projection).toBe(previous.projection);
      expect(cache.getSnapshot().view).toBe(previous.view);
      expect(
        cache.getSnapshot().projection?.brandIdentity.positioning,
      ).toMatchObject({
        freshness,
        readiness: "READY",
        resultReadiness: "READY",
        current: { kind: "VALUE", value: "Protected current" },
      });
      expect(cache.getSnapshot().projection?.runtimeActivity).toBe("NONE");
      const html = renderToStaticMarkup(
        createElement(BrandWorkspaceState, { state: cache.getSnapshot() }),
      );
      expect(html).toContain("Protected current");
      expect(html).not.toContain("provider/attempt secret");
    },
  );
  it("backend failed execution does not erase current or change semantic readiness", async () => {
    const p = consumerFixture();
    p.runtimeActivity = "TEMPORARILY_UNAVAILABLE";
    const cache = createBrandWorkspaceCache(vi.fn().mockResolvedValue(p));
    await cache.refresh();
    expect(
      cache.getSnapshot().projection?.brandIdentity.positioning.resultReadiness,
    ).toBe("READY");
    expect(cache.getSnapshot().view?.runtimeActivity).toBe(
      "TEMPORARILY_UNAVAILABLE",
    );
  });
  it("malformed refresh retains valid cache; initial malformed response renders bounded error", async () => {
    const cache = createBrandWorkspaceCache(
      vi
        .fn()
        .mockResolvedValueOnce(consumerFixture())
        .mockRejectedValueOnce(new BrandConsumerContractError()),
    );
    await cache.refresh();
    await cache.refresh();
    expect(cache.getSnapshot()).toMatchObject({
      status: "REQUEST_ERROR_WITH_CURRENT",
      issue: "MALFORMED_RESPONSE",
    });
    const empty = createBrandWorkspaceCache(
      vi.fn().mockRejectedValue(new BrandConsumerContractError()),
    );
    await empty.refresh();
    expect(empty.getSnapshot()).toEqual({
      status: "REQUEST_ERROR_EMPTY",
      issue: "MALFORMED_RESPONSE",
    });
    const html = renderToStaticMarkup(
      createElement(BrandWorkspaceState, { state: empty.getSnapshot() }),
    );
    expect(html).toContain("could not be read safely");
    expect(html).not.toContain("data-brand-section");
  });
  it("late and cancelled requests cannot replace current or publish after unmount", async () => {
    let resolve: (value: ReturnType<typeof consumerFixture>) => void = () =>
      undefined;
    const cache = createBrandWorkspaceCache(
      vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((done) => {
              resolve = done;
            }),
        )
        .mockResolvedValueOnce(consumerFixture(2)),
    );
    const first = cache.refresh();
    await cache.refresh();
    resolve(consumerFixture(1));
    await first;
    expect(cache.getSnapshot().projection?.audience.personas).toHaveLength(2);
    const other = createBrandWorkspaceCache(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const notify = vi.fn();
    const unsubscribe = other.subscribe(notify);
    const pending = other.refresh();
    other.cancel();
    unsubscribe();
    resolve(consumerFixture());
    await pending;
    expect(other.getSnapshot().projection).toBeUndefined();
    expect(notify).toHaveBeenCalledTimes(1);
  });
  it("separate route/cache instances cannot share Brand data", async () => {
    const first = createBrandWorkspaceCache(
      vi.fn().mockResolvedValue(consumerFixture()),
    );
    await first.refresh();
    expect(
      createBrandWorkspaceCache().getSnapshot().projection,
    ).toBeUndefined();
  });
});
