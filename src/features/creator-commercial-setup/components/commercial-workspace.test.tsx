// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { commercialFixture } from "../testing/commercial.fixture";
import { useCommercialSetup } from "../hooks/use-commercial-setup";
import { CommercialWorkspace } from "./commercial-workspace";
vi.mock("../hooks/use-commercial-setup", () => ({
  useCommercialSetup: vi.fn(),
}));
const fixture = commercialFixture("ASSISTANT");
const state = () => ({
  work: fixture.work,
  rates: fixture.rates,
  loading: false,
  pending: false,
  error: null,
  conflict: false,
  authorized: true,
  announcement: "",
  retry: vi.fn(),
  saveWork: vi.fn(),
  saveRates: vi.fn(),
  reviewed: vi.fn(),
});
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
const renderState = (value: ReturnType<typeof state>) => {
  vi.mocked(useCommercialSetup).mockReturnValue(value);
  render(
    <MemoryRouter>
      <CommercialWorkspace />
    </MemoryRouter>,
  );
};
describe("Commercial combined view", () => {
  it("exposes loading without fabricated form data", () => {
    renderState({
      ...state(),
      work: null,
      rates: null,
      loading: true,
    } as unknown as ReturnType<typeof state>);
    expect(screen.getByRole("status").textContent).toContain("Loading");
    expect(screen.queryByRole("form")).toBeNull();
  });
  it("renders distinct sections and read-only supremacy terms", () => {
    renderState(state());
    expect(
      screen.getByRole("navigation", { name: "Commercial Setup sections" }),
    ).toBeTruthy();
    expect(screen.getByRole("form", { name: "Work Preferences" })).toBeTruthy();
    expect(screen.getByRole("form", { name: "Rate Card" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save Rate Card" })).toBeNull();
    expect(screen.getByText(/Coming soon/)).toBeTruthy();
  });
  it("partial error preserves available section and provides explicit retry", () => {
    const retry = vi.fn();
    renderState({
      ...state(),
      work: null,
      error: "Safe failure",
      retry,
    } as unknown as ReturnType<typeof state>);
    expect(screen.getByRole("form", { name: "Rate Card" })).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry loading Commercial Setup" }),
    );
    expect(retry).toHaveBeenCalledTimes(1);
  });
  it("requires explicit latest-state review after conflict", () => {
    const reviewed = vi.fn();
    renderState({ ...state(), conflict: true, reviewed });
    fireEvent.click(
      screen.getByRole("button", { name: "I reviewed the latest values" }),
    );
    expect(reviewed).toHaveBeenCalledTimes(1);
  });
});
