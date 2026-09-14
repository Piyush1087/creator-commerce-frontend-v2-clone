// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CreatorAudience } from "../contracts/creator-audience.schema";
import { CreatorAudienceWorkspace } from "./creator-audience-workspace";

const useAudience = vi.fn();
vi.mock("../hooks/use-creator-audience", () => ({
  useCreatorAudience: () => useAudience(),
}));

function cohort(id: "FOLLOWERS" | "ENGAGED", percentage: number | null = 60) {
  return {
    id,
    availability: "AVAILABLE" as const,
    size: id === "FOLLOWERS" ? 100 : 80,
    dimensions: [
      {
        id: "AGE" as const,
        state: "AVAILABLE" as const,
        denominatorValid: percentage !== null,
        buckets: [{ key: "18-24", count: 60, percentage }],
        limitations: percentage === null ? ["NO_VALID_DENOMINATOR"] : [],
      },
    ],
    limitations: percentage === null ? ["NO_VALID_DENOMINATOR"] : [],
  };
}

function fixture(overrides: Partial<CreatorAudience> = {}): CreatorAudience {
  return {
    contractVersion: "creator_audience_v0.1",
    generatedAt: "2026-09-14T10:00:00.000Z",
    status: "READY",
    context: { role: "OWNER" },
    source: "INSTAGRAM",
    sourceStatus: "CONNECTED",
    snapshotBasis: {
      period: "lifetime",
      timeframe: "this_month",
      capturedAt: "2026-09-14T10:00:00.000Z",
    },
    defaultCohort: "FOLLOWERS",
    highlights: [
      {
        id: "highlight",
        text: "18–24 is the largest follower group.",
        evidence: ["FOLLOWERS:AGE:18-24"],
      },
    ],
    cohorts: [cohort("FOLLOWERS"), cohort("ENGAGED")],
    freshness: { state: "CURRENT", staleAfterHours: 192 },
    processingState: "IDLE",
    currentPreserved: false,
    limitations: [],
    settingsRecoveryRoute: "/creator/settings/instagram",
    ...overrides,
  };
}

beforeEach(() =>
  useAudience.mockReturnValue({
    data: fixture(),
    loading: false,
    error: null,
    preservingLastGood: false,
    retry: vi.fn(),
  }),
);
afterEach(cleanup);

describe("Creator Audience workspace truth states", () => {
  it("renders bounded loading and retryable read-error states", () => {
    const retry = vi.fn();
    useAudience.mockReturnValueOnce({
      data: null,
      loading: true,
      error: null,
      preservingLastGood: false,
      retry,
    });
    const { rerender } = render(
      <MemoryRouter>
        <CreatorAudienceWorkspace />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("Audience").getAttribute("aria-busy")).toBe(
      "true",
    );
    useAudience.mockReturnValue({
      data: null,
      loading: false,
      error: "Audience could not be loaded.",
      preservingLastGood: false,
      retry,
    });
    rerender(
      <MemoryRouter>
        <CreatorAudienceWorkspace />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("renders source, highlights before a two-cohort keyboard-operable switch, and status last", async () => {
    const { container } = render(
      <MemoryRouter>
        <CreatorAudienceWorkspace />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Audience" }),
    ).toBeTruthy();
    expect(screen.getByText("Audience Highlights")).toBeTruthy();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    const followers = screen.getByRole("tab", { name: "Followers" });
    followers.focus();
    fireEvent.keyDown(followers, { key: "ArrowRight" });
    expect(
      screen
        .getByRole("tab", { name: "Engaged" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("tab", { name: "Engaged" }),
      ),
    );
    const text = container.textContent ?? "";
    expect(text.indexOf("Audience Highlights")).toBeLessThan(
      text.indexOf("Followers"),
    );
    expect(text.indexOf("Data status & limitations")).toBeGreaterThan(
      text.indexOf("Engaged audience"),
    );
  });

  it("renders one usable cohort directly and count-only without a one-option switch", () => {
    useAudience.mockReturnValue({
      data: fixture({
        status: "PARTIAL",
        cohorts: [
          cohort("FOLLOWERS", null),
          { ...cohort("ENGAGED"), availability: "UNAVAILABLE", dimensions: [] },
        ],
        highlights: [],
      }),
      loading: false,
      error: null,
      preservingLastGood: false,
      retry: vi.fn(),
    });
    render(
      <MemoryRouter>
        <CreatorAudienceWorkspace />
      </MemoryRouter>,
    );
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.getByText("60")).toBeTruthy();
    expect(document.body.textContent).not.toContain("60%");
  });

  it("renders no empty chart and only a Settings recovery link when no cohort is usable", () => {
    useAudience.mockReturnValue({
      data: fixture({
        status: "UNAVAILABLE",
        sourceStatus: "REAUTH_REQUIRED",
        defaultCohort: null,
        highlights: [],
        cohorts: [
          {
            ...cohort("FOLLOWERS"),
            availability: "UNAVAILABLE",
            dimensions: [],
          },
          { ...cohort("ENGAGED"), availability: "UNAVAILABLE", dimensions: [] },
        ],
      }),
      loading: false,
      error: null,
      preservingLastGood: false,
      retry: vi.fn(),
    });
    render(
      <MemoryRouter>
        <CreatorAudienceWorkspace />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/No demographic cohort is currently usable/),
    ).toBeTruthy();
    expect(
      screen
        .getAllByRole("link", { name: "Review Instagram settings" })[0]
        .getAttribute("href"),
    ).toBe("/creator/settings/instagram");
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });

  it("preserves last-good data with a truthful warning after a retryable read error", () => {
    useAudience.mockReturnValue({
      data: fixture(),
      loading: false,
      error: "Audience could not be loaded.",
      preservingLastGood: true,
      retry: vi.fn(),
    });
    render(
      <MemoryRouter>
        <CreatorAudienceWorkspace />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("Showing the last good Audience snapshot"),
    ).toBeTruthy();
    expect(
      screen.getByText("18–24 is the largest follower group."),
    ).toBeTruthy();
  });

  it.each([
    "DISCONNECTED",
    "REAUTH_REQUIRED",
    "CAPABILITY_PARTIAL",
    "CAPABILITY_UNKNOWN",
    "PROVIDER_FAILURE",
  ] as const)(
    "projects %s as recovery truth without mutation controls",
    (sourceStatus) => {
      useAudience.mockReturnValue({
        data: fixture({ sourceStatus, status: "PARTIAL" }),
        loading: false,
        error: null,
        preservingLastGood: false,
        retry: vi.fn(),
      });
      render(
        <MemoryRouter>
          <CreatorAudienceWorkspace />
        </MemoryRouter>,
      );
      expect(
        screen.getByText(
          new RegExp(sourceStatus.toLowerCase().split("_").join(" "), "i"),
        ),
      ).toBeTruthy();
      expect(
        screen.getByRole("link", { name: "Review Instagram settings" }),
      ).toBeTruthy();
      expect(
        screen.queryByRole("button", { name: /refresh|connect|reauth/i }),
      ).toBeNull();
    },
  );

  it("does not make follower demographics selectable from an account-level count alone", () => {
    useAudience.mockReturnValue({
      data: fixture({
        status: "UNAVAILABLE",
        defaultCohort: null,
        highlights: [],
        cohorts: [
          {
            ...cohort("FOLLOWERS"),
            size: 1200,
            availability: "UNAVAILABLE",
            dimensions: [],
            limitations: ["PROVIDER_EMPTY_OR_THRESHOLD_SUPPRESSED"],
          },
        ],
      }),
      loading: false,
      error: null,
      preservingLastGood: false,
      retry: vi.fn(),
    });
    render(
      <MemoryRouter>
        <CreatorAudienceWorkspace />
      </MemoryRouter>,
    );
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(
      screen.getByText(/No demographic cohort is currently usable/),
    ).toBeTruthy();
  });
});
