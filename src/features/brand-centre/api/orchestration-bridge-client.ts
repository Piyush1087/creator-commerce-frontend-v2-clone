import { env } from "../../../shared/config/env";
import { authAuthorizationHeader } from "../../../shared/auth/auth-session";

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

function authHeaders(): Record<string, string> {
  return {
    ...JSON_HEADERS,
    ...authAuthorizationHeader(),
  };
}

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

export type BridgeLaunchPayload = {
  signal_type: "LAUNCH_NEW_FRAMEWORK";
  brand_id: string;
  campaign_name: string;
  industry_sector: "D2C_ECOMMERCE" | "HEALTHCARE" | "AI_SAAS" | "OFFLINE_EXPERIENCES";
  assigned_macro_objective: "PRODUCTION" | "PULSE" | "PROOF_PUSH";
  raw_budget_expression: string;
  timeline_expression: string;
};

export type BridgeInjectPayload = {
  signal_type: "INJECT_ASSET_LINE";
  campaign_id: string;
  product_name: string;
  estimated_base_price: number;
  raw_strategic_context: string;
  creative_briefs: Array<{
    brief_name: string;
    deliverable_type: "REEL_VIDEO" | "TIKTOK_POST" | "YOUTUBE_SHORTS" | "IG_STORIES" | "UGC_RAW_ASSET";
    compensation_type: "FIXED_FEE" | "BARTER" | "REVENUE_SHARE" | "HYBRID_MILESTONE";
  }>;
};

export type BridgeInterruptPayload = {
  signal_type: "FAST_TRACK_INTERRUPT";
  campaign_id: string;
  target_entity_type: "PRODUCT" | "BRIEF";
  target_entity_uuid: string;
};

export type BridgeProcessSignalPayload =
  | BridgeLaunchPayload
  | BridgeInjectPayload
  | BridgeInterruptPayload;

export type BridgeProcessSignalResponse = {
  success: true;
  bridge_tracking_id: string;
  message: string;
  campaign_id?: string;
};

export async function postBridgeProcessSignal(
  payload: BridgeProcessSignalPayload,
): Promise<BridgeProcessSignalResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/orchestration/process-signal`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return (await readJsonOrThrow(response)) as BridgeProcessSignalResponse;
}

