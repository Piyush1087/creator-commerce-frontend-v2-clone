// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getBrandHome } from "../api/brand-home-client";
import {
  brandHomeItemFixture,
  brandHomeResponseFixture,
} from "../testing/brand-home-fixtures";
import { BrandHomeBriefingWorkspace } from "./brand-home-briefing-workspace";

vi.mock("../api/brand-home-client", () => ({ getBrandHome: vi.fn() }));

const homeMock = vi.mocked(getBrandHome);

function mount() {
  return render(
    createElement(
      MemoryRouter,
      undefined,
      createElement(BrandHomeBriefingWorkspace),
    ),
  );
}

beforeEach(() => homeMock.mockReset());
afterEach(cleanup);

describe("permanent Brand Home rendering", () => {
  it("keeps a bounded shell and canonical section placeholders while loading", () => {
    homeMock.mockReturnValueOnce(new Promise(() => undefined));
    mount();

    expect(screen.getByRole("status").textContent).toContain(
      "Loading Brand Home",
    );
    for (const heading of [
      "Needs Attention",
      "Creator Shop Has Learned",
      "Opportunities / Next Actions",
      "Current Momentum",
    ]) {
      expect(screen.getByText(heading)).toBeTruthy();
    }
    expect(screen.queryByText("Good morning, Alex")).toBeNull();
  });

  it("renders READY data and preserves the exact backend section and item order", async () => {
    const first = brandHomeItemFixture({ id: "first", title: "First item" });
    const second = brandHomeItemFixture({ id: "second", title: "Second item" });
    homeMock.mockResolvedValueOnce(
      brandHomeResponseFixture({
        sections: [
          { id: "NEEDS_ATTENTION", state: "READY", items: [first, second] },
          { id: "CREATOR_SHOP_HAS_LEARNED", state: "EMPTY", items: [] },
          { id: "OPPORTUNITIES_NEXT_ACTIONS", state: "EMPTY", items: [] },
          { id: "CURRENT_MOMENTUM", state: "EMPTY", items: [] },
        ],
      }),
    );

    const { container } = mount();
    expect(await screen.findByText("First item")).toBeTruthy();
    const sections = Array.from(
      container.querySelectorAll<HTMLElement>("[data-section-id]"),
    );
    expect(sections.map((section) => section.dataset.sectionId)).toEqual([
      "NEEDS_ATTENTION",
      "CREATOR_SHOP_HAS_LEARNED",
      "OPPORTUNITIES_NEXT_ACTIONS",
      "CURRENT_MOMENTUM",
    ]);
    const items = Array.from(
      sections[0]?.querySelectorAll(".brand-home-item h3") ?? [],
    ).map((heading) => heading.textContent);
    expect(items).toEqual(["First item", "Second item"]);
  });

  it("renders EMPTY, PARTIAL, and UNAVAILABLE without erasing valid data", async () => {
    homeMock.mockResolvedValueOnce(
      brandHomeResponseFixture({
        status: "PARTIAL",
        sections: [
          { id: "NEEDS_ATTENTION", state: "EMPTY", items: [] },
          {
            id: "CREATOR_SHOP_HAS_LEARNED",
            state: "PARTIAL",
            items: [
              brandHomeItemFixture({
                id: "available-learning",
                title: "Available grounded learning",
              }),
            ],
          },
          {
            id: "OPPORTUNITIES_NEXT_ACTIONS",
            state: "UNAVAILABLE",
            items: [],
          },
          { id: "CURRENT_MOMENTUM", state: "EMPTY", items: [] },
        ],
      }),
    );

    mount();
    expect(
      await screen.findByText("Available grounded learning"),
    ).toBeTruthy();
    expect(screen.getByText("Nothing needs your attention right now.")).toBeTruthy();
    expect(
      screen.getByText("This section is temporarily unavailable."),
    ).toBeTruthy();
    expect(screen.getByText("Some Home information is limited")).toBeTruthy();
  });

  it("renders the top-level UNAVAILABLE state without hiding its four sections", async () => {
    homeMock.mockResolvedValueOnce(
      brandHomeResponseFixture({
        status: "UNAVAILABLE",
        sections: [
          { id: "NEEDS_ATTENTION", state: "UNAVAILABLE", items: [] },
          {
            id: "CREATOR_SHOP_HAS_LEARNED",
            state: "UNAVAILABLE",
            items: [],
          },
          {
            id: "OPPORTUNITIES_NEXT_ACTIONS",
            state: "UNAVAILABLE",
            items: [],
          },
          { id: "CURRENT_MOMENTUM", state: "UNAVAILABLE", items: [] },
        ],
      }),
    );

    const { container } = mount();
    expect(
      await screen.findByText("Brand Home information is unavailable"),
    ).toBeTruthy();
    expect(container.querySelectorAll("[data-section-id]")).toHaveLength(4);
    expect(screen.getAllByText("This section is temporarily unavailable.")).toHaveLength(4);
  });

  it("discloses STALE, UNKNOWN, limitations, and truncation in text", async () => {
    homeMock.mockResolvedValueOnce(
      brandHomeResponseFixture({
        truncated: true,
        limitations: ["One source returned a bounded result."],
        sections: [
          {
            id: "NEEDS_ATTENTION",
            state: "READY",
            items: [
              brandHomeItemFixture({
                id: "stale-item",
                title: "Last-good item",
                freshness: {
                  state: "STALE",
                  observedAt: "2026-09-02T09:00:00.000Z",
                  changedAt: null,
                  dueAt: null,
                },
                limitations: ["Campaign source is delayed."],
              }),
              brandHomeItemFixture({
                id: "unknown-item",
                title: "Unknown freshness item",
                freshness: {
                  state: "UNKNOWN",
                  observedAt: "2026-09-01T09:00:00.000Z",
                  changedAt: null,
                  dueAt: null,
                },
              }),
            ],
          },
          { id: "CREATOR_SHOP_HAS_LEARNED", state: "EMPTY", items: [] },
          { id: "OPPORTUNITIES_NEXT_ACTIONS", state: "EMPTY", items: [] },
          { id: "CURRENT_MOMENTUM", state: "EMPTY", items: [] },
        ],
        sourceStates: [
          {
            sourceDomain: "CAMPAIGN",
            state: "PARTIAL",
            freshness: "UNKNOWN",
            observedAt: "2026-09-01T09:00:00.000Z",
            truncated: true,
            limitations: ["Campaign source is delayed."],
          },
        ],
      }),
    );

    mount();
    expect(await screen.findByText("Last-good item")).toBeTruthy();
    expect(screen.getByText("Stale")).toBeTruthy();
    expect(screen.getAllByText("Freshness unknown")).toHaveLength(2);
    expect(screen.getByText("This is a bounded briefing")).toBeTruthy();
    expect(screen.getByText("One source returned a bounded result.")).toBeTruthy();
    expect(screen.getAllByText(/Campaign source is delayed\./)).toHaveLength(2);
  });

  it("renders a bounded request failure and retries without affecting the shell", async () => {
    homeMock
      .mockRejectedValueOnce(new Error("internal diagnostic"))
      .mockResolvedValueOnce(brandHomeResponseFixture());
    mount();

    expect(await screen.findByText("Could not load Brand Home")).toBeTruthy();
    expect(screen.getByText("Brand Home is temporarily unavailable.")).toBeTruthy();
    expect(screen.queryByText("internal diagnostic")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(homeMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Complete your Brand setup")).toBeTruthy();
  });
});
