// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCreatorAudience } from "../api/creator-audience-client";
import type { CreatorAudience } from "../contracts/creator-audience.schema";
import { useCreatorAudience } from "./use-creator-audience";

vi.mock("../api/creator-audience-client", () => ({
  fetchCreatorAudience: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.mocked(fetchCreatorAudience).mockReset();
});
const value = { contractVersion: "creator_audience_v1.1" } as CreatorAudience;
describe("Audience readonly hook", () => {
  it("reads once and preserves the last good contract after an explicit failed read retry", async () => {
    vi.mocked(fetchCreatorAudience)
      .mockResolvedValueOnce(value)
      .mockRejectedValueOnce(new Error("Read unavailable"));
    const { result } = renderHook(() => useCreatorAudience());
    await waitFor(() => expect(result.current.data).toBe(value));
    expect(fetchCreatorAudience).toHaveBeenCalledOnce();
    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.data).toBe(value);
    expect(result.current.preservingLastGood).toBe(true);
    expect(result.current.error).toBe("Read unavailable");
    expect(fetchCreatorAudience).toHaveBeenCalledTimes(2);
  });
  it("aborts an outstanding read on unmount", () => {
    vi.mocked(fetchCreatorAudience).mockImplementation(
      () => new Promise(() => {}),
    );
    const { unmount } = renderHook(() => useCreatorAudience());
    const signal = vi.mocked(fetchCreatorAudience).mock.calls[0][0];
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
