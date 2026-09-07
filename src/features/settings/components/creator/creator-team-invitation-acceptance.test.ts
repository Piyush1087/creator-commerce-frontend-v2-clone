// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adoptAuthSession,
  clearAuthSession,
  resetAuthSessionForTests,
} from "../../../../shared/auth/auth-session";
import { CreatorTeamInvitationAcceptance } from "./creator-team-invitation-acceptance";

const fetchMock = vi.fn();
const rawToken = "creator-team-invitation-token-fixture";
const invitation = {
  workspace_name: "Canonical Creator Studio",
  email: "invited.creator@example.test",
  role: "ASSISTANT",
  expires_at: "2026-09-08T12:00:00.000Z",
  requires_existing_creator_account: false,
};

function response(body: unknown, status = 200): Response {
  return new Response(body === undefined ? undefined : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mount(onAccepted = vi.fn()) {
  window.history.replaceState(
    null,
    "",
    `/creator/team-invitations/accept#token=${rawToken}`,
  );
  render(createElement(CreatorTeamInvitationAcceptance, { onAccepted }));
  return onAccepted;
}

beforeEach(() => {
  resetAuthSessionForTests();
  clearAuthSession();
  localStorage.clear();
  sessionStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("C05 Creator Team invitation acceptance", () => {
  it("captures and scrubs the fragment bearer without browser persistence", async () => {
    fetchMock.mockResolvedValueOnce(response(invitation));
    mount();
    expect(window.location.hash).toBe("");
    expect(await screen.findByText("Canonical Creator Studio")).toBeTruthy();
    const request = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    ) as Record<string, string>;
    expect(request).toEqual({ token: rawToken });
    expect(String(fetchMock.mock.calls[0][0])).not.toContain(rawToken);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("does not fabricate a User when no active Creator account exists", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ ...invitation, requires_existing_creator_account: true }),
    );
    mount();
    expect(
      await screen.findByText("Existing Creator account required"),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Accept invitation" }),
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("allows only the exact authenticated invited User to accept", async () => {
    adoptAuthSession({
      accessToken: "creator-access-token",
      accessTokenExpiresAt: "2099-09-01T13:00:00.000Z",
      user: {
        id: "invited-user",
        email: invitation.email,
        name: "Invited Creator",
        role: "CREATOR",
        organizationId: null,
      },
    });
    fetchMock
      .mockResolvedValueOnce(response(invitation))
      .mockResolvedValueOnce(response({ accepted: true }));
    const accepted = mount();
    expect(
      await screen.findByText(`Continue as ${invitation.email}.`),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Accept invitation" }));
    expect(
      await screen.findByText("Invitation accepted. Your workspace is ready."),
    ).toBeTruthy();
    expect(accepted).toHaveBeenCalledTimes(1);
    const headers = new Headers(
      (fetchMock.mock.calls[1][1] as RequestInit).headers,
    );
    expect(headers.get("Authorization")).toBe("Bearer creator-access-token");
  });

  it("blocks a different authenticated account", async () => {
    adoptAuthSession({
      accessToken: "other-access-token",
      accessTokenExpiresAt: "2099-09-01T13:00:00.000Z",
      user: {
        id: "other-user",
        email: "other@example.test",
        name: "Other Creator",
        role: "CREATOR",
        organizationId: null,
      },
    });
    fetchMock.mockResolvedValueOnce(response(invitation));
    mount();
    expect(
      await screen.findByText(/signed in as other@example\.test/),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Accept invitation" }),
    ).toBeNull();
  });

  it.each([
    ["INVITATION_INVALID", 404, "Invalid invitation"],
    ["INVITATION_EXPIRED", 410, "Invitation expired"],
    ["INVITATION_CONSUMED", 409, "Invitation already accepted"],
  ] as const)("renders terminal state %s", async (code, status, title) => {
    fetchMock.mockResolvedValueOnce(
      response({ code, message: "This invitation is unavailable." }, status),
    );
    mount();
    expect(await screen.findByText(title)).toBeTruthy();
  });
});
