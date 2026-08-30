// @vitest-environment jsdom
import { createElement, StrictMode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BrandSettingsRole } from "../../contracts/brand-settings.contracts";
import type {
  InstagramIntegrationRow,
  InstagramIntegrationsReadModel,
} from "../../contracts/instagram-integrations.contracts";

const mocks = vi.hoisted(() => ({
  fetchIntegrations: vi.fn(),
  getOAuthUrl: vi.fn(),
  connect: vi.fn(),
  cancelAccountChange: vi.fn(),
  disconnect: vi.fn(),
  deleteData: vi.fn(),
  fetchGeneral: vi.fn(),
}));

vi.mock("../../api/instagram-integrations-client", async () => {
  const actual = await vi.importActual<
    typeof import("../../api/instagram-integrations-client")
  >("../../api/instagram-integrations-client");
  return {
    ...actual,
    fetchInstagramIntegrations: mocks.fetchIntegrations,
    getInstagramOAuthUrl: mocks.getOAuthUrl,
    connectInstagram: mocks.connect,
    cancelPendingInstagramAccountChange: mocks.cancelAccountChange,
    disconnectInstagram: mocks.disconnect,
    deleteInstagramConnectionData: mocks.deleteData,
  };
});

vi.mock("../../api/brand-settings-client", () => ({
  fetchBrandGeneralSettings: mocks.fetchGeneral,
}));

import { InstagramIntegrationsApiError } from "../../api/instagram-integrations-client";
import { BrandIntegrationsSettings } from "./brand-integrations-settings";

const root = "/brand/settings/integrations";
const oauthState = "s".repeat(43);

const ownerActions = {
  read: true,
  initialConnect: false,
  sameIdReconnect: true,
  controlledAccountChange: true,
  disconnect: true,
  deleteMyData: true,
  legacyIdentityReconciliation: true,
};
const campaignActions = {
  ...ownerActions,
  controlledAccountChange: false,
  disconnect: false,
  deleteMyData: false,
  legacyIdentityReconciliation: false,
};
const financeActions = { ...campaignActions, sameIdReconnect: false };

function integration(
  overrides: Partial<InstagramIntegrationRow> = {},
): InstagramIntegrationRow {
  return {
    id: "instagram-integration",
    provider: "INSTAGRAM",
    status: "CONNECTED",
    currentPlatformHandle: "@brand",
    inboundOauthHandle: null,
    scopes: ["BASIC_PROFILE", "ENGAGEMENT_INSIGHTS"],
    tokenExpiresAt: "2030-01-01T00:00:00.000Z",
    tokenIssuedAt: "2029-01-01T00:00:00.000Z",
    tokenLastRefreshedAt: "2029-06-01T00:00:00.000Z",
    isActive: true,
    authorizationHealth: "CONNECTED_FULL",
    identityVerification: "VERIFIED",
    providerAccountId: "stable-provider-account",
    providerAppScopedUserId: "app-scoped-user",
    currentProviderDisplayIdentity: "@brand",
    capabilities: {
      firstPartyProfile: "YES",
      firstPartyInsights: "YES",
      businessDiscovery: "DEFERRED",
      creatorMarketplaceDiscovery: "DEFERRED",
    },
    humanActionRequired: false,
    syncHealth: "NOT_CONFIGURED",
    authorizationGeneration: 4,
    allowedActions: ownerActions,
    ...overrides,
  };
}

function model(
  row: InstagramIntegrationRow | null = integration(),
  overrides: Partial<InstagramIntegrationsReadModel> = {},
): InstagramIntegrationsReadModel {
  return {
    layoutCase: row ? "FULL_INSTAGRAM" : "SKIPPED",
    scrapedHandle: "@website-brand",
    igHandleProvenance: "WEBSITE_DERIVED",
    socialSyncSkipped: false,
    integrations: row ? [row] : [],
    instagram: row,
    metaBusinessSuite: null,
    deletion: null,
    ...overrides,
  };
}

function setRole(role: BrandSettingsRole) {
  mocks.fetchGeneral.mockResolvedValue({ current_user_role: role });
}

function mount(query = "", strict = false) {
  window.history.replaceState({ router: "preserved" }, "", `${root}${query}`);
  return render(
    strict
      ? createElement(
          StrictMode,
          null,
          createElement(BrandIntegrationsSettings),
        )
      : createElement(BrandIntegrationsSettings),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setRole("BRAND_OWNER");
  mocks.fetchIntegrations.mockResolvedValue(model());
  mocks.getOAuthUrl.mockResolvedValue({
    url: `${window.location.origin}${root}#oauth`,
    state: oauthState,
    finalizedHandle: "@brand",
    intent: "RECONNECT",
    expectedGeneration: 4,
  });
  mocks.connect.mockResolvedValue({
    conflict: false,
    connected: true,
    integrationId: "instagram-integration",
    handle: "@brand",
    status: "CONNECTED",
    authorizationHealth: "CONNECTED_FULL",
    scopes: ["BASIC_PROFILE", "ENGAGEMENT_INSIGHTS"],
    providerAccountId: "stable-provider-account",
  });
  mocks.cancelAccountChange.mockResolvedValue(undefined);
  mocks.disconnect.mockResolvedValue(undefined);
  mocks.deleteData.mockResolvedValue({
    requestId: "delete-request",
    confirmationCode: "secret-confirmation-code",
    state: "COMPLETED",
    requestedAt: "2029-07-01T00:00:00.000Z",
    completedAt: "2029-07-01T00:00:01.000Z",
    result: { deleted: [], sanitized: [], retained: [] },
    policyVersion: "BS06_P1_V1",
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", root);
});

describe("BS-06 role and authorization-health presentation", () => {
  it.each([
    ["BRAND_OWNER", true],
    ["CAMPAIGN_MANAGER", false],
    ["FINANCE_ADMIN", false],
  ] as const)(
    "no-integration initial connect for %s is %s",
    async (role, visible) => {
      setRole(role);
      mocks.fetchIntegrations.mockResolvedValue(
        model(null, { scrapedHandle: null }),
      );
      mount();
      await screen.findByText("No Instagram connection");
      expect(
        Boolean(screen.queryByRole("button", { name: "Connect Instagram" })),
      ).toBe(visible);
      if (!visible) {
        expect(
          screen.getByText(
            /Only a Brand Owner can create the first Instagram connection/,
          ),
        ).toBeTruthy();
      }
    },
  );

  it.each([
    ["CONNECTED_FULL", "Instagram connected", "Connected", null],
    [
      "PARTIALLY_CONNECTED",
      "Instagram connected with limited access",
      "Connected with limited access",
      "Reconnect same account",
    ],
    [
      "NEEDS_REVALIDATION",
      "Instagram authorization needs revalidation",
      "Reconnect required",
      "Reconnect same account",
    ],
    [
      "PROVIDER_ACCESS_BLOCKED",
      "Instagram access temporarily unavailable",
      "Temporarily unavailable",
      "Reload status",
    ],
    [
      "UNKNOWN",
      "Connection status uncertain",
      "Status uncertain",
      "Reload status",
    ],
    [
      "DISCONNECTED",
      "Instagram disconnected",
      "Disconnected",
      "Reconnect same account",
    ],
  ] as const)(
    "renders canonical %s without legacy-state guessing",
    async (health, heading, badge, action) => {
      mocks.fetchIntegrations.mockResolvedValue(
        model(
          integration({
            authorizationHealth: health,
            status:
              health === "DISCONNECTED" ? "DISCONNECTED" : "TOKEN_EXPIRED",
            humanActionRequired: health === "NEEDS_REVALIDATION",
            capabilities: {
              firstPartyProfile: health === "DISCONNECTED" ? "NO" : "YES",
              firstPartyInsights: health === "CONNECTED_FULL" ? "YES" : "NO",
              businessDiscovery: "UNKNOWN",
              creatorMarketplaceDiscovery: "DEFERRED",
            },
          }),
        ),
      );
      mount();
      expect(await screen.findByText(heading)).toBeTruthy();
      expect(screen.getAllByText(badge).length).toBeGreaterThan(0);
      if (action)
        expect(screen.getByRole("button", { name: action })).toBeTruthy();
      expect(screen.getByText("Profile access")).toBeTruthy();
      expect(screen.getByText("Insights")).toBeTruthy();
    },
  );

  it("does not make reconnect the recovery for provider blocking", async () => {
    mocks.fetchIntegrations.mockResolvedValue(
      model(
        integration({
          authorizationHealth: "PROVIDER_ACCESS_BLOCKED",
          humanActionRequired: false,
        }),
      ),
    );
    mount();
    expect(
      await screen.findByText("Instagram access temporarily unavailable"),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Reconnect/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Reload status" })).toBeTruthy();
  });

  it("keeps UNKNOWN distinct from connected and disconnected", async () => {
    mocks.fetchIntegrations.mockResolvedValue(
      model(integration({ authorizationHealth: "UNKNOWN" })),
    );
    mount();
    expect(await screen.findByText("Connection status uncertain")).toBeTruthy();
    expect(screen.queryByText("Instagram connected")).toBeNull();
    expect(screen.queryByText("Instagram disconnected")).toBeNull();
  });

  it.each([
    ["BRAND_OWNER", ownerActions, true, true, true],
    ["CAMPAIGN_MANAGER", campaignActions, true, false, false],
    ["FINANCE_ADMIN", financeActions, false, false, false],
  ] as const)(
    "uses backend allowedActions for existing integration as %s",
    async (role, actions, reconnect, disconnect, deleteData) => {
      setRole(role);
      mocks.fetchIntegrations.mockResolvedValue(
        model(integration({ allowedActions: actions })),
      );
      mount();
      fireEvent.click(
        await screen.findByRole("button", {
          name: role === "FINANCE_ADMIN" ? "View connection" : "Manage connection",
        }),
      );
      expect(
        Boolean(
          screen.queryByRole("button", {
            name: "Reconnect same Instagram account",
          }),
        ),
      ).toBe(reconnect);
      expect(
        Boolean(screen.queryByRole("button", { name: "Disconnect Instagram" })),
      ).toBe(disconnect);
      expect(
        Boolean(
          screen.queryByRole("button", {
            name: "Delete Instagram connection data",
          }),
        ),
      ).toBe(deleteData);
      if (role === "FINANCE_ADMIN")
        expect(screen.getByText("Read-only access")).toBeTruthy();
    },
  );
});

describe("BS-06 stable identity, account change, and capabilities", () => {
  it("accepts a changed username for the same stable provider identity", async () => {
    let current = model(integration());
    mocks.fetchIntegrations.mockImplementation(async () => current);
    mocks.connect.mockImplementation(async () => {
      current = model(
        integration({
          currentPlatformHandle: "@renamed-brand",
          currentProviderDisplayIdentity: "@renamed-brand",
        }),
      );
      return {
        conflict: false,
        connected: true,
        integrationId: "instagram-integration",
        handle: "@renamed-brand",
        status: "CONNECTED" as const,
        authorizationHealth: "CONNECTED_FULL" as const,
        scopes: ["BASIC_PROFILE" as const],
        providerAccountId: "stable-provider-account",
      };
    });
    mount(`?code=synthetic-code&state=${oauthState}`);
    expect(
      await screen.findByText("Authenticated account: @renamed-brand"),
    ).toBeTruthy();
    expect(
      screen.queryByText(/Different Instagram account selected/),
    ).toBeNull();
  });

  it.each([
    ["BRAND_OWNER", ownerActions, true, true],
    ["CAMPAIGN_MANAGER", campaignActions, false, true],
    ["FINANCE_ADMIN", financeActions, false, false],
  ] as const)(
    "restores staged account-change authority after reload for %s",
    async (role, actions, authorize, cancel) => {
      setRole(role);
      mocks.fetchIntegrations.mockResolvedValue(
        model(
          integration({
            inboundOauthHandle: "@different-account",
            allowedActions: actions,
          }),
        ),
      );
      mount();
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Review pending account change",
        }),
      );
      expect(
        await screen.findByRole("dialog", {
          name: "Different Instagram account selected",
        }),
      ).toBeTruthy();
      expect(
        Boolean(
          screen.queryByRole("button", { name: "Authorize account change" }),
        ),
      ).toBe(authorize);
      expect(
        Boolean(
          screen.queryByRole("button", {
            name: "Cancel pending account change",
          }),
        ),
      ).toBe(cancel);
      expect(screen.queryByText(/Overwrite/)).toBeNull();
      if (!authorize)
        expect(
          screen.getByText("Brand Owner authorization required"),
        ).toBeTruthy();
    },
  );

  it("starts fresh ACCOUNT_CHANGE OAuth for an Owner conflict and never overwrites", async () => {
    mocks.fetchIntegrations.mockResolvedValue(
      model(integration({ inboundOauthHandle: "@different-account" })),
    );
    mount();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Review pending account change",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Authorize account change" }),
    );
    await waitFor(() =>
      expect(mocks.getOAuthUrl).toHaveBeenCalledWith(
        `${window.location.origin}${root}`,
        "ACCOUNT_CHANGE",
      ),
    );
    expect(mocks.cancelAccountChange).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain("OVERWRITE_HANDLE");
  });

  it("cancels only the pending account change and preserves the active account", async () => {
    const staged = model(
      integration({ inboundOauthHandle: "@different-account" }),
    );
    const clean = model(integration({ inboundOauthHandle: null }));
    mocks.fetchIntegrations
      .mockResolvedValueOnce(staged)
      .mockResolvedValue(clean);
    mount();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Review pending account change",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel pending account change" }),
    );
    await waitFor(() =>
      expect(mocks.cancelAccountChange).toHaveBeenCalledWith({
        integrationId: "instagram-integration",
        currentPlatformHandle: "@brand",
        inboundOauthHandle: "@different-account",
      }),
    );
    expect(
      await screen.findByText(/current connection was preserved/i),
    ).toBeTruthy();
    expect(screen.getByText("Authenticated account: @brand")).toBeTruthy();
  });

  it.each([
    ["BRAND_OWNER", true],
    ["CAMPAIGN_MANAGER", false],
    ["FINANCE_ADMIN", false],
  ] as const)(
    "gates legacy identity reconciliation for %s",
    async (role, visible) => {
      setRole(role);
      const actions =
        role === "BRAND_OWNER"
          ? ownerActions
          : role === "CAMPAIGN_MANAGER"
            ? campaignActions
            : financeActions;
      mocks.fetchIntegrations.mockResolvedValue(
        model(
          integration({
            providerAccountId: null,
            identityVerification: "UNVERIFIED",
            allowedActions: actions,
          }),
        ),
      );
      mount();
      await screen.findByRole("button", {
        name: role === "BRAND_OWNER" ? "Manage connection" : "View connection",
      });
      expect(
        Boolean(
          screen.queryByRole("button", { name: "Reconcile legacy identity" }),
        ),
      ).toBe(visible);
    },
  );

  it.each([
    ["YES", "Available"],
    ["NO", "Unavailable"],
    ["UNKNOWN", "Status unknown"],
  ] as const)(
    "keeps first-party capability %s explicit",
    async (capability, label) => {
      mocks.fetchIntegrations.mockResolvedValue(
        model(
          integration({
            capabilities: {
              firstPartyProfile: capability,
              firstPartyInsights: capability,
              businessDiscovery: "UNKNOWN",
              creatorMarketplaceDiscovery: "DEFERRED",
            },
          }),
        ),
      );
      mount();
      expect((await screen.findAllByText(label)).length).toBeGreaterThanOrEqual(
        2,
      );
      expect(screen.getByText("Separate provider capabilities")).toBeTruthy();
      expect(
        screen.queryByRole("button", {
          name: /Business Discovery|Creator Marketplace/,
        }),
      ).toBeNull();
      expect(screen.queryByText(/Meta Business Suite/)).toBeNull();
    },
  );

  it("shows website provenance only when no stable direct identity exists", async () => {
    mocks.fetchIntegrations.mockResolvedValue(model(null));
    mount();
    expect(
      await screen.findByText("Website-detected Instagram handle"),
    ).toBeTruthy();
    expect(
      screen.getByText(/not an authenticated Instagram account/),
    ).toBeTruthy();
  });
});

describe("BS-06 callbacks, disconnect, and deletion", () => {
  it.each([false, true])(
    "exchanges code and state once and scrubs only secrets (StrictMode=%s)",
    async (strict) => {
      mount(
        `?tab=instagram&code=synthetic-code&state=${oauthState}#capabilities`,
        strict,
      );
      expect(await screen.findByText("Instagram connected.")).toBeTruthy();
      expect(mocks.connect).toHaveBeenCalledTimes(1);
      expect(mocks.connect).toHaveBeenCalledWith({
        code: "synthetic-code",
        state: oauthState,
        redirectUri: `${window.location.origin}${root}`,
      });
      expect(window.location.search).toBe("?tab=instagram");
      expect(window.location.hash).toBe("#capabilities");
      expect(window.history.state).toEqual({ router: "preserved" });
    },
  );

  it.each([
    [
      "?code=synthetic-code",
      "Instagram authorization is incomplete. Start a fresh authorization.",
    ],
    [
      `?state=${oauthState}`,
      "Instagram authorization is incomplete. Start a fresh authorization.",
    ],
    [
      "?error=access_denied&error_description=declined",
      "Instagram authorization was declined. Start a new attempt when ready.",
    ],
  ])(
    "refuses an incomplete or denied callback: %s",
    async (query, expected) => {
      mount(query);
      expect(await screen.findByText(expected)).toBeTruthy();
      expect(mocks.connect).not.toHaveBeenCalled();
      expect(window.location.search).toBe("");
    },
  );

  it("turns stale generation into a fresh-authorization message and canonical reload", async () => {
    mocks.connect.mockRejectedValue(
      new InstagramIntegrationsApiError(
        "stale",
        409,
        "STALE_INSTAGRAM_AUTHORIZATION_GENERATION",
      ),
    );
    mount(`?code=synthetic-code&state=${oauthState}`);
    expect(
      await screen.findByText(
        "Connection state changed. Start a fresh authorization.",
      ),
    ).toBeTruthy();
    await waitFor(() =>
      expect(mocks.fetchIntegrations.mock.calls.length).toBeGreaterThanOrEqual(
        2,
      ),
    );
    expect(mocks.connect).toHaveBeenCalledTimes(1);
  });

  it("turns PERSONAL_ACCOUNT into Professional-account guidance", async () => {
    mocks.connect.mockRejectedValue(
      new InstagramIntegrationsApiError(
        "raw provider payload",
        400,
        "PERSONAL_ACCOUNT",
      ),
    );
    mount(`?code=synthetic-code&state=${oauthState}`);
    expect(
      await screen.findByText(
        "A Professional Instagram Business or Creator account is required.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("raw provider payload")).toBeNull();
  });

  it("requires confirmation before Owner disconnect and retains business-history copy", async () => {
    let current = model();
    mocks.fetchIntegrations.mockImplementation(async () => current);
    mocks.disconnect.mockImplementation(async () => {
      current = model(
        integration({
          status: "DISCONNECTED",
          authorizationHealth: "DISCONNECTED",
          isActive: false,
          scopes: [],
        }),
      );
    });
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Manage connection" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Disconnect Instagram" }),
    );
    expect(screen.getByText(/stops future Instagram ingestion/)).toBeTruthy();
    expect(screen.getByText(/business history is retained/)).toBeTruthy();
    expect(mocks.disconnect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm disconnect" }));
    await waitFor(() =>
      expect(mocks.disconnect).toHaveBeenCalledWith("instagram-integration"),
    );
    expect(await screen.findByText("Instagram disconnected")).toBeTruthy();
  });

  it("requires explicit deletion, presents the receipt, and blocks reconnect while active", async () => {
    let current = model();
    mocks.fetchIntegrations.mockImplementation(async () => current);
    mocks.deleteData.mockImplementation(async () => {
      current = model(integration({ authorizationHealth: "DISCONNECTED" }), {
        deletion: {
          requestId: "delete-request",
          state: "IN_PROGRESS",
          requestedAt: "2029-07-01T00:00:00.000Z",
        },
      });
      return {
        requestId: "delete-request",
        confirmationCode: "secret-confirmation-code",
        state: "IN_PROGRESS" as const,
        requestedAt: "2029-07-01T00:00:00.000Z",
        completedAt: null,
        result: null,
        policyVersion: "BS06_P1_V1",
      };
    });
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Manage connection" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Delete Instagram connection data" }),
    );
    expect(
      screen.getByText(/removes or sanitizes the provider connection/),
    ).toBeTruthy();
    expect(
      screen.getByText(/campaign and collaboration business history/),
    ).toBeTruthy();
    expect(mocks.deleteData).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm deletion" }));
    await waitFor(() =>
      expect(mocks.deleteData).toHaveBeenCalledWith("instagram-integration"),
    );
    expect(await screen.findByText(/Deletion request recorded/)).toBeTruthy();
    expect(screen.getByText(/Deletion status: in progress/i)).toBeTruthy();
    expect(document.body.textContent).not.toContain("secret-confirmation-code");
    expect(
      screen.queryByRole("button", { name: "Reconnect same account" }),
    ).toBeNull();
  });

  it.each([
    ["FAILED_RETRYABLE", "requires a backend retry"],
    ["FAILED_TERMINAL", "Contact support"],
  ] as const)("presents bounded %s deletion guidance", async (state, copy) => {
    mocks.fetchIntegrations.mockResolvedValue(
      model(integration(), {
        deletion: {
          requestId: "delete-request",
          state,
          requestedAt: "2029-07-01T00:00:00.000Z",
        },
      }),
    );
    mount();
    expect(await screen.findByText(new RegExp(copy, "i"))).toBeTruthy();
  });
});
