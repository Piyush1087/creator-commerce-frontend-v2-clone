import { env } from "../../../shared/config/env";
import { authAuthorizationHeader } from "../../../shared/auth/auth-session";
import type {
  CreatorPayoutSettingsResponse,
  CreatorProfileResponse,
  CreatorShippingResponse,
  CreatorSocialListResponse,
  CreatorWorkspaceResponse,
  InviteWorkspaceMemberPayload,
  UpdateCreatorProfilePayload,
  UpdateWorkspacePayload,
  UpsertCreatorPayoutBankPayload,
  UpsertCreatorShippingPayload,
} from "../contracts/creator-settings.contracts";
import type { SocialPlatform } from "../contracts/creator-settings.contracts";

const BASE = `${env.apiUrl}/api/v1/creator/settings`;

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return body;
}

function jsonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...authAuthorizationHeader(),
  };
}

export async function fetchCreatorProfileSettings(): Promise<CreatorProfileResponse> {
  const response = await fetch(`${BASE}/profile`, {
    method: "GET",
    headers: jsonHeaders(),
  });
  return (await readJsonOrThrow(response)) as CreatorProfileResponse;
}

export async function updateCreatorProfileSettings(
  payload: UpdateCreatorProfilePayload,
): Promise<CreatorProfileResponse> {
  const response = await fetch(`${BASE}/profile`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return (await readJsonOrThrow(response)) as CreatorProfileResponse;
}

export async function fetchCreatorShipping(): Promise<CreatorShippingResponse> {
  const response = await fetch(`${BASE}/shipping`, {
    method: "GET",
    headers: jsonHeaders(),
  });
  return (await readJsonOrThrow(response)) as CreatorShippingResponse;
}

export async function upsertCreatorShipping(
  payload: UpsertCreatorShippingPayload,
): Promise<CreatorShippingResponse> {
  const response = await fetch(`${BASE}/shipping`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return (await readJsonOrThrow(response)) as CreatorShippingResponse;
}

export async function fetchCreatorWorkspace(): Promise<CreatorWorkspaceResponse> {
  const response = await fetch(`${BASE}/workspace`, {
    method: "GET",
    headers: jsonHeaders(),
  });
  return (await readJsonOrThrow(response)) as CreatorWorkspaceResponse;
}

export async function updateCreatorWorkspace(
  payload: UpdateWorkspacePayload,
): Promise<CreatorWorkspaceResponse> {
  const response = await fetch(`${BASE}/workspace`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return (await readJsonOrThrow(response)) as CreatorWorkspaceResponse;
}

export async function inviteCreatorTeamMember(
  payload: InviteWorkspaceMemberPayload,
): Promise<unknown> {
  const response = await fetch(`${BASE}/team/invite`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return readJsonOrThrow(response);
}

export async function revokeCreatorTeamMember(memberId: string): Promise<unknown> {
  const response = await fetch(`${BASE}/team/${encodeURIComponent(memberId)}`, {
    method: "DELETE",
    headers: jsonHeaders(),
  });
  return readJsonOrThrow(response);
}

export async function cancelCreatorTeamInvitation(invitationId: string): Promise<unknown> {
  const response = await fetch(
    `${BASE}/team/invitations/${encodeURIComponent(invitationId)}`,
    {
      method: "DELETE",
      headers: jsonHeaders(),
    },
  );
  return readJsonOrThrow(response);
}

export async function fetchCreatorSocialIntegrations(): Promise<CreatorSocialListResponse> {
  const response = await fetch(`${BASE}/social`, {
    method: "GET",
    headers: jsonHeaders(),
  });
  return (await readJsonOrThrow(response)) as CreatorSocialListResponse;
}

export async function disconnectCreatorSocial(platform: SocialPlatform): Promise<unknown> {
  const response = await fetch(`${BASE}/social/${encodeURIComponent(platform)}`, {
    method: "DELETE",
    headers: jsonHeaders(),
  });
  return readJsonOrThrow(response);
}

export async function fetchCreatorPayoutSettings(): Promise<CreatorPayoutSettingsResponse> {
  const response = await fetch(`${BASE}/payouts`, {
    method: "GET",
    headers: jsonHeaders(),
  });
  return (await readJsonOrThrow(response)) as CreatorPayoutSettingsResponse;
}

export async function upsertCreatorPayoutBank(
  payload: UpsertCreatorPayoutBankPayload,
): Promise<unknown> {
  const response = await fetch(`${BASE}/payouts/bank`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return readJsonOrThrow(response);
}
