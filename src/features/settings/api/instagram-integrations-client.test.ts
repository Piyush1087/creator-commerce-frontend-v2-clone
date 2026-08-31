// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adoptAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";
import {
  cancelPendingInstagramAccountChange,
  connectInstagram,
  deleteInstagramConnectionData,
  fetchInstagramIntegrations,
  getInstagramOAuthUrl,
  InstagramIntegrationsApiError,
} from "./instagram-integrations-client";
import {
  isInstagramConnectResponse,
  isInstagramDeletionReceipt,
  isInstagramIntegrationsReadModel,
} from "../contracts/instagram-integrations.contracts";

const state = "a".repeat(43);
const fetchMock = vi.fn<typeof fetch>();

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function canonicalRow() {
  return {
    id: "instagram-integration",
    provider: "INSTAGRAM",
    status: "CONNECTED",
    currentPlatformHandle: "@brand",
    inboundOauthHandle: null,
    scopes: ["BASIC_PROFILE", "ENGAGEMENT_INSIGHTS"],
    tokenExpiresAt: null,
    tokenIssuedAt: null,
    tokenLastRefreshedAt: null,
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
      creatorMarketplaceDiscovery: "UNKNOWN",
    },
    humanActionRequired: false,
    syncHealth: "NOT_CONFIGURED",
    authorizationGeneration: 7,
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

function canonicalReadModel() {
  const row = canonicalRow();
  return {
    layoutCase: "FULL_INSTAGRAM",
    scrapedHandle: "@website-brand",
    igHandleProvenance: "WEBSITE_DERIVED",
    socialSyncSkipped: false,
    integrations: [row],
    instagram: row,
    metaBusinessSuite: null,
    deletion: null,
  };
}

beforeEach(() => {
  resetAuthSessionForTests();
  adoptAuthSession({
    accessToken: "settings-access-token",
    accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
    user: {
      id: "owner",
      email: "owner@example.test",
      name: "Owner",
      role: "BRAND",
    },
  });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetAuthSessionForTests();
});

describe("Instagram Settings runtime contracts", () => {
  it("accepts the canonical read model and rejects unknown enum values", () => {
    expect(isInstagramIntegrationsReadModel(canonicalReadModel())).toBe(true);
    expect(
      isInstagramIntegrationsReadModel({
        ...canonicalReadModel(),
        instagram: { ...canonicalRow(), authorizationHealth: "TOKEN_EXPIRED" },
      }),
    ).toBe(false);
    expect(
      isInstagramIntegrationsReadModel({
        ...canonicalReadModel(),
        instagram: {
          ...canonicalRow(),
          capabilities: {
            ...canonicalRow().capabilities,
            firstPartyProfile: "MAYBE",
          },
        },
      }),
    ).toBe(false);
  });

  it("validates success and stable-account conflict responses", () => {
    expect(
      isInstagramConnectResponse({
        conflict: false,
        connected: true,
        integrationId: "integration",
        handle: "@renamed",
        status: "CONNECTED",
        authorizationHealth: "CONNECTED_FULL",
        scopes: ["BASIC_PROFILE"],
        providerAccountId: "stable-provider-account",
      }),
    ).toBe(true);
    expect(
      isInstagramConnectResponse({
        conflict: true,
        code: "ACCOUNT_CHANGE_REQUIRED",
        integrationId: "integration",
        currentPlatformHandle: "@brand",
        inboundOauthHandle: "@different",
        message: "Owner required",
      }),
    ).toBe(true);
    expect(
      isInstagramConnectResponse({ conflict: true, code: "HANDLE_MISMATCH" }),
    ).toBe(false);
  });

  it("types the canonical deletion result and rejects arbitrary receipt payloads", () => {
    expect(
      isInstagramDeletionReceipt({
        requestId: "request",
        confirmationCode: "secret",
        state: "COMPLETED",
        requestedAt: "2029-01-01T00:00:00.000Z",
        completedAt: "2029-01-01T00:00:01.000Z",
        result: {
          deleted: ["CREDENTIAL_OR_AUTH"],
          sanitized: ["BrandIntegration.provider_display_identity"],
          retained: ["CAMPAIGN_COLLABORATION_BUSINESS_HISTORY"],
        },
        policyVersion: "BS06_P1_V1",
      }),
    ).toBe(true);
    expect(
      isInstagramDeletionReceipt({
        requestId: "request",
        confirmationCode: "secret",
        state: "COMPLETED",
        requestedAt: "now",
        completedAt: null,
        result: { everythingDeleted: true },
        policyVersion: "BS06_P1_V1",
      }),
    ).toBe(false);
  });
});

describe("Instagram Settings API client", () => {
  it("fails closed when the integrations response contains a future unknown state", async () => {
    fetchMock.mockResolvedValue(
      response({
        ...canonicalReadModel(),
        instagram: { ...canonicalRow(), authorizationHealth: "NEW_STATE" },
      }),
    );
    await expect(fetchInstagramIntegrations()).rejects.toMatchObject({
      name: "InstagramIntegrationsApiError",
      code: "INVALID_RESPONSE",
    });
  });

  it("sends explicit OAuth intent and validates backend-owned state", async () => {
    fetchMock.mockResolvedValue(
      response({
        url: "https://instagram.example.test/oauth",
        state,
        finalizedHandle: "@brand",
        intent: "ACCOUNT_CHANGE",
        expectedGeneration: 7,
      }),
    );
    await expect(
      getInstagramOAuthUrl(
        "https://app.example.test/callback",
        "ACCOUNT_CHANGE",
      ),
    ).resolves.toMatchObject({ intent: "ACCOUNT_CHANGE" });
    const url = new URL(
      String(fetchMock.mock.calls[0][0]),
      window.location.origin,
    );
    expect(url.searchParams.get("intent")).toBe("ACCOUNT_CHANGE");
    expect(url.searchParams.get("redirectUri")).toBe(
      "https://app.example.test/callback",
    );
  });

  it("rejects a non-HTTP OAuth destination", async () => {
    fetchMock.mockResolvedValue(
      response({
        url: "javascript:alert('unsafe')",
        state,
        finalizedHandle: null,
        intent: "INITIAL_CONNECT",
        expectedGeneration: 0,
      }),
    );
    await expect(
      getInstagramOAuthUrl(
        "https://app.example.test/callback",
        "INITIAL_CONNECT",
      ),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("requires code and state in the connect body without persisting either", async () => {
    fetchMock.mockResolvedValue(
      response({
        conflict: false,
        connected: true,
        integrationId: "integration",
        handle: "@brand",
        status: "CONNECTED",
        authorizationHealth: "CONNECTED_FULL",
        scopes: ["BASIC_PROFILE"],
        providerAccountId: "stable-provider-account",
      }),
    );
    await connectInstagram({
      code: "synthetic-code",
      state,
      redirectUri: "https://app.example.test/callback",
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      code: "synthetic-code",
      state,
      redirectUri: "https://app.example.test/callback",
    });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("can only issue CANCEL_CONNECT from the account-change cancellation helper", async () => {
    fetchMock.mockResolvedValue(
      response({ ok: true, resolution: "CANCEL_CONNECT", cancelled: true }),
    );
    await cancelPendingInstagramAccountChange({
      integrationId: "integration",
      currentPlatformHandle: "@brand",
      inboundOauthHandle: "@different",
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      integrationId: "integration",
      currentPlatformHandle: "@brand",
      inboundOauthHandle: "@different",
      resolution: "CANCEL_CONNECT",
    });
    expect(String(fetchMock.mock.calls[0][1]?.body)).not.toContain(
      "OVERWRITE_HANDLE",
    );
  });

  it("requires explicit deletion in the canonical manage action", async () => {
    fetchMock.mockResolvedValue(
      response({
        requestId: "request",
        confirmationCode: "secret",
        state: "IN_PROGRESS",
        requestedAt: "2029-01-01T00:00:00.000Z",
        completedAt: null,
        result: null,
        policyVersion: "BS06_P1_V1",
      }),
    );
    await deleteInstagramConnectionData("integration");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      integrationId: "integration",
      action: "DELETE_INGESTED_DATA",
      confirmDeleteData: true,
    });
  });

  it("preserves nested backend error codes without exposing an invalid body", async () => {
    fetchMock.mockResolvedValue(
      response(
        {
          message: {
            code: "PERSONAL_ACCOUNT",
            message: "Professional required",
          },
        },
        400,
      ),
    );
    const error = await connectInstagram({
      code: "code",
      state,
      redirectUri: "https://app.example.test/callback",
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(InstagramIntegrationsApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "PERSONAL_ACCOUNT",
      message: "Professional required",
    });
  });
});
