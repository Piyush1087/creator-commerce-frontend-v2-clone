// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  readPortfolio,
  writePortfolio,
  PortfolioRequestError,
} from "../api/portfolio-client";
import {
  portfolioFixture,
  manualItem,
  portfolioReferenceCommand,
} from "../testing/portfolio.fixture";
import { usePortfolio } from "./use-portfolio";
vi.mock("../api/portfolio-client", async (original) => ({
  ...(await original<typeof import("../api/portfolio-client")>()),
  readPortfolio: vi.fn(),
  writePortfolio: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
describe("Portfolio state, replay and async fencing", () => {
  it("loads without production mutation", async () => {
    vi.mocked(readPortfolio).mockResolvedValue(portfolioFixture());
    const { result } = renderHook(() => usePortfolio("ALL"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(writePortfolio).not.toHaveBeenCalled();
  });
  it("first failure does not invent work", async () => {
    vi.mocked(readPortfolio).mockRejectedValue(new PortfolioRequestError(503));
    const { result } = renderHook(() => usePortfolio("ALL"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
  });
  it("retains last-good on transient failure but clears unauthorized state", async () => {
    const data = portfolioFixture("OWNER", [manualItem()]);
    vi.mocked(readPortfolio)
      .mockResolvedValueOnce(data)
      .mockRejectedValueOnce(new PortfolioRequestError(503))
      .mockRejectedValueOnce(new PortfolioRequestError(403));
    const { result } = renderHook(() => usePortfolio("ALL"));
    await waitFor(() => expect(result.current.data).toEqual(data));
    await act(() => result.current.reload());
    expect(result.current.data).toEqual(data);
    await act(() => result.current.reload());
    expect(result.current.data).toBeNull();
  });
  it("successful mutation refreshes current filter and pending resets", async () => {
    vi.mocked(readPortfolio).mockResolvedValue(portfolioFixture());
    vi.mocked(writePortfolio).mockResolvedValue(portfolioFixture());
    const { result } = renderHook(() => usePortfolio("REMOVED"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.submit(portfolioReferenceCommand));
    expect(readPortfolio).toHaveBeenLastCalledWith(
      "REMOVED",
      expect.any(AbortSignal),
    );
    expect(result.current.pending).toBe(false);
    expect(result.current.announcement).toMatch(/saved/u);
  });
  it("stale CAS requires review then retains failed draft opportunity", async () => {
    vi.mocked(readPortfolio).mockResolvedValue(portfolioFixture());
    vi.mocked(writePortfolio).mockRejectedValue(new PortfolioRequestError(409));
    const { result } = renderHook(() => usePortfolio("ALL"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.submit(portfolioReferenceCommand));
    expect(result.current.conflict).toBe(true);
    await act(() => result.current.submit(portfolioReferenceCommand));
    expect(writePortfolio).toHaveBeenCalledOnce();
    act(() => result.current.reviewed());
    expect(result.current.conflict).toBe(false);
  });
  it("ignores a stale aborted read response", async () => {
    let late!: (value: ReturnType<typeof portfolioFixture>) => void;
    vi.mocked(readPortfolio)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            late = resolve;
          }),
      )
      .mockResolvedValue(portfolioFixture("OWNER", [manualItem()]));
    const { result } = renderHook(() => usePortfolio("ALL"));
    await act(() => result.current.reload());
    await act(async () => late(portfolioFixture()));
    expect(result.current.data?.items).toHaveLength(1);
  });
  it("pages with stable revision and deduplicates IDs", async () => {
    const first = {
      ...portfolioFixture("OWNER", [manualItem()]),
      nextCursor: manualItem().id,
    };
    vi.mocked(readPortfolio)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(portfolioFixture("OWNER", [manualItem()]));
    const { result } = renderHook(() => usePortfolio("ALL"));
    await waitFor(() => expect(result.current.data).toEqual(first));
    await act(() => result.current.loadMore());
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.nextCursor).toBeNull();
  });
});
