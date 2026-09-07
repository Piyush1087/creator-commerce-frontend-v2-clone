// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";
import {
  CreatorTeamInvitationError,
  fetchCreatorTeam,
  fetchCreatorWorkspaceActorContext,
  inspectCreatorTeamInvitation,
  inviteCreatorTeamMember,
} from "./creator-team-client";

const fetchMock = vi.fn();

function response(body: unknown, status = 200): Response {
  return new Response(body === undefined ? undefined : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  resetAuthSessionForTests();
  clearAuthSession();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("C05 Creator Team client", () => {
  it("surfaces unauthenticated actor projection as 401 without retry loops", async () => {
    fetchMock.mockResolvedValueOnce(response({ message: "Unauthorized" }, 401));
    await expect(fetchCreatorWorkspaceActorContext()).rejects.toMatchObject({
      message: "Unauthorized",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/v1/creator/workspace/actor-context",
    );
  });

  it("preserves a fail-closed 403 Team response without refreshing", async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        {
          code: "CREATOR_TEAM_FORBIDDEN",
          message: "No active Creator workspace membership",
        },
        403,
      ),
    );
    const operation = fetchCreatorTeam();
    await expect(operation).rejects.toBeInstanceOf(CreatorTeamInvitationError);
    await operation.catch((error: CreatorTeamInvitationError) => {
      expect(error.code).toBe("CREATOR_TEAM_FORBIDDEN");
      expect(error.message).toBe("No active Creator workspace membership");
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends only Manager or Assistant invitation payloads to the bounded route", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ delivery_status: "DISPATCHED" }, 201),
    );
    await inviteCreatorTeamMember({
      recipientEmail: "recipient@example.test",
      allocatedRole: "MANAGER",
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/v1/creator/settings/team/invitations",
    );
    expect(
      JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string),
    ).toEqual({
      recipientEmail: "recipient@example.test",
      allocatedRole: "MANAGER",
    });
  });

  it("keeps invitation bearer material out of the inspection URL", async () => {
    const rawToken = "creator-raw-token-fixture";
    fetchMock.mockResolvedValueOnce(
      response({
        workspace_name: "Creator Studio",
        email: "recipient@example.test",
        role: "ASSISTANT",
        expires_at: "2026-09-08T12:00:00.000Z",
        requires_existing_creator_account: false,
      }),
    );
    await inspectCreatorTeamInvitation(rawToken);
    expect(String(fetchMock.mock.calls[0][0])).not.toContain(rawToken);
    expect(
      JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string),
    ).toEqual({ token: rawToken });
  });
});
