// @vitest-environment jsdom
import { StrictMode, type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useInstagramMediaDetail } from "./hooks/use-instagram-media-detail";
import { instagramMediaDetailFixture } from "./testing/instagram-b4-fixture";

const mocks = vi.hoisted(() => ({ getDetail: vi.fn() }));
vi.mock("./api/instagram-b4-client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./api/instagram-b4-client")>();
  return { ...actual, getInstagramMediaDetail: mocks.getDetail };
});

const strict = ({ children }: PropsWithChildren) => (
  <StrictMode>{children}</StrictMode>
);

afterEach(() => {
  mocks.getDetail.mockReset();
});

describe("useInstagramMediaDetail request lifecycle", () => {
  it("issues one request under Strict Mode and reaches ready", async () => {
    mocks.getDetail.mockResolvedValue(instagramMediaDetailFixture());
    const { result } = renderHook(
      () => useInstagramMediaDetail("media-one", "brand-one"),
      { wrapper: strict },
    );
    await waitFor(() => expect(result.current.state.kind).toBe("DETAIL_READY"));
    expect(mocks.getDetail).toHaveBeenCalledTimes(1);
  });

  it("aborts obsolete media and discards its late response", async () => {
    let resolveFirst: (
      value: ReturnType<typeof instagramMediaDetailFixture>,
    ) => void = () => undefined;
    mocks.getDetail
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({
        ...instagramMediaDetailFixture(),
        mediaId: "media-two",
      });
    const { result, rerender } = renderHook(
      ({ id }) => useInstagramMediaDetail(id, "brand-one"),
      { initialProps: { id: "media-one" }, wrapper: strict },
    );
    await waitFor(() => expect(mocks.getDetail).toHaveBeenCalledTimes(1));
    const firstSignal = mocks.getDetail.mock.calls[0][1] as AbortSignal;
    rerender({ id: "media-two" });
    await waitFor(() => expect(mocks.getDetail).toHaveBeenCalledTimes(2));
    expect(firstSignal.aborted).toBe(true);
    await waitFor(() => expect(result.current.state.kind).toBe("DETAIL_READY"));
    if (result.current.state.kind === "DETAIL_READY")
      expect(result.current.state.detail.mediaId).toBe("media-two");
    await act(async () => resolveFirst(instagramMediaDetailFixture()));
    if (result.current.state.kind === "DETAIL_READY")
      expect(result.current.state.detail.mediaId).toBe("media-two");
  });

  it("uses a bounded explicit retry without touching aggregate state", async () => {
    mocks.getDetail
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce(instagramMediaDetailFixture());
    const { result } = renderHook(
      () => useInstagramMediaDetail("media-one", "brand-one"),
      { wrapper: strict },
    );
    await waitFor(() =>
      expect(result.current.state.kind).toBe("DETAIL_TRANSIENT_ERROR"),
    );
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.state.kind).toBe("DETAIL_READY"));
    expect(mocks.getDetail).toHaveBeenCalledTimes(2);
  });
});
