import type { z } from "zod";
import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import * as dto from "../contracts/c03.contracts";
import { invalidateCampaignScopes, type CampaignScope } from "./c03-scope";
import { reasonCopy } from "../utils/c03-reasons";

export class CampaignError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null = null,
    readonly uncertain = false,
  ) {
    super("Campaign request could not be completed.");
  }
}
function errorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  return typeof value.code === "string" &&
    Object.prototype.hasOwnProperty.call(reasonCopy, value.code)
    ? value.code
    : errorCode(value.message);
}
export async function request<T>(
  scope: CampaignScope,
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<T> {
  scope.begin();
  try {
    return await readRequest(scope, path, schema, init);
  } finally {
    scope.end();
  }
}
async function readRequest<T>(
  scope: CampaignScope,
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit,
): Promise<T> {
  scope.assertCurrent();
  let response: Response;
  try {
    const options = {
      ...init,
      signal: scope.signal,
      cache: "no-store" as const,
      credentials: "include" as const,
    };
    response = await authenticatedFetch(`${env.apiUrl}/api/v1${path}`, options);
  } catch (error) {
    scope.assertCurrent();
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new CampaignError(0, null, true);
  }
  scope.assertCurrent();
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CampaignError(response.status, null, init.method === "POST");
  }
  scope.assertCurrent();
  if (!response.ok) {
    const code = errorCode(body);
    if (
      response.status === 401 ||
      response.status === 403 ||
      code?.startsWith("CREATOR_") ||
      code?.startsWith("INVITATION_")
    )
      invalidateCampaignScopes();
    throw new CampaignError(response.status, code, response.status >= 500);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new CampaignError(502, null, init.method === "POST");
  return parsed.data;
}
const id = (value: string) => dto.idSchema.parse(value);
const cursor = (value?: string | null) =>
  value ? `?cursor=${encodeURIComponent(value)}` : "";
export const fetchOpportunity = (s: CampaignScope, campaignId: string) =>
  request(
    s,
    `/campaign-opportunities/${id(campaignId)}`,
    dto.opportunitySchema,
  );
export const fetchOpportunities = (s: CampaignScope, c?: string | null) =>
  request(
    s,
    `/creator/campaigns/opportunities${cursor(c)}`,
    dto.opportunityListSchema,
  );
export const fetchApplications = (s: CampaignScope, c?: string | null) =>
  request(s, `/creator/applications${cursor(c)}`, dto.applicationListSchema);
export const fetchApplication = (s: CampaignScope, applicationId: string) =>
  request(
    s,
    `/creator/applications/${id(applicationId)}`,
    dto.applicationDetailSchema,
  );
export const fetchNotifications = (s: CampaignScope) =>
  request(s, "/creator/notifications", dto.notificationsSchema);
export const fetchUnread = (s: CampaignScope) =>
  request(s, "/creator/notifications/unread-count", dto.unreadSchema);
export const markRead = (s: CampaignScope, notificationId: string) =>
  request(
    s,
    `/creator/notifications/${id(notificationId)}/read`,
    dto.readSchema,
    { method: "PATCH" },
  );
export const markAllRead = (s: CampaignScope) =>
  request(s, "/creator/notifications/mark-all-read", dto.allReadSchema, {
    method: "POST",
  });
export function commandKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (n) => n.toString(16).padStart(2, "0")).join("");
}
export const submitApplication = (
  s: CampaignScope,
  campaignId: string,
  assetId: string,
  briefId: string,
  key: string,
) =>
  request(
    s,
    `/creator/campaigns/${id(campaignId)}/applications`,
    dto.receiptSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({
        campaignAssetId: id(assetId),
        briefId: id(briefId),
      }),
    },
  );
export const withdrawApplication = (
  s: CampaignScope,
  applicationId: string,
  key: string,
) =>
  request(
    s,
    `/creator/applications/${id(applicationId)}/withdraw`,
    dto.receiptSchema,
    { method: "POST", headers: { "Idempotency-Key": key } },
  );
export const continueApplication = (
  s: CampaignScope,
  campaignId: string,
  invitationCredential?: string,
) =>
  request(
    s,
    `/campaign-opportunities/${id(campaignId)}/apply-continuation`,
    dto.continuationSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        invitationCredential ? { invitationCredential } : {},
      ),
    },
  );
