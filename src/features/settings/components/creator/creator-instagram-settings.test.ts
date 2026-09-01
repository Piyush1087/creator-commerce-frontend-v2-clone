// @vitest-environment jsdom
import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { creatorInstagramSettingsFixture } from "../../mock/creator-instagram-settings.fixture";

const mocks = vi.hoisted(() => ({
  hook: vi.fn(),
  reload: vi.fn(),
  revalidate: vi.fn(),
  authorizeInitial: vi.fn(),
  authorizeReconnect: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("../../hooks/use-creator-instagram-settings", () => ({
  useCreatorInstagramSettings: mocks.hook,
}));

import { CreatorInstagramSettings } from "./creator-instagram-settings";

function hookResult(
  overrides: Partial<ReturnType<typeof baseHookResult>> = {},
) {
  return { ...baseHookResult(), ...overrides };
}

function baseHookResult() {
  return {
    data: creatorInstagramSettingsFixture(),
    loading: false,
    busy: false,
    error: null as string | null,
    message: null as string | null,
    reload: mocks.reload,
    revalidate: mocks.revalidate,
    authorizeInitial: mocks.authorizeInitial,
    authorizeReconnect: mocks.authorizeReconnect,
    disconnect: mocks.disconnect,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.hook.mockReturnValue(hookResult());
  mocks.revalidate.mockResolvedValue(undefined);
  mocks.disconnect.mockResolvedValue(undefined);
  mocks.authorizeInitial.mockResolvedValue({
    authorizationUrl: "https://www.instagram.com/oauth/authorize?state=initial",
  });
  mocks.authorizeReconnect.mockResolvedValue({
    authorizationUrl: "https://www.instagram.com/oauth/authorize?state=x",
    flow: "SAME_ID_RECONNECT",
  });
});

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("Creator Instagram Settings UI", () => {
  it("renders the canonical healthy state without other platforms or Marketplace", () => {
    render(createElement(CreatorInstagramSettings));
    expect(screen.getByText("Instagram connected")).toBeTruthy();
    expect(screen.getByText("Permanent account: creator_handle")).toBeTruthy();
    expect(screen.getAllByText("Available")).toHaveLength(2);
    expect(document.body.textContent).not.toMatch(
      /Marketplace|TikTok|YouTube|LinkedIn/,
    );
  });

  it("shows same-account recovery and the permanent identity policy", () => {
    mocks.hook.mockReturnValue(
      hookResult({
        data: creatorInstagramSettingsFixture({
          lifecycleState: "RECONNECT_REQUIRED",
          authorization: {
            ...creatorInstagramSettingsFixture().authorization,
            health: "REAUTHORIZATION_REQUIRED",
            basicCapability: "UNAVAILABLE",
          },
          allowedActions: {
            initialConnect: false,
            revalidate: true,
            sameIdReconnect: true,
            disconnect: true,
          },
        }),
      }),
    );
    render(createElement(CreatorInstagramSettings));
    expect(
      screen.getByRole("button", { name: "Reconnect same account" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /A reconnect must return the same permanent Instagram identity/,
      ),
    ).toBeTruthy();
  });

  it("projects NOT_CONNECTED to C01 initial connect and never offers reconnect", () => {
    mocks.hook.mockReturnValue(
      hookResult({
        data: creatorInstagramSettingsFixture({
          lifecycleState: "NOT_CONNECTED",
          identity: {
            retained: false,
            handle: null,
            displayTitle: null,
            avatarUrl: null,
          },
          authorization: {
            health: "NOT_CONNECTED",
            reasonCode: null,
            basicCapability: "NOT_CONNECTED",
            insightsCapability: "NOT_CONNECTED",
            tokenExpiresAt: null,
            lastValidatedAt: null,
            lastMetadataSyncAt: null,
          },
          allowedActions: {
            initialConnect: true,
            revalidate: false,
            sameIdReconnect: false,
            disconnect: false,
          },
        }),
      }),
    );
    render(createElement(CreatorInstagramSettings));
    expect(
      screen.getByRole("button", { name: "Connect Instagram" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Reconnect same account" }),
    ).toBeNull();
    expect(screen.getByText("No permanent Instagram identity")).toBeTruthy();
  });

  it("uses an accessible confirmation drawer before disconnecting", async () => {
    render(createElement(CreatorInstagramSettings));
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(
      screen.getByRole("dialog", { name: "Disconnect Instagram" }),
    ).toBeTruthy();
    expect(
      screen.getByText(/permanent provider identity.*remain/i),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirm disconnect" }));
    await waitFor(() => expect(mocks.disconnect).toHaveBeenCalledTimes(1));
  });

  it("surfaces truthful different-account manual-review recovery", () => {
    mocks.hook.mockReturnValue(
      hookResult({
        error:
          "A different Instagram account was selected. The permanent account remains unchanged; contact support for manual review.",
      }),
    );
    render(createElement(CreatorInstagramSettings));
    expect(screen.getByRole("alert").textContent).toMatch(
      /permanent account remains unchanged.*manual review/i,
    );
  });
});
