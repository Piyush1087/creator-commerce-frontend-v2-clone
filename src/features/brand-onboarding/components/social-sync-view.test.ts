// @vitest-environment jsdom
import { createElement, StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  authSession: { accessToken: "brand-access-token" as string | null },
  openOAuth: vi.fn(),
  fetchGeneral: vi.fn(),
  fetchIntegrations: vi.fn(),
  getOAuthUrl: vi.fn(),
  connectInstagram: vi.fn(),
  startInvitedOAuth: vi.fn(),
  connectInvited: vi.fn(),
  skip: vi.fn(),
  invite: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mocks.navigate };
});
vi.mock("../../../shared/auth/use-auth-session", () => ({
  useAuthSession: () => mocks.authSession,
}));
vi.mock("../../../shared/oauth/instagram-oauth", () => ({
  openInstagramOAuth: mocks.openOAuth,
}));
vi.mock("../../settings/api/brand-settings-client", () => ({
  fetchBrandGeneralSettings: mocks.fetchGeneral,
}));
vi.mock("../../settings/api/instagram-integrations-client", async () => {
  const actual = await vi.importActual<
    typeof import("../../settings/api/instagram-integrations-client")
  >("../../settings/api/instagram-integrations-client");
  return {
    ...actual,
    fetchInstagramIntegrations: mocks.fetchIntegrations,
    getInstagramOAuthUrl: mocks.getOAuthUrl,
    connectInstagram: mocks.connectInstagram,
  };
});
vi.mock("../api/brand-social-sync-client", () => ({
  startInvitedInstagramOAuth: mocks.startInvitedOAuth,
  connectInvitedInstagram: mocks.connectInvited,
  skipBrandSocialSync: mocks.skip,
  inviteBrandSocialSyncTeammate: mocks.invite,
}));

import { SocialSyncView } from "./social-sync-view";
import { storeDelegatedInstagramInvitation } from "../utils/delegated-instagram-oauth-handoff";

const path = "/brand/onboarding/social-sync";
const state = "i".repeat(43);

function readModel(instagram: Record<string, unknown> | null = null) {
  return {
    layoutCase: instagram ? "FULL_INSTAGRAM" : "SKIPPED",
    scrapedHandle: null,
    igHandleProvenance: "LEGACY_UNKNOWN",
    socialSyncSkipped: false,
    integrations: instagram ? [instagram] : [],
    instagram,
    metaBusinessSuite: null,
    deletion: null,
  };
}

function connectedRow() {
  return {
    id: "integration",
    provider: "INSTAGRAM",
    status: "CONNECTED",
    currentPlatformHandle: "@existing",
    inboundOauthHandle: null,
    scopes: ["BASIC_PROFILE", "ENGAGEMENT_INSIGHTS"],
    tokenExpiresAt: null,
    tokenIssuedAt: null,
    tokenLastRefreshedAt: null,
    isActive: true,
    authorizationHealth: "CONNECTED_FULL",
    identityVerification: "VERIFIED",
    providerAccountId: "stable-provider-account",
    providerAppScopedUserId: null,
    currentProviderDisplayIdentity: "@existing",
    capabilities: {
      firstPartyProfile: "YES",
      firstPartyInsights: "YES",
      businessDiscovery: "DEFERRED",
      creatorMarketplaceDiscovery: "DEFERRED",
    },
    humanActionRequired: false,
    syncHealth: "NOT_CONFIGURED",
    authorizationGeneration: 2,
    allowedActions: {
      read: true,
      initialConnect: false,
      sameIdReconnect: true,
      controlledAccountChange: true,
      disconnect: true,
      deleteMyData: true,
      legacyIdentityReconciliation: false,
    },
  };
}

function mount(query = "", strict = false) {
  window.history.replaceState(
    { onboarding: "preserved" },
    "",
    `${path}${query}`,
  );
  return render(
    strict
      ? createElement(StrictMode, null, createElement(SocialSyncView))
      : createElement(SocialSyncView),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  window.localStorage.clear();
  mocks.authSession.accessToken = "brand-access-token";
  mocks.fetchGeneral.mockResolvedValue({ current_user_role: "BRAND_OWNER" });
  mocks.fetchIntegrations.mockResolvedValue(readModel());
  mocks.getOAuthUrl.mockResolvedValue({
    url: "https://instagram.example.test/oauth",
    state,
    finalizedHandle: null,
    intent: "INITIAL_CONNECT",
    expectedGeneration: 0,
  });
  mocks.connectInstagram.mockResolvedValue({
    conflict: false,
    connected: true,
    integrationId: "integration",
    handle: "@connected",
    status: "CONNECTED",
    authorizationHealth: "CONNECTED_FULL",
    scopes: ["BASIC_PROFILE", "ENGAGEMENT_INSIGHTS"],
    providerAccountId: "stable-provider-account",
  });
  mocks.startInvitedOAuth.mockImplementation(
    async (_invitationToken: string, redirectUri: string) => {
      const providerUrl = new URL("https://www.instagram.com/oauth/authorize");
      providerUrl.searchParams.set("client_id", "instagram-client");
      providerUrl.searchParams.set("redirect_uri", redirectUri);
      providerUrl.searchParams.set("response_type", "code");
      providerUrl.searchParams.set("response_mode", "query");
      providerUrl.searchParams.set("state", state);
      providerUrl.searchParams.set(
        "scope",
        "instagram_business_basic,instagram_business_manage_insights",
      );
      return { url: providerUrl.toString(), state };
    },
  );
  mocks.connectInvited.mockResolvedValue({
    connected: true,
    handle: "@delegated",
    status: "CONNECTED",
    scopes: ["BASIC_PROFILE"],
    brandProfileId: "brand-profile",
    inviteCompleted: true,
  });
  mocks.skip.mockResolvedValue(undefined);
  mocks.invite.mockResolvedValue(undefined);
  Object.defineProperty(window, "opener", { configurable: true, value: null });
  Object.defineProperty(window, "close", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.sessionStorage.clear();
  window.localStorage.clear();
  Object.defineProperty(window, "opener", { configurable: true, value: null });
  window.history.replaceState({}, "", path);
});

describe("Brand onboarding canonical Instagram OAuth", () => {
  it("uses explicit INITIAL_CONNECT for an authenticated Brand Owner", async () => {
    mount();
    await waitFor(() => expect(mocks.fetchGeneral).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole("button", { name: "Connect Instagram Profile" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Instagram" }),
    );
    await waitFor(() =>
      expect(mocks.getOAuthUrl).toHaveBeenCalledWith(
        `${window.location.origin}${path}`,
        "INITIAL_CONNECT",
      ),
    );
    expect(mocks.openOAuth).toHaveBeenCalledWith(
      "https://instagram.example.test/oauth",
    );
    expect(mocks.startInvitedOAuth).not.toHaveBeenCalled();
  });

  it("does not bypass initial-connect role authority", async () => {
    mocks.fetchGeneral.mockResolvedValue({
      current_user_role: "CAMPAIGN_MANAGER",
    });
    mount();
    expect(
      await screen.findByText(
        /Only the Brand Owner can make the initial Instagram connection/,
      ),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Connect Instagram Profile" }),
    ).toBeNull();
  });

  it.each([false, true])(
    "exchanges code plus state once and scrubs secrets (StrictMode=%s)",
    async (strict) => {
      mount(
        `?source=onboarding&code=synthetic-code&state=${state}#result`,
        strict,
      );
      expect(
        await screen.findByText(/Instagram connected as @connected/),
      ).toBeTruthy();
      expect(mocks.connectInstagram).toHaveBeenCalledTimes(1);
      expect(mocks.connectInstagram).toHaveBeenCalledWith({
        code: "synthetic-code",
        state,
        redirectUri: `${window.location.origin}${path}`,
      });
      expect(window.location.search).toBe("?source=onboarding");
      expect(window.location.hash).toBe("#result");
      expect(window.history.state).toEqual({ onboarding: "preserved" });
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    },
  );

  it("reports partial access without calling it a full Insights connection", async () => {
    mocks.connectInstagram.mockResolvedValue({
      conflict: false,
      connected: true,
      integrationId: "integration",
      handle: "@limited",
      status: "PARTIALLY_CONNECTED",
      authorizationHealth: "PARTIALLY_CONNECTED",
      scopes: ["BASIC_PROFILE"],
      providerAccountId: "stable-provider-account",
    });
    mount(`?code=synthetic-code&state=${state}`);
    expect(
      await screen.findByText(/Profile access is active; Insights are limited/),
    ).toBeTruthy();
    expect(screen.getByText(/Connected with limited access/)).toBeTruthy();
  });

  it("does not mislabel a permission-evidence failure as connected", async () => {
    mocks.connectInstagram.mockResolvedValue({
      conflict: false,
      connected: true,
      integrationId: "integration",
      handle: "@needs-review",
      status: "PARTIALLY_CONNECTED",
      authorizationHealth: "NEEDS_REVALIDATION",
      scopes: ["BASIC_PROFILE"],
      providerAccountId: "stable-provider-account",
    });
    mount(`?code=synthetic-code&state=${state}`);
    expect(
      await screen.findByText(
        /permission evidence needs revalidation in Settings/,
      ),
    ).toBeTruthy();
    expect(screen.getByText("Authorization status:")).toBeTruthy();
    expect(screen.queryByText(/Instagram connected as/)).toBeNull();
  });

  it.each([
    ["?code=synthetic-code", "Instagram authorization is incomplete"],
    [`?state=${state}`, "Instagram authorization is incomplete"],
    [
      "?error=access_denied&error_description=declined",
      "Instagram authorization was declined",
    ],
  ])("refuses an incomplete or denied callback: %s", async (query, copy) => {
    mount(query);
    expect(
      (await screen.findAllByText(new RegExp(copy))).length,
    ).toBeGreaterThan(0);
    expect(mocks.connectInstagram).not.toHaveBeenCalled();
    expect(mocks.connectInvited).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
  });

  it("posts only a non-secret same-origin popup result", async () => {
    const postMessage = vi.fn();
    Object.defineProperty(window, "opener", {
      configurable: true,
      value: { postMessage },
    });
    mount(`?code=synthetic-code&state=${state}`);
    await waitFor(() => expect(postMessage).toHaveBeenCalled());
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: "BRAND_INSTAGRAM_CONNECTED",
        handle: "@connected",
        authorizationHealth: "CONNECTED_FULL",
      },
      window.location.origin,
    );
    const serialized = JSON.stringify(postMessage.mock.calls[0][0]);
    expect(serialized).not.toContain("synthetic-code");
    expect(serialized).not.toContain(state);
  });

  it("captures and scrubs the invitation bearer before starting token-free delegated OAuth", async () => {
    mocks.authSession.accessToken = null;
    mount("?context=agent&token=invite-token");
    expect(window.location.search).toBe("?context=agent");
    expect(window.history.state).toEqual({ onboarding: "preserved" });
    expect(window.sessionStorage.length).toBe(0);
    fireEvent.click(
      screen.getByRole("button", { name: "Connect Instagram Profile" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Instagram" }),
    );
    await waitFor(() =>
      expect(mocks.startInvitedOAuth).toHaveBeenCalledWith(
        "invite-token",
        `${window.location.origin}${path}?context=agent`,
      ),
    );
    expect(mocks.getOAuthUrl).not.toHaveBeenCalled();
    expect(
      window.sessionStorage.getItem(
        `creator-shop:instagram-invite-oauth:${state}`,
      ),
    ).toBe("invite-token");
    expect(window.localStorage.length).toBe(0);

    const providerUrl = new URL(String(mocks.openOAuth.mock.calls[0][0]));
    expect(providerUrl.toString()).not.toContain("invite-token");
    expect(providerUrl.searchParams.get("redirect_uri")).toBe(
      `${window.location.origin}${path}?context=agent`,
    );
    expect(providerUrl.searchParams.get("state")).toBe(state);
    expect(providerUrl.searchParams.get("scope")).toBe(
      "instagram_business_basic,instagram_business_manage_insights",
    );
  });

  it("does not persist the invitation bearer when OAuth bootstrap fails", async () => {
    mocks.authSession.accessToken = null;
    mocks.startInvitedOAuth.mockRejectedValueOnce(
      new Error("Instagram OAuth bootstrap failed."),
    );
    mount("?context=agent&token=invite-token");
    fireEvent.click(
      screen.getByRole("button", { name: "Connect Instagram Profile" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Instagram" }),
    );

    expect(
      await screen.findByText(/Instagram OAuth bootstrap failed/),
    ).toBeTruthy();
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.length).toBe(0);
    expect(mocks.openOAuth).not.toHaveBeenCalled();
  });

  it("clears the opener's handoff copy after popup completion", async () => {
    mocks.authSession.accessToken = null;
    mount("?context=agent&token=invite-token");
    fireEvent.click(
      screen.getByRole("button", { name: "Connect Instagram Profile" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Instagram" }),
    );
    await waitFor(() =>
      expect(
        window.sessionStorage.getItem(
          `creator-shop:instagram-invite-oauth:${state}`,
        ),
      ).toBe("invite-token"),
    );

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: window.location.origin,
          data: {
            type: "BRAND_INSTAGRAM_CONNECTED",
            handle: "@delegated",
            authorizationHealth: "CONNECTED_FULL",
          },
        }),
      );
    });

    await waitFor(() => expect(window.sessionStorage.length).toBe(0));
  });

  it("recovers and removes the state-keyed bearer for a token-free delegated callback", async () => {
    mocks.authSession.accessToken = null;
    storeDelegatedInstagramInvitation(state, "invite-token");
    mocks.connectInvited.mockResolvedValue({
      connected: true,
      handle: "@delegated",
      status: "PARTIALLY_CONNECTED",
      scopes: ["BASIC_PROFILE"],
      brandProfileId: "brand-profile",
      inviteCompleted: true,
    });
    mount(`?context=agent&code=synthetic-code&state=${state}`, true);
    expect(await screen.findByText(/Insights are limited/)).toBeTruthy();
    expect(mocks.connectInvited).toHaveBeenCalledTimes(1);
    expect(mocks.connectInvited).toHaveBeenCalledWith({
      token: "invite-token",
      code: "synthetic-code",
      state,
      redirectUri: `${window.location.origin}${path}?context=agent`,
    });
    expect(mocks.connectInstagram).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?context=agent");
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.length).toBe(0);
  });

  it("removes the handoff before calling delegated connect", async () => {
    mocks.authSession.accessToken = null;
    storeDelegatedInstagramInvitation(state, "invite-token");
    mocks.connectInvited.mockImplementation(async () => {
      expect(
        window.sessionStorage.getItem(
          `creator-shop:instagram-invite-oauth:${state}`,
        ),
      ).toBeNull();
      return {
        connected: true,
        handle: "@delegated",
        status: "CONNECTED",
        scopes: ["BASIC_PROFILE"],
        brandProfileId: "brand-profile",
        inviteCompleted: true,
      };
    });

    mount(`?context=agent&code=provider-code&state=${state}`);

    expect(
      await screen.findByText(/Instagram connected as @delegated/),
    ).toBeTruthy();
  });

  it("fails closed when a delegated callback has no matching temporary bearer", async () => {
    mocks.authSession.accessToken = null;

    mount(
      `?context=agent&token=must-not-be-recovered&code=provider-code&state=${state}`,
    );

    expect(
      await screen.findByText(/We couldn't resume this Instagram connection/),
    ).toBeTruthy();
    expect(mocks.connectInvited).not.toHaveBeenCalled();
    expect(mocks.connectInstagram).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?context=agent");
  });

  it("does not resume one invitation with another OAuth state's handoff", async () => {
    mocks.authSession.accessToken = null;
    const stateA = "a".repeat(43);
    const stateB = "b".repeat(43);
    storeDelegatedInstagramInvitation(stateA, "invite-a");

    mount(`?context=agent&code=provider-code&state=${stateB}`);

    expect(
      await screen.findByText(/Return to your invitation link and try again/),
    ).toBeTruthy();
    expect(mocks.connectInvited).not.toHaveBeenCalled();
    expect(
      window.sessionStorage.getItem(
        `creator-shop:instagram-invite-oauth:${stateA}`,
      ),
    ).toBe("invite-a");
  });

  it("keeps onboarding optional through the canonical skip endpoint", async () => {
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Skip for now" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Proceed anyway" }));
    await waitFor(() => expect(mocks.skip).toHaveBeenCalledTimes(1));
    expect(mocks.navigate).toHaveBeenCalled();
  });

  it("loads an existing canonical connection without reclassifying it from a handle", async () => {
    mocks.fetchIntegrations.mockResolvedValue(readModel(connectedRow()));
    mount();
    expect(await screen.findByText(/Connected:/)).toBeTruthy();
    expect(screen.getByText("@existing")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Connect Instagram Profile" }),
    ).toBeNull();
  });
});
