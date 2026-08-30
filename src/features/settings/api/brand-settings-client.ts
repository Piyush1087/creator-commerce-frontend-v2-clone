import { env } from "../../../shared/config/env";
import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import type {
  BrandBillingProfileResponse,
  BrandGeneralResponse,
  BrandNotificationsResponse,
  BrandWithdrawalAccountResponse,
  InviteTeamMemberPayload,
  LinkBrandWithdrawalAccountPayload,
  UpdateBrandGeneralPayload,
  UpdateBrandNotificationsPayload,
  UpdateTeamRolePayload,
  UpsertBrandBillingProfilePayload,
  TeamInvitationDispatch,
} from "../contracts/brand-settings.contracts";

const BASE = `${env.apiUrl}/api/v1/brand/settings`;

export class BrandSettingsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);
  }
}

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error(
      "The server returned an invalid response. Please try again.",
    );
  }
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed (${response.status}).`;
    const code =
      typeof body === "object" &&
      body !== null &&
      typeof (body as { code?: unknown }).code === "string"
        ? (body as { code: string }).code
        : null;
    throw new BrandSettingsApiError(message, response.status, code);
  }
  return body;
}

function jsonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
  };
}

export async function fetchBrandGeneralSettings(): Promise<BrandGeneralResponse> {
  const response = await fetch(`${BASE}/general`, {
    method: "GET",
    headers: jsonHeaders(),
  });
  return (await readJsonOrThrow(response)) as BrandGeneralResponse;
}

export async function updateBrandGeneralSettings(
  payload: UpdateBrandGeneralPayload,
): Promise<BrandGeneralResponse> {
  const response = await fetch(`${BASE}/general`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return (await readJsonOrThrow(response)) as BrandGeneralResponse;
}

export async function fetchBrandBillingProfile(): Promise<BrandBillingProfileResponse> {
  const response = await fetch(`${BASE}/billing-profile`, {
    method: "GET",
    headers: jsonHeaders(),
  });
  return (await readJsonOrThrow(response)) as BrandBillingProfileResponse;
}

export async function upsertBrandBillingProfile(
  payload: UpsertBrandBillingProfilePayload,
): Promise<BrandBillingProfileResponse> {
  const response = await fetch(`${BASE}/billing-profile`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return (await readJsonOrThrow(response)) as BrandBillingProfileResponse;
}

export async function fetchBrandWithdrawalAccount(): Promise<BrandWithdrawalAccountResponse> {
  const response = await fetch(`${BASE}/withdrawal-account`, {
    method: "GET",
    headers: jsonHeaders(),
  });
  return (await readJsonOrThrow(response)) as BrandWithdrawalAccountResponse;
}

export async function linkBrandWithdrawalAccount(
  payload: LinkBrandWithdrawalAccountPayload,
): Promise<unknown> {
  const response = await fetch(`${BASE}/withdrawal-account`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return readJsonOrThrow(response);
}

export async function fetchBrandNotifications(): Promise<BrandNotificationsResponse> {
  const response = await fetch(`${BASE}/notifications`, {
    method: "GET",
    headers: jsonHeaders(),
  });
  return (await readJsonOrThrow(response)) as BrandNotificationsResponse;
}

export async function updateBrandNotifications(
  payload: UpdateBrandNotificationsPayload,
): Promise<BrandNotificationsResponse> {
  const response = await fetch(`${BASE}/notifications`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return (await readJsonOrThrow(response)) as BrandNotificationsResponse;
}

export async function inviteBrandTeamMember(
  payload: InviteTeamMemberPayload,
): Promise<TeamInvitationDispatch> {
  const response = await fetch(`${BASE}/team/invite`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const result = (await readJsonOrThrow(response)) as TeamInvitationDispatch;
  if (result?.delivery_status !== "DISPATCHED")
    throw new Error(
      "Invitation dispatch was not confirmed. Refresh the team list before trying again.",
    );
  return result;
}

export async function updateBrandTeamRole(
  payload: UpdateTeamRolePayload,
): Promise<unknown> {
  const response = await fetch(`${BASE}/team/role`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return readJsonOrThrow(response);
}

export async function revokeBrandTeamMember(
  membershipId: string,
): Promise<unknown> {
  const response = await fetch(
    `${BASE}/team/${encodeURIComponent(membershipId)}`,
    {
      method: "DELETE",
      headers: jsonHeaders(),
    },
  );
  return readJsonOrThrow(response);
}

export async function cancelBrandTeamInvitation(
  invitationId: string,
): Promise<unknown> {
  const response = await fetch(
    `${BASE}/team/invitations/${encodeURIComponent(invitationId)}`,
    {
      method: "DELETE",
      headers: jsonHeaders(),
    },
  );
  return readJsonOrThrow(response);
}
