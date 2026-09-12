// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_ROUTES } from "../auth/constants";
import { AppRoutes } from "../../routes/app-routes";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  fetchState: vi.fn(),
  actorState: vi.fn(),
}));

vi.mock("../../shared/auth/use-auth-session", () => ({
  useAuthSession: mocks.session,
}));
vi.mock("./api/creator-entry-client", () => ({
  fetchCreatorEntryState: mocks.fetchState,
}));
vi.mock("../../shared/creator/creator-workspace-actor-context-value", () => ({
  useCreatorWorkspaceActorState: mocks.actorState,
}));
vi.mock("../../layouts/app-shell/AppShellLayout", () => ({
  AppShellLayout: () => createElement(Outlet),
}));
vi.mock("../../pages/auth/login-page", () => ({
  LoginPage: () => "Shared login",
}));
vi.mock("../../pages/creator/centre/creator-home-page", () => ({
  CreatorHomePage: () => "C-02A Creator Home",
}));
vi.mock("../../pages/creator/centre/creator-centre-page", () => ({
  CreatorCentrePage: () => "Creator Centre product",
}));
vi.mock("../../pages/creator/marketplace/creator-marketplace-page", () => ({
  CreatorMarketplacePage: () => "Creator Marketplace",
}));
vi.mock("../../pages/creator/campaigns/c03-pages", () => ({
  OpportunitiesPage: () => "Creator Opportunities",
  ApplicationsPage: () => "Creator Applications",
  OpportunityPage: () => "Creator Opportunity",
  ApplicationPage: () => "Creator Application",
  PublicCampaignPage: () => "Public Campaign",
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
vi.mock("../../pages/creator/settings/creator-settings-account-page", () => ({
  CreatorSettingsAccountPage: () => "Creator Settings Account",
}));
vi.mock("../../pages/creator/settings/creator-settings-team-page", () => ({
  CreatorSettingsTeamPage: () => "Creator Settings Team",
}));
vi.mock("../../pages/creator/settings/creator-settings-instagram-page", () => ({
  CreatorSettingsInstagramPage: () => "Creator Settings Instagram",
}));
vi.mock("../../pages/creator/settings/creator-settings-payouts-page", () => ({
  CreatorSettingsPayoutsPage: () => "Creator Settings Payouts",
}));
vi.mock("../../pages/brand/dashboard/brand-dashboard-page", () => ({
  BrandDashboardPage: () => "Brand Dashboard",
}));
vi.mock("../../pages/brand/settings/brand-settings-layout", () => ({
  BrandSettingsLayout: () => createElement(Outlet),
}));
vi.mock("../../pages/brand/settings/brand-settings-general-page", () => ({
  BrandSettingsGeneralPage: () => "Shared Brand General Settings",
}));
vi.mock(
  "../../features/settings/components/creator/creator-team-invitation-acceptance",
  () => ({
    CreatorTeamInvitationAcceptance: () => "Creator Team admission",
  }),
);
vi.mock(
  "../../pages/creator/onboarding/creator-instagram-oauth-callback-route",
  () => ({
    CreatorInstagramOAuthCallbackRoute: () => "Creator callback facade",
  }),
);
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
  mocks.actorState.mockReset();
  mocks.session.mockReset();
  mocks.session.mockReturnValue(creatorSession);
  mocks.actorState.mockReturnValue({
    status: "READY",
    actorContext: {
      actorUserId: "creator-1",
      actorMembershipId: "membership-1",
      actorRole: "OWNER",
      workspaceId: "workspace-1",
      organizationId: "organization-1",
      subjectCreatorProfileId: "creator-profile-1",
      subjectOwnerUserId: "creator-1",
      allowedActions: [
        "CAMPAIGN_OPPORTUNITY_VIEW",
        "WORKSPACE_PROFILE_READ",
        "TEAM_READ",
        "INSTAGRAM_SETTINGS_READ",
        "PAYOUT_SETTINGS_READ",
      ],
    },
  });
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
  it.each([AUTH_ROUTES.creatorMarketplace, AUTH_ROUTES.creatorOpportunities])(
    "keeps C03 opportunity route %s outside the Instagram guard",
    async (path) => {
      renderPath(path);
      expect(await screen.findByText("Creator Opportunities")).toBeTruthy();
      expect(mocks.fetchState).not.toHaveBeenCalled();
    },
  );
  it.each([
    AUTH_ROUTES.creatorCampaignsHistory,
    AUTH_ROUTES.creatorApplications,
  ])("preserves C03 history route %s without Instagram", async (path) => {
    renderPath(path);
    expect(await screen.findByText("Creator Applications")).toBeTruthy();
    expect(mocks.fetchState).not.toHaveBeenCalled();
  });
  for (const [path, label] of [
    [AUTH_ROUTES.creatorHome, "home"],
    [AUTH_ROUTES.creatorPayouts, "payout product"],
  ] as const) {
    it(`redirects incomplete Creator ${label} access to Creator Entry`, async () => {
      renderPath(path);
      expect(await screen.findByText("Creator Entry recovery")).toBeTruthy();
      expect(mocks.fetchState).toHaveBeenCalled();
    });
  }

  for (const [path, text] of [
    [`${AUTH_ROUTES.creatorSettings}/account`, "Creator Settings Account"],
    [`${AUTH_ROUTES.creatorSettings}/profile`, "Creator Settings Profile"],
    [`${AUTH_ROUTES.creatorSettings}/team`, "Creator Settings Team"],
    [`${AUTH_ROUTES.creatorSettings}/instagram`, "Creator Settings Instagram"],
    [`${AUTH_ROUTES.creatorSettings}/social`, "Creator Settings Instagram"],
    [`${AUTH_ROUTES.creatorSettings}/payouts`, "Creator Settings Payouts"],
  ] as const) {
    it(`keeps incomplete Creator access to ${path}`, async () => {
      renderPath(path);
      expect(await screen.findByText(text)).toBeTruthy();
      expect(mocks.fetchState).not.toHaveBeenCalled();
    });
  }

  it("fails a direct privileged Settings outlet closed while actor authority loads", async () => {
    mocks.actorState.mockReturnValue({ status: "LOADING", actorContext: null });
    renderPath(`${AUTH_ROUTES.creatorSettings}/team`);
    expect(
      await screen.findByText("Verifying Creator workspace access…"),
    ).toBeTruthy();
    expect(screen.queryByText("Creator Settings Team")).toBeNull();
  });

  it("redirects a role without the requested action to recoverable Account settings", async () => {
    mocks.actorState.mockReturnValue({
      status: "READY",
      actorContext: {
        actorUserId: "creator-1",
        actorMembershipId: "membership-1",
        actorRole: "ASSISTANT",
        workspaceId: "workspace-1",
        organizationId: "organization-1",
        subjectCreatorProfileId: "creator-profile-1",
        subjectOwnerUserId: "owner-1",
        allowedActions: [],
      },
    });
    renderPath(`${AUTH_ROUTES.creatorSettings}/payouts`);
    expect(await screen.findByText("Creator Settings Account")).toBeTruthy();
    expect(screen.queryByText("Creator Settings Payouts")).toBeNull();
  });

  it("uses Account as the canonical Settings index", async () => {
    renderPath(AUTH_ROUTES.creatorSettings);
    expect(await screen.findByText("Creator Settings Account")).toBeTruthy();
  });

  it("redirects Creator Center to C-02A Home, not Centre product", async () => {
    mocks.fetchState.mockResolvedValue({
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
    });
    renderPath(AUTH_ROUTES.creatorCentre);
    expect(await screen.findByText("C-02A Creator Home")).toBeTruthy();
    expect(screen.queryByText("Creator Centre product")).toBeNull();
    expect(screen.queryByText("Creator Media Kit")).toBeNull();
    expect(screen.queryByText("Creator Home is deferred")).toBeNull();
  });

  it("mounts the Team-admission and OAuth callback compatibility routes", async () => {
    renderPath(AUTH_ROUTES.creatorTeamInvitationAccept);
    expect(await screen.findByText("Creator Team admission")).toBeTruthy();
    cleanup();
    renderPath("/creator-marketplace/callback?code=x&state=y");
    expect(await screen.findByText("Creator callback facade")).toBeTruthy();
  });

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

  it("preserves the shared Brand Settings route independently", async () => {
    mocks.session.mockReturnValue({
      ...creatorSession,
      currentUser: { ...creatorSession.currentUser, role: "BRAND" },
    });
    renderPath(AUTH_ROUTES.brandSettings);
    expect(
      await screen.findByText("Shared Brand General Settings"),
    ).toBeTruthy();
    expect(mocks.actorState).not.toHaveBeenCalled();
  });
});
