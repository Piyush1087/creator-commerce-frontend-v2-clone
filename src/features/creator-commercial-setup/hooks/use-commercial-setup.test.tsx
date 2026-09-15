// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { commercialFixture } from "../testing/commercial.fixture";
import { useCommercialSetup } from "./use-commercial-setup";
import {
  fetchWork,
  fetchRates,
  saveWork,
  saveRates,
  CommercialRequestError,
} from "../api/commercial-client";
vi.mock("../api/commercial-client", async (original) => ({
  ...(await original<typeof import("../api/commercial-client")>()),
  fetchWork: vi.fn(),
  fetchRates: vi.fn(),
  saveWork: vi.fn(),
  saveRates: vi.fn(),
}));
const fixture = commercialFixture();
const command = {
  expectedRevision: 1,
  expectedRateCardRevision: 1,
  confirmMonetaryReset: false,
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  values: fixture.work.values!,
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchWork).mockResolvedValue(fixture.work);
  vi.mocked(fetchRates).mockResolvedValue(fixture.rates);
});
afterEach(cleanup);
describe("Commercial Setup real hook", () => {
  it("loads both independent aggregates without a write", async () => {
    const { result } = renderHook(useCommercialSetup);
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.work).toEqual(fixture.work);
    expect(result.current.rates).toEqual(fixture.rates);
    expect(saveWork).not.toHaveBeenCalled();
    expect(saveRates).not.toHaveBeenCalled();
  });
  it("preserves available Rate Card on partial failure and recovers via retry", async () => {
    vi.mocked(fetchWork).mockRejectedValueOnce(new CommercialRequestError(503));
    const { result } = renderHook(useCommercialSetup);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.work).toBeNull();
    expect(result.current.rates).toEqual(fixture.rates);
    await act(() => result.current.retry());
    expect(result.current.work).toEqual(fixture.work);
    expect(result.current.error).toBeNull();
  });
  it("preserves last confirmed aggregates after failed reload", async () => {
    const { result } = renderHook(useCommercialSetup);
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.mocked(fetchWork).mockRejectedValue(new Error("unsafe payload"));
    vi.mocked(fetchRates).mockRejectedValue(new Error("unsafe payload"));
    await act(() => result.current.retry());
    expect(result.current.work).toEqual(fixture.work);
    expect(result.current.rates).toEqual(fixture.rates);
    expect(result.current.error).not.toContain("unsafe payload");
  });
  it("conflict fetches latest and fences retry until explicit review", async () => {
    const { result } = renderHook(useCommercialSetup);
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.mocked(saveWork).mockRejectedValue(new CommercialRequestError(409));
    await act(() => result.current.saveWork(command));
    expect(result.current.conflict).toBe(true);
    await act(() => result.current.saveWork(command));
    expect(saveWork).toHaveBeenCalledTimes(1);
    act(() => result.current.reviewed());
    expect(result.current.conflict).toBe(false);
  });
  it("forbidden response prevents subsequent mutation and retains confirmed values", async () => {
    const { result } = renderHook(useCommercialSetup);
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.mocked(saveWork).mockRejectedValue(new CommercialRequestError(403));
    await act(() => result.current.saveWork(command));
    expect(result.current.authorized).toBe(false);
    await act(() => result.current.saveWork(command));
    expect(saveWork).toHaveBeenCalledTimes(1);
    expect(result.current.work).toEqual(fixture.work);
  });
  it("successful explicit save announces success and reloads both aggregates", async () => {
    vi.mocked(saveWork).mockResolvedValue(fixture.work);
    const { result } = renderHook(useCommercialSetup);
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.saveWork(command));
    expect(result.current.announcement).toBe("Work Preferences saved.");
    expect(fetchRates).toHaveBeenCalledTimes(2);
    expect(result.current.pending).toBe(false);
  });
});
