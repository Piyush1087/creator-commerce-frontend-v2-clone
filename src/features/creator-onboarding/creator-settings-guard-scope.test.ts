// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_ROUTES } from "../auth/constants";
import { AppRoutes } from "../../routes/app-routes";

const mocks = vi.hoisted(() => ({ session: vi.fn(), fetchState: vi.fn() }));

vi.mock("../../shared/auth/use-auth-session", () => ({
  useAuthSession: mocks.session,
}));
vi.mock("./api/creator-entry-client", () => ({
  fetchCreatorEntryState: mocks.fetchState,
}));
vi.mock("../../layouts/app-shell/AppShellLayout", () => ({
  AppShellLayout: () => createElement(Outlet),
}));
vi.mock("../../pages/auth/login-page", () => ({
  LoginPage: () => "Shared login",
}));
vi.mock("../../pages/creator/centre/creator-centre-page", () => ({
  CreatorCentrePage: () => "Creator Home",
}));
vi.mock("../../pages/creator/marketplace/creator-marketplace-page", () => ({
  CreatorMarketplacePage: () => "Creator Marketplace",
}));
vi.mock("../../pages/creator/payouts/creator-payouts-page", () => ({
  CreatorPayoutsPage: () => "Creator Payout Product",
}));
vi.mock("../../pages/creator/settings/creator-settings-layout", () => ({
  CreatorSettingsLayout: () => createElement(Outlet),
}));
vi.mock("../../pages/creator/settings/creator-settings-profile-page", () => ({
  CreatorSettingsProfilePage: () => "Creator Settings Profile",
}));
vi.mock("../../pages/creator/settings/creator-settings-social-page", () => ({
  CreatorSettingsSocialPage: () => "Creator Settings Social",
}));
vi.mock("../../pages/creator/settings/creator-settings-payouts-page", () => ({
  CreatorSettingsPayoutsPage: () => "Creator Settings Payouts",
}));
vi.mock("../../pages/brand/dashboard/brand-dashboard-page", () => ({
  BrandDashboardPage: () => "Brand Dashboard",
}));
vi.mock("../../routes/creator-onboarding-app", () => ({
  CreatorOnboardingAppRoutes: () => "Creator Entry recovery",
}));

const creatorSession = {
  accessToken: "access",
  accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
  currentUser: {
    id: "creator-1",
    email: "creator@example.test",
    name: "Creator",
    role: "CREATOR",
  },
  status: "AUTHENTICATED",
};

function renderPath(path: string) {
  render(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(AppRoutes),
    ),
  );
}

beforeEach(() => {
  mocks.fetchState.mockReset();
  mocks.session.mockReturnValue(creatorSession);
  mocks.fetchState.mockResolvedValue({
    accountContext: "CREATOR_READY",
    onboardingStatus: "INCOMPLETE",
    canEnterCreatorPlatform: false,
    nextAction: "RECONNECT_INSTAGRAM",
    instagram: {
      identityConnection: "DISCONNECTED",
      basicAuthorization: "UNAVAILABLE",
      insightsCapability: "UNKNOWN",
      authorizationHealth: "REAUTHORIZATION_REQUIRED",
    },
  });
});
afterEach(cleanup);

describe("Creator Settings guard-scope correction", () => {
  for (const [path, label] of [
    [AUTH_ROUTES.creatorHome, "home"],
    [AUTH_ROUTES.creatorMarketplace, "marketplace"],
    [AUTH_ROUTES.creatorPayouts, "payout product"],
  ] as const) {
    it(`redirects incomplete Creator ${label} access to Creator Entry`, async () => {
      renderPath(path);
      expect(await screen.findByText("Creator Entry recovery")).toBeTruthy();
      expect(mocks.fetchState).toHaveBeenCalled();
    });
  }

  for (const [path, text] of [
    [`${AUTH_ROUTES.creatorSettings}/profile`, "Creator Settings Profile"],
    [`${AUTH_ROUTES.creatorSettings}/social`, "Creator Settings Social"],
    [`${AUTH_ROUTES.creatorSettings}/payouts`, "Creator Settings Payouts"],
  ] as const) {
    it(`keeps incomplete Creator access to ${path}`, async () => {
      renderPath(path);
      expect(await screen.findByText(text)).toBeTruthy();
      expect(mocks.fetchState).not.toHaveBeenCalled();
    });
  }

  it("keeps Creator Settings behind shared authentication", async () => {
    mocks.session.mockReturnValue({
      accessToken: null,
      accessTokenExpiresAt: null,
      currentUser: null,
      status: "UNAUTHENTICATED",
    });
    renderPath(`${AUTH_ROUTES.creatorSettings}/social`);
    expect(await screen.findByText("Shared login")).toBeTruthy();
    expect(mocks.fetchState).not.toHaveBeenCalled();
  });

  it("leaves Brand route behavior outside Creator platform state", async () => {
    mocks.session.mockReturnValue({
      ...creatorSession,
      currentUser: { ...creatorSession.currentUser, role: "BRAND" },
    });
    renderPath(AUTH_ROUTES.brandDashboard);
    expect(await screen.findByText("Brand Dashboard")).toBeTruthy();
    expect(mocks.fetchState).not.toHaveBeenCalled();
  });
});
