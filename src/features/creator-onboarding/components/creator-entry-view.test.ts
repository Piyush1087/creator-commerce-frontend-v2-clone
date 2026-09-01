// @vitest-environment jsdom
import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CreatorEntryState } from "../contracts/creator-entry.contracts";
import { saveCreatorEntryContinuation } from "../utils/creator-entry-continuation-session";
import { readCreatorEntryContinuation } from "../utils/creator-entry-continuation-session";
import { ApiRequestError } from "../../../shared/api/parse-api-error";
import { CreatorEntryView } from "./creator-entry-view";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  fetchState: vi.fn(),
  resolve: vi.fn(),
  revalidate: vi.fn(),
  registerPassword: vi.fn(),
  verifyOtp: vi.fn(),
  requestOtp: vi.fn(),
  registerGoogle: vi.fn(),
}));

vi.mock("../../../shared/auth/use-auth-session", () => ({
  useAuthSession: mocks.session,
}));
vi.mock("../../auth/components/google-sign-in-button", () => ({
  GoogleSignInButton: ({
    onCredential,
  }: {
    onCredential: (token: string) => void;
  }) =>
    createElement(
      "button",
      { type: "button", onClick: () => onCredential("google-id-token") },
      "Google registration",
    ),
}));
vi.mock("../api/creator-entry-client", () => ({
  authorizeCreatorInstagram: vi.fn(),
  authorizeCreatorInstagramReconnect: vi.fn(),
  fetchCreatorEntryState: mocks.fetchState,
  registerCreatorGoogle: mocks.registerGoogle,
  registerCreatorPassword: mocks.registerPassword,
  requestCreatorRegistrationOtp: mocks.requestOtp,
  resolveCampaignApplyContinuation: mocks.resolve,
  revalidateCreatorInstagram: mocks.revalidate,
  verifyCreatorRegistrationOtp: mocks.verifyOtp,
}));

const creator = {
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
const incomplete: CreatorEntryState = {
  accountContext: "CREATOR_READY",
  onboardingStatus: "INCOMPLETE",
  canEnterCreatorPlatform: false,
  nextAction: "CONNECT_INSTAGRAM",
  instagram: {
    identityConnection: "NOT_CONNECTED",
    basicAuthorization: "UNKNOWN",
    insightsCapability: "UNKNOWN",
    authorizationHealth: "UNKNOWN",
  },
};

function renderEntry() {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: ["/creator/onboarding"] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/creator/onboarding",
          element: createElement(CreatorEntryView),
        }),
        createElement(Route, {
          path: "/creator/home",
          element: createElement("p", null, "Creator home rendered"),
        }),
        createElement(Route, {
          path: "/marketplace",
          element: createElement("p", null, "Marketplace rendered"),
        }),
        createElement(Route, {
          path: "/creator/marketplace/:campaignId",
          element: createElement(
            "p",
            null,
            "Campaign detail rendered; application closed",
          ),
        }),
      ),
    ),
  );
}

beforeEach(() => {
  sessionStorage.clear();
  mocks.fetchState.mockReset();
  mocks.resolve.mockReset();
  mocks.revalidate.mockReset();
  mocks.registerPassword.mockReset();
  mocks.verifyOtp.mockReset();
  mocks.requestOtp.mockReset();
  mocks.registerGoogle.mockReset();
});
afterEach(cleanup);

describe("Creator Entry state surface", () => {
  it("renders direct unauthenticated account entry with shared sign-in", () => {
    mocks.session.mockReturnValue({
      accessToken: null,
      accessTokenExpiresAt: null,
      currentUser: null,
      status: "UNAUTHENTICATED",
    });
    renderEntry();
    expect(
      screen.getByRole("heading", { name: "Create your Creator account" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Sign in" }).getAttribute("href"),
    ).toBe("/login");
  });

  it("renders campaign context without exposing campaign data", () => {
    mocks.session.mockReturnValue({
      accessToken: null,
      accessTokenExpiresAt: null,
      currentUser: null,
      status: "UNAUTHENTICATED",
    });
    saveCreatorEntryContinuation("A".repeat(43));
    renderEntry();
    expect(screen.getByText(/we’ll return you to the campaign/i)).toBeTruthy();
    expect(document.body.textContent).not.toContain("A".repeat(43));
  });

  it("moves password registration to verification and supports verify plus resend", async () => {
    mocks.session.mockReturnValue({
      accessToken: null,
      accessTokenExpiresAt: null,
      currentUser: null,
      status: "UNAUTHENTICATED",
    });
    mocks.registerPassword.mockResolvedValue({
      accepted: true,
      message: "Verify",
      nextAction: "VERIFY_EMAIL",
    });
    mocks.verifyOtp.mockResolvedValue({});
    mocks.requestOtp.mockResolvedValue({ accepted: true });
    renderEntry();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "creator@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password-123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Creator account" }),
    );
    const code = await screen.findByLabelText("Verification code");
    expect(mocks.registerPassword).toHaveBeenCalledWith({
      email: "creator@example.test",
      password: "password-123",
    });
    fireEvent.change(code, { target: { value: "123456" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Verify and continue" }),
    );
    await waitFor(() =>
      expect(mocks.verifyOtp).toHaveBeenCalledWith({
        email: "creator@example.test",
        code: "123456",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await waitFor(() =>
      expect(mocks.requestOtp).toHaveBeenCalledWith("creator@example.test"),
    );
  });

  it("surfaces existing-account sign-in behavior and routes Google through registration", async () => {
    mocks.session.mockReturnValue({
      accessToken: null,
      accessTokenExpiresAt: null,
      currentUser: null,
      status: "UNAUTHENTICATED",
    });
    mocks.registerPassword.mockRejectedValue(
      new ApiRequestError({
        message: "Exists",
        status: 409,
        code: "ACCOUNT_EXISTS_SIGN_IN_REQUIRED",
      }),
    );
    mocks.registerGoogle.mockResolvedValue({});
    renderEntry();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "creator@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password-123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Creator account" }),
    );
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /account already exists/i,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Google registration" }),
    );
    await waitFor(() =>
      expect(mocks.registerGoogle).toHaveBeenCalledWith("google-id-token"),
    );
  });

  it("routes backend-usable Creators to home even when Insights is unavailable", async () => {
    mocks.session.mockReturnValue(creator);
    mocks.fetchState.mockResolvedValue({
      ...incomplete,
      onboardingStatus: "COMPLETE",
      canEnterCreatorPlatform: true,
      nextAction: "CREATOR_WORKSPACE_ENTRY",
      instagram: { ...incomplete.instagram, insightsCapability: "UNAVAILABLE" },
    });
    renderEntry();
    expect(await screen.findByText("Creator home rendered")).toBeTruthy();
  });

  it("fails closed for an authenticated Brand account", async () => {
    mocks.session.mockReturnValue({
      ...creator,
      currentUser: { ...creator.currentUser, role: "BRAND" },
    });
    mocks.fetchState.mockResolvedValue({
      ...incomplete,
      accountContext: "ACCOUNT_CONTEXT_CONFLICT",
      nextAction: "RESOLVE_ACCOUNT_CONTEXT",
    });
    renderEntry();
    expect(
      await screen.findByRole("heading", {
        name: /Brand account cannot enter/i,
      }),
    ).toBeTruthy();
    expect(screen.queryByText("Creator home rendered")).toBeNull();
  });

  it("revalidates without OAuth and reads fresh backend state", async () => {
    mocks.session.mockReturnValue(creator);
    mocks.fetchState
      .mockResolvedValueOnce({
        ...incomplete,
        nextAction: "REVALIDATE_INSTAGRAM",
      })
      .mockResolvedValueOnce(incomplete);
    mocks.revalidate.mockResolvedValue({
      revalidated: true,
      state: incomplete,
    });
    renderEntry();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Check Instagram connection again",
      }),
    );
    await waitFor(() => expect(mocks.revalidate).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mocks.fetchState).toHaveBeenCalledTimes(2));
  });

  it("retains a pending Campaign continuation while rendering backend next action", async () => {
    mocks.session.mockReturnValue(creator);
    saveCreatorEntryContinuation("P".repeat(43));
    mocks.fetchState.mockResolvedValue(incomplete);
    mocks.resolve.mockResolvedValue({
      status: "PENDING_CREATOR_ENTRY",
      intent: "CAMPAIGN_APPLY",
      nextAction: "CONNECT_INSTAGRAM",
    });
    renderEntry();
    expect(
      await screen.findByRole("button", { name: "Connect Instagram" }),
    ).toBeTruthy();
    expect(readCreatorEntryContinuation()).toBe("P".repeat(43));
  });

  it("clears a ready continuation and returns to Campaign detail without opening Apply", async () => {
    mocks.session.mockReturnValue(creator);
    saveCreatorEntryContinuation("R".repeat(43));
    mocks.fetchState.mockResolvedValue({
      ...incomplete,
      canEnterCreatorPlatform: true,
      nextAction: "CREATOR_WORKSPACE_ENTRY",
    });
    mocks.resolve.mockResolvedValue({
      status: "READY_TO_RETURN",
      intent: "CAMPAIGN_APPLY",
      nextAction: "RETURN_TO_ORIGINATING_CAMPAIGN",
      campaign: { campaignId: "campaign-9" },
    });
    renderEntry();
    expect(
      await screen.findByText("Campaign detail rendered; application closed"),
    ).toBeTruthy();
    expect(readCreatorEntryContinuation()).toBeNull();
  });

  it("clears expired continuation and provides Marketplace recovery", async () => {
    mocks.session.mockReturnValue(creator);
    saveCreatorEntryContinuation("E".repeat(43));
    mocks.fetchState.mockResolvedValue(incomplete);
    mocks.resolve.mockRejectedValue(
      new ApiRequestError({
        message: "Expired",
        status: 410,
        code: "CREATOR_ENTRY_CONTINUATION_EXPIRED",
      }),
    );
    renderEntry();
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /campaign setup link expired/i,
    );
    expect(readCreatorEntryContinuation()).toBeNull();
    expect(
      screen.getByRole("button", { name: "Return to Marketplace" }),
    ).toBeTruthy();
  });

  it("fails closed and retains an identity-conflicted continuation", async () => {
    mocks.session.mockReturnValue(creator);
    saveCreatorEntryContinuation("I".repeat(43));
    mocks.fetchState.mockResolvedValue(incomplete);
    mocks.resolve.mockRejectedValue(
      new ApiRequestError({
        message: "Conflict",
        status: 409,
        code: "CREATOR_ENTRY_CONTINUATION_IDENTITY_CONFLICT",
      }),
    );
    renderEntry();
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /different signed-in account/i,
    );
    expect(readCreatorEntryContinuation()).toBe("I".repeat(43));
  });

  it("clears a continuation the backend cannot find", async () => {
    mocks.session.mockReturnValue(creator);
    saveCreatorEntryContinuation("N".repeat(43));
    mocks.fetchState.mockResolvedValue(incomplete);
    mocks.resolve.mockRejectedValue(
      new ApiRequestError({
        message: "Missing",
        status: 404,
        code: "CREATOR_ENTRY_CONTINUATION_NOT_FOUND",
      }),
    );
    renderEntry();
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /unavailable/i,
    );
    expect(readCreatorEntryContinuation()).toBeNull();
  });
});
