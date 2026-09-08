// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { downloadCreatorBriefPack } from "./creator-brief-pack";
afterEach(() => vi.restoreAllMocks());
it("releases the transient object URL and anchor on success and cancellation", async () => {
  const create = vi.fn(() => "blob:ephemeral"),
    revoke = vi.fn();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: create,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revoke,
  });
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  const pdf = {
    bytes: new ArrayBuffer(4),
    filename: "creator-shop-brief-pack-test.pdf",
    pageCount: 1,
  };
  await downloadCreatorBriefPack(pdf, () => {});
  expect(click).toHaveBeenCalledTimes(1);
  expect(revoke).toHaveBeenCalledWith("blob:ephemeral");
  expect(document.querySelector("a")).toBeNull();
  let calls = 0;
  await expect(
    downloadCreatorBriefPack(pdf, () => {
      if (++calls === 2) throw new DOMException("Changed", "AbortError");
    }),
  ).rejects.toThrow();
  expect(click).toHaveBeenCalledTimes(1);
  expect(revoke).toHaveBeenCalledTimes(2);
  expect(document.querySelector("a")).toBeNull();
});
