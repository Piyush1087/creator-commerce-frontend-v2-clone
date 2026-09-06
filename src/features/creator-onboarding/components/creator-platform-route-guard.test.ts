// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RequireCreatorPlatformAccess } from "./creator-platform-route-guard";

const mocks = vi.hoisted(() => ({ session: vi.fn(), fetchState: vi.fn() }));
vi.mock("../../../shared/auth/use-auth-session", () => ({
  useAuthSession: mocks.session,
}));
vi.mock("../api/creator-entry-client", () => ({
  fetchCreatorEntryState: mocks.fetchState,
}));

const snapshot = {
  accessToken: "access",
  accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
  currentUser: {
    id: "u1",
    email: "creator@example.test",
    name: "Creator",
    role: "CREATOR",
  },
  status: "AUTHENTICATED",
};
const state = {
  accountContext: "CREATOR_READY",
  onboardingStatus: "COMPLETE",
  canEnterCreatorPlatform: true,
  nextAction: "CREATOR_WORKSPACE_ENTRY",
  instagram: {
    identityConnection: "CONNECTED",
    basicAuthorization: "AVAILABLE",
    insightsCapability: "UNKNOWN",
    authorizationHealth: "USABLE",
  },
};

function renderGuard() {
  render(
    createElement(
      MemoryRouter,
      { initialEntries: ["/creator/home"] },
      createElement(
        Routes,
        null,
        createElement(
          Route,
          { element: createElement(RequireCreatorPlatformAccess) },
          createElement(Route, {
            path: "/creator/home",
            element: createElement("p", null, "Protected Creator product"),
          }),
        ),
        createElement(Route, {
          path: "/creator/onboarding",
          element: createElement("p", null, "Creator Entry recovery"),
        }),
      ),
    ),
  );
}

beforeEach(() => mocks.fetchState.mockReset());
afterEach(cleanup);

describe("Creator platform frontend guard", () => {
  it("renders a usable Creator route and ignores Insights as a separate gate", async () => {
    mocks.session.mockReturnValue(snapshot);
    mocks.fetchState.mockResolvedValue(state);
    renderGuard();
    expect(await screen.findByText("Protected Creator product")).toBeTruthy();
  });

  it("redirects an incomplete Creator to Creator Entry", async () => {
    mocks.session.mockReturnValue(snapshot);
    mocks.fetchState.mockResolvedValue({
      ...state,
      canEnterCreatorPlatform: false,
      nextAction: "RECONNECT_INSTAGRAM",
    });
    renderGuard();
    expect(await screen.findByText("Creator Entry recovery")).toBeTruthy();
  });

  it("does not admit a Brand user even if a malformed response says usable", async () => {
    mocks.session.mockReturnValue({
      ...snapshot,
      currentUser: { ...snapshot.currentUser, role: "BRAND" },
    });
    mocks.fetchState.mockResolvedValue(state);
    renderGuard();
    expect(await screen.findByText("Creator Entry recovery")).toBeTruthy();
  });
});
