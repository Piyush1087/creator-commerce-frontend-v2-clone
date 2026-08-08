import { env } from "../../../shared/config/env";
import {
  isIdentityTestDryRunResponse,
  type IdentityTestDryRunResponse,
} from "../contracts/identity-test.contracts";

export class IdentityTestApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "IdentityTestApiError";
    this.status = status;
    this.body = body;
  }
}

export async function runIdentityTestDryRun(args: {
  websiteUrl: string;
  entityId?: string;
}): Promise<IdentityTestDryRunResponse> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/brand-intelligence/identity-test`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        websiteUrl: args.websiteUrl,
        ...(args.entityId ? { entityId: args.entityId } : {}),
      }),
    },
  );

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (isRecord(body) && typeof body.message === "string" && body.message) ||
      (isRecord(body) && typeof body.error === "string" && body.error) ||
      `Identity test failed (${response.status})`;
    throw new IdentityTestApiError(response.status, message, body);
  }

  if (!isIdentityTestDryRunResponse(body)) {
    throw new IdentityTestApiError(
      response.status,
      "Identity test returned an unexpected response shape",
      body,
    );
  }

  return body;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
