import { env } from "../../../shared/config/env";
import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import type { CampaignShellResponse } from "../contracts/brand-uce.contracts";
import type { CanonicalCampaignWizardPayload } from "../schemas/canonical-campaign-wizard-schema";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;
const BASE = `${env.apiUrl}/api/v1/brand-uce`;

function authHeaders(): Record<string, string> {
  return { ...JSON_HEADERS };
}

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = text.length ? JSON.parse(text) : undefined;
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
    throw new CanonicalDraftRequestError(message, response.status);
  }
  return body;
}

export class CanonicalDraftRequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "CanonicalDraftRequestError";
  }
}

export type CanonicalReadinessObjective =
  | "PULSE"
  | "PROOF"
  | "PRODUCTION"
  | "PUSH";
export type CanonicalReadinessCurrency = "INR" | "USD";

export type CanonicalCampaignReadinessResponse =
  | {
      campaignId: string;
      objective: null;
      status: "NOT_READY";
      reason: "OBJECTIVE_REQUIRED";
    }
  | {
      campaignId: string;
      objective: CanonicalReadinessObjective;
      status: "READY";
      currency: CanonicalReadinessCurrency;
      primaryKpi: string;
      supportingKpis: string[];
      revision: string;
    }
  | {
      campaignId: string;
      objective: CanonicalReadinessObjective;
      status: "FAILED";
      reason: "SUPPORTING_KPI_CONFIGURATION_UNAVAILABLE";
      retryable: false;
      revision: string;
    };

export type CanonicalCampaignDraftPath =
  | "strategy.campaign_name"
  | "strategy.publishing_schedule"
  | "strategy.publish_from"
  | "strategy.publish_until"
  | "strategy.core_objective"
  | "strategy.campaign_visibility"
  | "targeting.creator_archetypes"
  | "targeting.minimum_followers"
  | "targeting.maximum_followers"
  | "targeting.audience_age_min"
  | "targeting.audience_age_max"
  | "targeting.audience_gender"
  | "targeting.audience_affinity_ids"
  | "targeting.audience_geographies"
  | "commercials.receives_brand_support"
  | "commercials.brand_support_type"
  | "commercials.brand_support_estimated_value"
  | "commercials.compensation_model"
  | "commercials.commercial_offer"
  | "commercials.total_campaign_budget"
  | "commercials.advance_payment_percentage"
  | "commercials.payout_terms";

export type CanonicalDraftEnvelope = {
  campaignId: string;
  status: "DRAFT";
  creationSource: "MANUAL";
  draft?: {
    strategy?: Record<string, unknown>;
    targeting?: Record<string, unknown>;
    commercials?: Record<string, unknown>;
  };
};

export async function createCanonicalCampaignDraft(): Promise<CanonicalDraftEnvelope> {
  const response = await fetch(`${BASE}/campaigns/canonical-drafts`, {
    method: "POST",
    headers: authHeaders(),
  });
  return (await readJsonOrThrow(response)) as CanonicalDraftEnvelope;
}

export async function fetchCanonicalCampaignDraft(
  campaignId: string,
): Promise<CanonicalDraftEnvelope> {
  const response = await fetch(
    `${BASE}/campaigns/canonical-drafts/${encodeURIComponent(campaignId)}`,
    { method: "GET", headers: authHeaders() },
  );
  return (await readJsonOrThrow(response)) as CanonicalDraftEnvelope;
}

export async function fetchCanonicalCampaignReadiness(
  campaignId: string,
): Promise<CanonicalCampaignReadinessResponse> {
  let response: Response;
  try {
    response = await fetch(
      `${BASE}/campaigns/canonical-drafts/${encodeURIComponent(campaignId)}/readiness`,
      { method: "GET", headers: authHeaders() },
    );
  } catch {
    throw new CanonicalDraftRequestError(
      "Campaign readiness is temporarily unavailable.",
      null,
    );
  }
  return (await readJsonOrThrow(
    response,
  )) as CanonicalCampaignReadinessResponse;
}

export async function autosaveCanonicalCampaignField(
  campaignId: string,
  path: CanonicalCampaignDraftPath,
  value: unknown,
): Promise<{ campaignId: string; savedPath: string; savedAt: string }> {
  const response = await fetch(
    `${BASE}/campaigns/canonical-drafts/${encodeURIComponent(campaignId)}/field`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ path, value }),
    },
  );
  return (await readJsonOrThrow(response)) as {
    campaignId: string;
    savedPath: string;
    savedAt: string;
  };
}

export async function publishCanonicalCampaignDraft(
  campaignId: string,
  payload: CanonicalCampaignWizardPayload,
): Promise<CampaignShellResponse> {
  const response = await fetch(
    `${BASE}/campaigns/canonical-drafts/${encodeURIComponent(campaignId)}/publish`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    },
  );
  return (await readJsonOrThrow(response)) as CampaignShellResponse;
}
