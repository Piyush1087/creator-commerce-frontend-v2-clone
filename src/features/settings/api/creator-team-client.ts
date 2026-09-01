import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import type {
  CreatorTeamAssignableRole,
  CreatorTeamInvitationDispatch,
  CreatorTeamResponse,
  CreatorWorkspaceActorContextResponse,
  InspectCreatorTeamInvitationResponse,
  InviteCreatorTeamMemberPayload,
} from "../contracts/creator-team.contracts";

const TEAM_BASE = `${env.apiUrl}/api/v1/creator/settings/team`;
const INVITATION_BASE = `${env.apiUrl}/api/v1/creator/team-invitations`;

export class CreatorTeamInvitationError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

function headers(): HeadersInit {
  return { "Content-Type": "application/json" };
}

async function jsonOrThrow<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error("The server returned an invalid response.");
  }
  if (!response.ok) {
    const object =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : undefined;
    const nested =
      typeof object?.message === "object" && object.message !== null
        ? (object.message as Record<string, unknown>)
        : undefined;
    const message =
      (typeof object?.message === "string" && object.message) ||
      (typeof nested?.message === "string" && nested.message) ||
      `Request failed (${response.status}).`;
    const code =
      (typeof object?.code === "string" && object.code) ||
      (typeof nested?.code === "string" && nested.code) ||
      "CREATOR_TEAM_REQUEST_FAILED";
    throw new CreatorTeamInvitationError(message, code);
  }
  return body as T;
}

export async function fetchCreatorWorkspaceActorContext(): Promise<CreatorWorkspaceActorContextResponse> {
  return jsonOrThrow(
    await authenticatedFetch(
      `${env.apiUrl}/api/v1/creator/workspace/actor-context`,
      { method: "GET", headers: headers() },
    ),
  );
}

export async function fetchCreatorTeam(): Promise<CreatorTeamResponse> {
  return jsonOrThrow(
    await authenticatedFetch(TEAM_BASE, { method: "GET", headers: headers() }),
  );
}

export async function inviteCreatorTeamMember(
  payload: InviteCreatorTeamMemberPayload,
): Promise<CreatorTeamInvitationDispatch> {
  return jsonOrThrow(
    await authenticatedFetch(`${TEAM_BASE}/invitations`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    }),
  );
}

export async function updateCreatorTeamMemberRole(
  membershipId: string,
  allocatedRole: CreatorTeamAssignableRole,
): Promise<void> {
  await jsonOrThrow(
    await authenticatedFetch(
      `${TEAM_BASE}/members/${encodeURIComponent(membershipId)}/role`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ allocatedRole }),
      },
    ),
  );
}

export async function removeCreatorTeamMember(
  membershipId: string,
): Promise<void> {
  await jsonOrThrow(
    await authenticatedFetch(
      `${TEAM_BASE}/members/${encodeURIComponent(membershipId)}`,
      { method: "DELETE", headers: headers() },
    ),
  );
}

export async function cancelCreatorTeamInvitation(
  invitationId: string,
): Promise<void> {
  await jsonOrThrow(
    await authenticatedFetch(
      `${TEAM_BASE}/invitations/${encodeURIComponent(invitationId)}`,
      { method: "DELETE", headers: headers() },
    ),
  );
}

export async function inspectCreatorTeamInvitation(
  token: string,
): Promise<InspectCreatorTeamInvitationResponse> {
  return jsonOrThrow(
    await fetch(`${INVITATION_BASE}/inspect`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ token }),
    }),
  );
}

export async function acceptCreatorTeamInvitation(
  token: string,
): Promise<void> {
  await jsonOrThrow(
    await authenticatedFetch(`${INVITATION_BASE}/accept`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ token }),
    }),
  );
}
