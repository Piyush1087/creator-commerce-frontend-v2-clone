// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstagramWorkspace } from "./components/instagram-workspace";
import { instagramB4Fixture } from "./testing/instagram-b4-fixture";

afterEach(cleanup);

function renderWorkspace(overrides = {}) {
  return render(
    createElement(InstagramWorkspace, {
      data: instagramB4Fixture(),
      isRefreshing: false,
      announcement: "",
      cooldownEndsAt: null,
      onRefresh: vi.fn().mockResolvedValue(undefined),
      onOpenMediaDetail: vi.fn(),
      registerMediaAction: vi.fn(),
      representativePostsHeadingRef: { current: null },
      ...overrides,
    }),
  );
}

describe("Instagram Intelligence E2/E3 workspace", () => {
  it.each([
    "NOT_CONNECTED",
    "CONNECTING",
    "CONNECTED",
    "PARTIAL_CAPABILITY",
    "UNKNOWN_CAPABILITY",
    "REAUTH_REQUIRED",
    "AUTHORIZATION_DEGRADED",
    "SAME_ACCOUNT_RECONNECTING",
    "DIFFERENT_ACCOUNT_CONFLICT",
    "TRANSIENT_PROVIDER_FAILURE",
    "DISCONNECTED",
    "DELETE_IN_PROGRESS",
  ] as const)(
    "renders the %s connection lifecycle without fabricating values",
    (state) => {
      const fixture = instagramB4Fixture();
      const { container } = renderWorkspace({
        data: {
          ...fixture,
          connection: { ...fixture.connection, state },
        },
      });
      expect(
        screen.getByRole("heading", { name: "Instagram Intelligence" }),
      ).toBeTruthy();
      expect(container.textContent).not.toContain("undefined");
    },
  );

  it("renders the frozen singular hierarchy in order without inner tabs", () => {
    const { container } = renderWorkspace();
    const headings = screen
      .getAllByRole("heading")
      .map((node) => node.textContent);
    expect(headings).toEqual([
      "Instagram Intelligence",
      "Account and connection context",
      "Account performance",
      "What is working",
      "Content behavior",
      "Audience response",
      "Creator and collaboration signals",
      "Representative posts",
      "Coverage and freshness",
    ]);
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(container.querySelectorAll("main")).toHaveLength(1);
  });

  it("keeps performance near the top and exposes only the fixed 30-day window", () => {
    renderWorkspace();
    expect(screen.getByText(/Last 30 days/)).toBeTruthy();
    expect(screen.getByText("4,310")).toBeTruthy();
    expect(screen.queryByText(/7-day|14-day|custom date/i)).toBeNull();
    expect(screen.queryByRole("combobox", { name: /window|date/i })).toBeNull();
  });

  it("shows supported signal-learning evidence and bounded insufficient state", () => {
    const { rerender } = renderWorkspace();
    expect(
      screen.getByText(/Short product demonstrations repeatedly/),
    ).toBeTruthy();
    expect(screen.getByText(/Concise demonstrations appear/)).toBeTruthy();
    const fixture = instagramB4Fixture();
    rerender(
      createElement(InstagramWorkspace, {
        data: {
          ...fixture,
          objects: fixture.objects.map((item) => ({
            ...item,
            signals: [],
            learnings: [],
          })),
        },
        isRefreshing: false,
        announcement: "",
        cooldownEndsAt: null,
        onRefresh: vi.fn(),
        onOpenMediaDetail: vi.fn(),
        registerMediaAction: vi.fn(),
        representativePostsHeadingRef: { current: null },
      }),
    );
    expect(
      screen.getAllByText(/Not enough repeated evidence yet/).length,
    ).toBeGreaterThan(0);
  });

  it("preserves partial, unavailable and likely-collab language without canonical claims", () => {
    const { container } = renderWorkspace();
    expect(screen.getByText("Possible Collab")).toBeTruthy();
    expect(
      screen.getByText(
        /not confirmed Creator, Collaboration or Campaign records/i,
      ),
    ).toBeTruthy();
    expect(container.textContent).not.toMatch(
      /confirmed collaboration|paid partnership|Creator Shop creator/i,
    );
    expect(container.textContent).not.toMatch(
      /brand persona|brand meaning|brand character|AI Match/i,
    );

    cleanup();
    const fixture = instagramB4Fixture();
    renderWorkspace({ data: { ...fixture, accountPerformance: [] } });
    expect(
      screen.getByText(/missing results are not treated as zero/i),
    ).toBeTruthy();
    expect(screen.queryByText(/^0$/)).toBeNull();
  });

  it("adds one bounded, distinguishable representative-post detail action", () => {
    const openDetail = vi.fn();
    renderWorkspace({ onOpenMediaDetail: openDetail });
    expect(
      screen.getByRole("heading", { name: "Representative posts" }),
    ).toBeTruthy();
    const action = screen.getByRole("button", {
      name: /View post details for Reels published/i,
    });
    expect(action.textContent).toBe("View post details");
    fireEvent.click(action);
    expect(openDetail).toHaveBeenCalledWith("synthetic-media-1");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("synthetic-media-1")).toBeNull();
  });

  it("uses server action authority for refresh and Settings-only recovery", () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    renderWorkspace({ onRefresh: refresh });
    fireEvent.click(screen.getByRole("button", { name: "Refresh Instagram" }));
    expect(refresh).toHaveBeenCalledTimes(1);

    cleanup();
    const fixture = instagramB4Fixture();
    renderWorkspace({
      data: {
        ...fixture,
        connection: {
          ...fixture.connection,
          state: "REAUTH_REQUIRED",
          reasonCodes: ["REAUTH_REQUIRED"],
        },
        actions: {
          ...fixture.actions,
          manualRefresh: {
            state: "DENIED",
            reasonCode: "REFRESH_NOT_AUTHORIZED",
          },
        },
      },
    });
    expect(
      screen.queryByRole("button", { name: /Refresh Instagram/ }),
    ).toBeNull();
    expect(screen.getByText(/unavailable for your role/i)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Manage connection in Settings/ })
        .getAttribute("href"),
    ).toBe("/brand/settings/integrations?tab=instagram");
  });

  it("preserves current content during degradation and communicates cooldown", () => {
    const fixture = instagramB4Fixture();
    renderWorkspace({
      data: {
        ...fixture,
        connection: {
          ...fixture.connection,
          state: "TRANSIENT_PROVIDER_FAILURE",
          reasonCodes: ["PROVIDER_TRANSIENT_FAILURE"],
        },
        sync: {
          ...fixture.sync,
          state: "BACKOFF",
          currentPreserved: true,
          reasonCodes: ["CURRENT_PRESERVED_AFTER_FAILURE"],
        },
      },
      cooldownEndsAt: "2099-09-12T09:15:00.000Z",
      announcement: "Refresh is cooling down.",
    });
    expect(screen.getByText(/Current intelligence is preserved/)).toBeTruthy();
    expect(screen.getByText("4,310")).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Refresh cooling down",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByText("Refresh is cooling down.")).toBeTruthy();
  });
});
