// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveCreatorInstagramFlowMode } from "../../../creator-onboarding/utils/creator-entry-oauth-session";
import { saveCreatorInstagramSettingsFlow } from "../../utils/creator-instagram-settings-oauth-session";
import { ApiRequestError } from "../../../../shared/api/parse-api-error";
import { CreatorInstagramSettingsOAuthCallback } from "./creator-instagram-settings-oauth-callback";

const mocks = vi.hoisted(() => ({
  completeInitial: vi.fn(),
  completeReconnect: vi.fn(),
}));

vi.mock("../../../creator-onboarding/api/creator-entry-client", () => ({
  completeCreatorInstagram: mocks.completeInitial,
}));
vi.mock(
  "../../api/creator-instagram-settings-client",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("../../api/creator-instagram-settings-client")
    >()),
    completeCreatorInstagramSettingsReconnect: mocks.completeReconnect,
  }),
);

function renderCallback() {
  render(
    createElement(
      MemoryRouter,
      {
        initialEntries: [
          "/creator-marketplace/callback?code=provider-code&state=server-state",
        ],
      },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/creator-marketplace/callback",
          element: createElement(CreatorInstagramSettingsOAuthCallback),
        }),
        createElement(Route, {
          path: "/creator/settings/instagram",
          element: createElement("p", null, "Instagram Settings destination"),
        }),
      ),
    ),
  );
}

beforeEach(() => {
  mocks.completeInitial.mockReset();
  mocks.completeReconnect.mockReset();
  window.sessionStorage.clear();
  window.history.replaceState(
    null,
    "",
    "/creator-marketplace/callback?code=provider-code&state=server-state",
  );
});

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("Creator Instagram Settings OAuth callback", () => {
  it("uses C-01 completion for a Settings initial-connect marker", async () => {
    saveCreatorInstagramSettingsFlow("INITIAL_CONNECT");
    saveCreatorInstagramFlowMode("INITIAL_CONNECT");
    mocks.completeInitial.mockResolvedValue({});

    renderCallback();

    expect(
      await screen.findByText("Instagram Settings destination"),
    ).toBeTruthy();
    expect(mocks.completeInitial).toHaveBeenCalledWith({
      code: "provider-code",
      state: "server-state",
    });
    expect(mocks.completeReconnect).not.toHaveBeenCalled();
    expect(window.sessionStorage.length).toBe(0);
  });

  it("uses the same-ID Settings completion for a reconnect marker", async () => {
    saveCreatorInstagramSettingsFlow("SAME_ID_RECONNECT");
    mocks.completeReconnect.mockResolvedValue({});

    renderCallback();

    expect(
      await screen.findByText("Instagram Settings destination"),
    ).toBeTruthy();
    expect(mocks.completeReconnect).toHaveBeenCalledWith({
      code: "provider-code",
      state: "server-state",
    });
    expect(mocks.completeInitial).not.toHaveBeenCalled();
  });

  it("fails closed when the tab-scoped Settings marker is absent", async () => {
    renderCallback();

    expect(
      await screen.findByText(/Settings reconnect is incomplete/i),
    ).toBeTruthy();
    expect(mocks.completeInitial).not.toHaveBeenCalled();
    expect(mocks.completeReconnect).not.toHaveBeenCalled();
  });

  it("maps the C-01 provider denial to the shared safe Settings message", async () => {
    saveCreatorInstagramSettingsFlow("INITIAL_CONNECT");
    saveCreatorInstagramFlowMode("INITIAL_CONNECT");
    mocks.completeInitial.mockRejectedValue(
      new ApiRequestError({
        message: "Provider-specific denial detail",
        status: 400,
        code: "INSTAGRAM_AUTHORIZATION_DENIED",
      }),
    );

    renderCallback();

    expect(
      await screen.findByText(
        "Instagram authorization was cancelled. Nothing changed.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Provider-specific denial detail")).toBeNull();
  });
});
