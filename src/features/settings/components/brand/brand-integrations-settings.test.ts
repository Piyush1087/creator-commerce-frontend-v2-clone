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
import { BrandIntegrationsSettings } from "./brand-integrations-settings";

vi.mock("../../../../shared/auth/auth-session", () => ({
  authAuthorizationHeader: () => ({}),
}));
vi.mock("../../../../shared/config/env", () => ({
  env: { apiUrl: "http://localhost:3000" },
}));
const root = "/brand/settings/integrations";
const state = "s".repeat(43); // Synthetic callback data, never a real provider credential.
const conflict = {
  conflict: true,
  integrationId: "integration",
  currentPlatformHandle: "@brand",
  inboundOauthHandle: "@other",
};
const fetchMock = vi.fn();
let status = "CONNECTED";
let callbackResponse: unknown;
let callbackOk: boolean;
let startOk: boolean;
let networkFailure: boolean;

function payload() {
  const connected = status === "CONNECTED";
  return {
    layoutCase:
      connected || status === "TOKEN_EXPIRED"
        ? "FULL_INSTAGRAM"
        : status === "PARTIALLY_CONNECTED"
          ? "PARTIAL_INSTAGRAM"
          : "SKIPPED",
    scrapedHandle: "@brand",
    socialSyncSkipped: false,
    instagram:
      status === "ABSENT"
        ? null
        : {
            id: "integration",
            provider: "INSTAGRAM",
            status,
            currentPlatformHandle: "@brand",
            scopes: connected
              ? ["BASIC_PROFILE", "ENGAGEMENT_INSIGHTS"]
              : ["BASIC_PROFILE"],
          },
    metaBusinessSuite: { id: "meta", status: "CONNECTED" },
  };
}
const response = (body: unknown, ok = true) => ({ ok, json: async () => body });
function requests(path: string) {
  return fetchMock.mock.calls.filter(([url]) => String(url).includes(path));
}
function body(path: string) {
  const call = requests(path).at(-1);
  return JSON.parse((call?.[1] as RequestInit).body as string) as Record<
    string,
    unknown
  >;
}
function mount(query = "", strict = false) {
  window.history.replaceState({ router: "preserved" }, "", root + query);
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
  status = "CONNECTED";
  callbackResponse = { connected: true };
  callbackOk = true;
  startOk = true;
  networkFailure = false;
  fetchMock.mockReset().mockImplementation(async (url: string) => {
    if (url.includes("/instagram/connect")) {
      if (networkFailure) throw new Error("Connection unavailable");
      return response(callbackResponse, callbackOk);
    }
    if (url.includes("/oauth-url"))
      return response(
        startOk
          ? { url: `${window.location.origin}${root}#authorization` }
          : { message: "OAuth unavailable" },
        startOk,
      );
    if (url.endsWith("/manage")) {
      status = "DISCONNECTED";
      return response({ ok: true, historicalDataRetained: true });
    }
    if (url.endsWith("/resolve-identity-conflict"))
      return response({ ok: true });
    return response(payload());
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", root);
});

describe("BS-06 Instagram Settings", () => {
  it("keeps keyboard focus inside the identity decision dialog", async () => {
    callbackResponse = conflict;
    mount(`?code=synthetic-code&state=${state}`);
    const cancel = await screen.findByRole("button", {
      name: "Cancel Handshake & Reconnect Correct Profile",
    });
    const overwrite = screen.getByRole("button", {
      name: "Overwrite & Use New Identity",
    });
    await waitFor(() => expect(document.activeElement).toBe(cancel));
    fireEvent.keyDown(cancel, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(overwrite);
    fireEvent.keyDown(overwrite, { key: "Tab" });
    expect(document.activeElement).toBe(cancel);
  });
  it.each([true, false])("starts OAuth with success=%s", async (success) => {
    status = "ABSENT";
    startOk = success;
    mount();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Connect Instagram Standalone",
      }),
    );
    if (success)
      await waitFor(() => expect(window.location.hash).toBe("#authorization"));
    else expect(await screen.findByText("OAuth unavailable")).toBeTruthy();
    const url = new URL(String(requests("/oauth-url")[0][0]));
    expect(url.searchParams.get("redirectUri")).toBe(
      `${window.location.origin}${root}`,
    );
  });

  it.each([false, true])(
    "submits code and state once, cleans only callback params (StrictMode=%s)",
    async (strict) => {
      mount(
        `?tab=instagram&code=synthetic-code&state=${state}#section`,
        strict,
      );
      expect(await screen.findByText("Instagram connected.")).toBeTruthy();
      expect(body("/instagram/connect")).toEqual({
        code: "synthetic-code",
        state,
        redirectUri: `${window.location.origin}${root}`,
      });
      expect(requests("/instagram/connect")).toHaveLength(1);
      expect(window.location.search).toBe("?tab=instagram");
      expect(window.location.hash).toBe("#section");
      expect(window.history.state).toEqual({ router: "preserved" });
    },
  );

  it.each([
    "?code=synthetic-code",
    "?code=synthetic-code&state=",
    `?state=${state}`,
    "?error=access_denied&error_reason=denied&error_description=declined",
  ])(
    "fails safely and cleans incomplete or denied callback %s",
    async (query) => {
      mount(query);
      expect(
        await screen.findByText(
          "Instagram authorization is incomplete. Start a new connection attempt.",
        ),
      ).toBeTruthy();
      expect(requests("/instagram/connect")).toHaveLength(0);
      expect(window.location.search).toBe("");
    },
  );

  it.each(["backend", "network", "malformed"])(
    "cleans query on %s callback failure and never reports success",
    async (failure) => {
      if (failure === "backend") {
        callbackOk = false;
        callbackResponse = { message: "State expired. Start again." };
      }
      if (failure === "network") networkFailure = true;
      if (failure === "malformed") callbackResponse = {};
      mount(`?code=synthetic-code&state=${state}`);
      await waitFor(() =>
        expect(
          screen
            .getByRole("button", { name: "Manage connection" })
            .hasAttribute("disabled"),
        ).toBe(false),
      );
      expect(screen.queryByText("Instagram connected.")).toBeNull();
      expect(window.location.search).toBe("");
      expect(requests("/instagram/connect")).toHaveLength(1);
    },
  );

  it.each(["CONNECTED", "PARTIALLY_CONNECTED", "TOKEN_EXPIRED", "ABSENT"])(
    "preserves %s presentation and hides Meta card even if API returns one",
    async (connection) => {
      status = connection;
      mount();
      expect(
        await screen.findByText(
          connection === "CONNECTED"
            ? "Connected"
            : connection === "PARTIALLY_CONNECTED"
              ? "Partially connected"
              : connection === "TOKEN_EXPIRED"
                ? "Token expired"
                : "Not connected",
        ),
      ).toBeTruthy();
      expect(screen.queryByText(/Meta Business Suite/)).toBeNull();
      expect(screen.queryByRole("button", { name: /Connect Meta/ })).toBeNull();
    },
  );

  it.each(["TOKEN_EXPIRED", "PARTIALLY_CONNECTED"])(
    "%s recovery starts new OAuth",
    async (connection) => {
      status = connection;
      mount();
      fireEvent.click(
        await screen.findByRole("button", {
          name:
            connection === "TOKEN_EXPIRED"
              ? "Re-authenticate"
              : "Reconnect to Enable Insights",
        }),
      );
      await waitFor(() => expect(requests("/oauth-url")).toHaveLength(1));
      expect(requests("/instagram/connect")).toHaveLength(0);
    },
  );

  it("manage reconnect starts new OAuth and drawer close control is labelled", async () => {
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Manage connection" }),
    );
    expect(
      screen.getByRole("button", { name: "Close manage connection" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reconnect" }));
    await waitFor(() => expect(requests("/oauth-url")).toHaveLength(1));
  });

  it.each(["OVERWRITE_HANDLE", "CANCEL_CONNECT"] as const)(
    "identity conflict supports %s",
    async (resolution) => {
      callbackResponse = conflict;
      mount(`?code=synthetic-code&state=${state}`);
      expect(
        await screen.findByRole("dialog", {
          name: "Meta Identity Conflict Detected",
        }),
      ).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", {
          name:
            resolution === "OVERWRITE_HANDLE"
              ? "Overwrite & Use New Identity"
              : "Cancel Handshake & Reconnect Correct Profile",
        }),
      );
      await waitFor(() =>
        expect(requests("/resolve-identity-conflict")).toHaveLength(1),
      );
      expect(body("/resolve-identity-conflict")).toEqual({
        integrationId: conflict.integrationId,
        currentPlatformHandle: conflict.currentPlatformHandle,
        inboundOauthHandle: conflict.inboundOauthHandle,
        resolution,
      });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    },
  );

  it.each(["DISCONNECT_INTEGRATION", "DELETE_INGESTED_DATA"] as const)(
    "manages %s with truthful credential-only semantics",
    async (action) => {
      mount();
      fireEvent.click(
        await screen.findByRole("button", { name: "Manage connection" }),
      );
      expect(
        screen.getByText(
          /Historical analytics, Intelligence, and campaign evidence are retained/,
        ),
      ).toBeTruthy();
      expect(
        screen.queryByText(
          /Delete Ingested Social Data|full purge|analytics purge deferred/i,
        ),
      ).toBeNull();
      fireEvent.click(
        screen.getByRole("button", {
          name:
            action === "DELETE_INGESTED_DATA"
              ? "Disconnect and remove connection credentials"
              : "Disconnect Integration",
        }),
      );
      await waitFor(() => expect(requests("/manage")).toHaveLength(1));
      expect(body("/manage")).toMatchObject({
        integrationId: "integration",
        action,
        confirmDeleteData: action === "DELETE_INGESTED_DATA",
      });
      expect(
        await screen.findByText(
          action === "DELETE_INGESTED_DATA"
            ? "Instagram disconnected and connection credentials removed. Historical data retained."
            : "Integration disconnected.",
        ),
      ).toBeTruthy();
    },
  );
});
