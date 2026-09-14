// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { contentFixture } from "../contracts/creator-content.schema.test";
import { CreatorContentWorkspace } from "./creator-content-workspace";

const useContent = vi.fn();
vi.mock("../hooks/use-creator-content", () => ({
  useCreatorContent: () => useContent(),
}));
beforeEach(() =>
  useContent.mockReturnValue({
    data: contentFixture,
    loading: false,
    error: null,
    preservingLastGood: false,
    retry: vi.fn(),
  }),
);
afterEach(cleanup);

describe("Creator Content workspace", () => {
  it("renders the frozen hierarchy, factual claims, peer navigation and safe link", () => {
    render(
      <MemoryRouter initialEntries={["/creator/insights/content"]}>
        <CreatorContentWorkspace />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Content" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: "Creator Insights sections" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Content" })
        .getAttribute("aria-current"),
    ).toBe("page");
    [
      "Content Snapshot",
      "Content Highlights",
      "What You Create",
      "Content Performance",
      "Representative Content",
      "Data Status & Limitations",
    ].forEach((name) => expect(screen.getByText(name)).toBeTruthy());
    expect(
      screen
        .getByRole("link", { name: /View on Instagram/ })
        .getAttribute("rel"),
    ).toBe("noreferrer");
  });
  it("distinguishes unavailable, loading, and preserved-last-good states", () => {
    const retry = vi.fn();
    useContent.mockReturnValueOnce({
      data: null,
      loading: true,
      error: null,
      preservingLastGood: false,
      retry,
    });
    const { rerender } = render(
      <MemoryRouter>
        <CreatorContentWorkspace />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("Content").getAttribute("aria-busy")).toBe(
      "true",
    );
    useContent.mockReturnValue({
      data: null,
      loading: false,
      error: "Unavailable",
      preservingLastGood: false,
      retry,
    });
    rerender(
      <MemoryRouter>
        <CreatorContentWorkspace />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
    useContent.mockReturnValue({
      data: { ...contentFixture, currentPreserved: true },
      loading: false,
      error: null,
      preservingLastGood: true,
      retry,
    });
    rerender(
      <MemoryRouter>
        <CreatorContentWorkspace />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("Showing the last good Content snapshot"),
    ).toBeTruthy();
  });
  it("does not manufacture claims for empty bounded data", () => {
    useContent.mockReturnValue({
      data: {
        ...contentFixture,
        highlights: [],
        performance: { ...contentFixture.performance, claims: [] },
        representatives: [],
      },
      loading: false,
      error: null,
      preservingLastGood: false,
      retry: vi.fn(),
    });
    render(
      <MemoryRouter>
        <CreatorContentWorkspace />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("No supported highlight is available yet."),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "No comparison meets the sample, coverage, and materiality gates.",
      ),
    ).toBeTruthy();
  });
});
