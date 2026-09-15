// @vitest-environment jsdom
import { act, renderHook, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { creatorBrandFixture } from "../testing/creator-brand.fixture";
import { emptyCreatorBrandProfile } from "../contracts/creator-brand-profile.contract";
import { useCreatorBrand } from "./use-creator-brand";
import {
  fetchCreatorBrand,
  mutateCreatorBrand,
  CreatorBrandRequestError,
} from "../api/creator-brand-client";
vi.mock("../api/creator-brand-client", async (original) => ({
  ...(await original<typeof import("../api/creator-brand-client")>()),
  fetchCreatorBrand: vi.fn(),
  mutateCreatorBrand: vi.fn(),
}));
const command = {
  intent: "MANUAL" as const,
  expectedRevision: 0,
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  values: emptyCreatorBrandProfile(),
};
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
describe("Creator Brand real hook", () => {
  it("loads without any write", async () => {
    vi.mocked(fetchCreatorBrand).mockResolvedValue(creatorBrandFixture());
    const { result } = renderHook(useCreatorBrand);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.state).toBe("UNCONFIGURED");
    expect(mutateCreatorBrand).not.toHaveBeenCalled();
  });
  it("shows first-read failure without fabricating a profile", async () => {
    vi.mocked(fetchCreatorBrand).mockRejectedValue(
      new CreatorBrandRequestError(503),
    );
    const { result } = renderHook(useCreatorBrand);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
  });
  it("retains last good confirmed values on failed reload", async () => {
    const data = creatorBrandFixture("OWNER", true);
    vi.mocked(fetchCreatorBrand)
      .mockResolvedValueOnce(data)
      .mockRejectedValueOnce(new CreatorBrandRequestError(503));
    const { result } = renderHook(useCreatorBrand);
    await waitFor(() => expect(result.current.data).toEqual(data));
    await act(() => result.current.retry());
    expect(result.current.data).toEqual(data);
    expect(result.current.error).toBeTruthy();
  });
  it("only replaces canonical values with a successful server response", async () => {
    vi.mocked(fetchCreatorBrand).mockResolvedValue(creatorBrandFixture());
    const saved = creatorBrandFixture("OWNER", true);
    vi.mocked(mutateCreatorBrand).mockResolvedValue(saved);
    const { result } = renderHook(useCreatorBrand);
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.submit(command));
    expect(result.current.data).toEqual(saved);
    expect(result.current.announcement).toMatch(/saved/u);
  });
  it("failed mutation retains confirmed state", async () => {
    const data = creatorBrandFixture("OWNER", true);
    vi.mocked(fetchCreatorBrand).mockResolvedValue(data);
    vi.mocked(mutateCreatorBrand).mockRejectedValue(
      new CreatorBrandRequestError(503),
    );
    const { result } = renderHook(useCreatorBrand);
    await waitFor(() => expect(result.current.data).toEqual(data));
    await act(() => result.current.submit(command));
    expect(result.current.data).toEqual(data);
    expect(result.current.pending).toBe(false);
  });
  it("conflict refreshes canonical state and prevents retry until reviewed", async () => {
    const latest = creatorBrandFixture("OWNER", true);
    vi.mocked(fetchCreatorBrand)
      .mockResolvedValueOnce(creatorBrandFixture())
      .mockResolvedValueOnce(latest);
    vi.mocked(mutateCreatorBrand).mockRejectedValue(
      new CreatorBrandRequestError(409),
    );
    const { result } = renderHook(useCreatorBrand);
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.submit(command));
    expect(result.current.conflict).toBe(true);
    expect(result.current.data).toEqual(latest);
    await act(() => result.current.submit(command));
    expect(mutateCreatorBrand).toHaveBeenCalledTimes(1);
    act(() => result.current.reviewed());
    expect(result.current.conflict).toBe(false);
  });
});
