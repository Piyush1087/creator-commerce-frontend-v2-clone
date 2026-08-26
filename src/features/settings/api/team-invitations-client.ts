import { env } from "../../../shared/config/env";
import {
  isAuthTokenResponse,
  type AuthTokenResponseBody,
} from "../../auth/contracts/auth.contracts";
import type { TeamInvitationPresentation } from "../contracts/brand-settings.contracts";

export class TeamInvitationError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

async function post(
  action: string,
  body: { token: string; password?: string },
): Promise<unknown> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand/team-invitations/${action}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      referrerPolicy: "no-referrer",
    },
  );
  const value: unknown = await response.json();
  if (!response.ok) {
    const error = value as { message?: unknown; code?: unknown };
    throw new TeamInvitationError(
      typeof error?.message === "string"
        ? error.message
        : "Invitation request failed. Please try again.",
      typeof error?.code === "string" ? error.code : "INVITATION_FAILED",
    );
  }
  return value;
}

export async function inspectTeamInvitation(
  token: string,
): Promise<TeamInvitationPresentation> {
  const value = (await post("inspect", {
    token,
  })) as TeamInvitationPresentation;
  if (
    !value ||
    typeof value.brand_name !== "string" ||
    typeof value.email !== "string" ||
    !["BRAND_OWNER", "FINANCE_ADMIN", "CAMPAIGN_MANAGER"].includes(
      value.role,
    ) ||
    typeof value.requires_account_bootstrap !== "boolean" ||
    !Number.isFinite(Date.parse(value.expires_at))
  )
    throw new Error("Invalid invitation response.");
  return value;
}

export async function acceptTeamInvitation(
  token: string,
  password?: string,
): Promise<AuthTokenResponseBody> {
  const value = await post("accept", {
    token,
    ...(password ? { password } : {}),
  });
  if (!isAuthTokenResponse(value) || value.user.role !== "BRAND")
    throw new Error(
      "The invitation was accepted but the session was unavailable. Please sign in.",
    );
  return value;
}
