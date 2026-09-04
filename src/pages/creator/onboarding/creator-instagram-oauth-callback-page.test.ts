// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveCreatorInstagramFlowMode } from "../../../features/creator-onboarding/utils/creator-entry-oauth-session";
import { ApiRequestError } from "../../../shared/api/parse-api-error";
import { CreatorInstagramOAuthCallbackPage } from "./creator-instagram-oauth-callback-page";

const mocks = vi.hoisted(() => ({ initial: vi.fn(), reconnect: vi.fn() }));
vi.mock(
  "../../../features/creator-onboarding/api/creator-entry-client",
  () => ({
    completeCreatorInstagram: mocks.initial,
    completeCreatorInstagramReconnect: mocks.reconnect,
  }),
);

function renderCallback() {
  render(
    createElement(
      BrowserRouter,
      null,
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/creator-marketplace/callback",
          element: createElement(CreatorInstagramOAuthCallbackPage),
        }),
        createElement(Route, {
          path: "/creator/onboarding",
          element: createElement("p", null, "Creator Entry state refresh"),
        }),
      ),
    ),
  );
}

beforeEach(() => {
  sessionStorage.clear();
  mocks.initial.mockReset();
  mocks.reconnect.mockReset();
});
afterEach(cleanup);

describe("Creator Instagram callback", () => {
  it("captures code+state, immediately scrubs the query, and completes initial connection", async () => {
    saveCreatorInstagramFlowMode("INITIAL_CONNECT");
    window.history.replaceState(
      null,
      "",
      "/creator-marketplace/callback?code=provider-code&state=server-state",
    );
    mocks.initial.mockResolvedValue({ connected: true, state: {} });
    renderCallback();
    expect(window.location.search).toBe("");
    await waitFor(() =>
      expect(mocks.initial).toHaveBeenCalledWith({
        state: "server-state",
        code: "provider-code",
      }),
    );
    expect(await screen.findByText("Creator Entry state refresh")).toBeTruthy();
    expect(mocks.reconnect).not.toHaveBeenCalled();
  });

  it("selects reconnect completion only from the non-authoritative flow hint", async () => {
    saveCreatorInstagramFlowMode("RECONNECT");
    window.history.replaceState(
      null,
      "",
      "/creator-marketplace/callback?code=reconnect-code&state=server-state",
    );
    mocks.reconnect.mockResolvedValue({ connected: true, state: {} });
    renderCallback();
    await waitFor(() =>
      expect(mocks.reconnect).toHaveBeenCalledWith({
        state: "server-state",
        code: "reconnect-code",
      }),
    );
    expect(mocks.initial).not.toHaveBeenCalled();
  });

  it("submits provider denial for backend validation and renders a distinct denial state", async () => {
    saveCreatorInstagramFlowMode("INITIAL_CONNECT");
    window.history.replaceState(
      null,
      "",
      "/creator-marketplace/callback?error=access_denied&error_description=Creator%20declined&state=server-state",
    );
    mocks.initial.mockRejectedValue(
      new ApiRequestError({
        message: "Denied",
        status: 400,
        code: "INSTAGRAM_AUTHORIZATION_DENIED",
      }),
    );
    renderCallback();
    await waitFor(() =>
      expect(mocks.initial).toHaveBeenCalledWith({
        state: "server-state",
        error: "access_denied",
        errorDescription: "Creator declined",
      }),
    );
    expect(await screen.findByText(/Nothing was connected/i)).toBeTruthy();
    expect(window.location.search).toBe("");
  });
});
