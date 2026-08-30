import { env } from "../../../shared/config/env";
import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import {
  isGeoContextApiResponse,
  isPlansApiResponse,
  isSubscriptionApiResponse,
  isUsageApiResponse,
  isInvoicesApiResponse,
  type BillingInvoiceRecord,
  type BrandSubscriptionRecord,
  type CatalogPlanView,
  type GeoContext,
  type SubscriptionCurrency,
  type SubscriptionTier,
  type UsageSnapshot,
} from "../contracts/pricing.contracts";

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

export class PricingApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PricingApiError";
    this.status = status;
  }
}

function authHeaders(): Record<string, string> {
  return {
    ...JSON_HEADERS,
  };
}

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new PricingApiError(
      "The server returned an invalid response. Please try again.",
      response.status,
    );
  }

  if (!response.ok) {
    const rawMessage =
      typeof body === "object" && body !== null
        ? (body as { message?: unknown }).message
        : undefined;
    const message = Array.isArray(rawMessage)
      ? rawMessage
          .filter((item): item is string => typeof item === "string")
          .join(", ")
      : typeof rawMessage === "string"
        ? rawMessage
        : `Request failed (${response.status}).`;
    throw new PricingApiError(message, response.status);
  }

  return body;
}

export async function fetchVisiblePlans(): Promise<CatalogPlanView[]> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/plans`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isPlansApiResponse(json)) {
    throw new PricingApiError("Unexpected plans response.", response.status);
  }
  return json.plans;
}

export async function fetchSubscription(): Promise<BrandSubscriptionRecord | null> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/subscription`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isSubscriptionApiResponse(json)) {
    throw new PricingApiError(
      "Unexpected subscription response.",
      response.status,
    );
  }
  return json.subscription;
}

export async function fetchUsageSnapshot(): Promise<UsageSnapshot | null> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/usage`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isUsageApiResponse(json)) {
    throw new PricingApiError("Unexpected usage response.", response.status);
  }
  return json.usage;
}

export async function fetchBillingInvoices(): Promise<BillingInvoiceRecord[]> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/invoices`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isInvoicesApiResponse(json)) {
    throw new PricingApiError("Unexpected invoices response.", response.status);
  }
  return json.invoices;
}

export async function fetchGeoContext(): Promise<GeoContext> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/geo-context`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isGeoContextApiResponse(json)) {
    throw new PricingApiError(
      "Unexpected geo context response.",
      response.status,
    );
  }
  return json.geoContext;
}

export async function initializeRazorpayTrial(
  currency?: SubscriptionCurrency,
): Promise<BrandSubscriptionRecord> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/trial/razorpay`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(currency ? { currency } : {}),
  });
  const json = await readJsonOrThrow(response);
  if (
    !(
      typeof json === "object" &&
      json !== null &&
      "subscription" in json &&
      isSubscriptionApiResponse({
        subscription: (json as { subscription: unknown }).subscription,
      })
    )
  ) {
    throw new PricingApiError(
      "Unexpected Razorpay trial response.",
      response.status,
    );
  }
  const subscription = (json as { subscription: BrandSubscriptionRecord })
    .subscription;
  if (!subscription) {
    throw new PricingApiError(
      "Razorpay trial did not return a subscription.",
      response.status,
    );
  }
  return subscription;
}

export async function bootstrapLocalTrial(
  currency?: SubscriptionCurrency,
): Promise<BrandSubscriptionRecord> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/trial/bootstrap`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(currency ? { currency } : {}),
  });
  const json = await readJsonOrThrow(response);
  if (
    !(
      typeof json === "object" &&
      json !== null &&
      "subscription" in json &&
      isSubscriptionApiResponse({
        subscription: (json as { subscription: unknown }).subscription,
      })
    )
  ) {
    throw new PricingApiError(
      "Unexpected trial bootstrap response.",
      response.status,
    );
  }
  const subscription = (json as { subscription: BrandSubscriptionRecord })
    .subscription;
  if (!subscription) {
    throw new PricingApiError(
      "Trial bootstrap did not return a subscription.",
      response.status,
    );
  }
  return subscription;
}

export type PricingCheckoutSession = {
  subscriptionId: string;
  razorpayKeyId: string;
  targetTier: SubscriptionTier;
};

export type TierChangeResult = {
  subscription: BrandSubscriptionRecord;
  checkout: PricingCheckoutSession | null;
};

function isPricingCheckoutSession(
  value: unknown,
): value is PricingCheckoutSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.subscriptionId === "string" &&
    typeof record.razorpayKeyId === "string" &&
    typeof record.targetTier === "string"
  );
}

export async function changeSubscriptionTier(
  targetTier: SubscriptionTier,
): Promise<TierChangeResult> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/tier/change`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ target_tier: targetTier }),
  });
  const json = await readJsonOrThrow(response);
  if (!(typeof json === "object" && json !== null && "subscription" in json)) {
    throw new PricingApiError(
      "Unexpected tier change response.",
      response.status,
    );
  }
  const payload = json as { subscription: unknown; checkout?: unknown };
  if (!payload.subscription || typeof payload.subscription !== "object") {
    throw new PricingApiError(
      "Tier change did not return a subscription.",
      response.status,
    );
  }
  const checkout =
    payload.checkout === null || payload.checkout === undefined
      ? null
      : isPricingCheckoutSession(payload.checkout)
        ? payload.checkout
        : null;
  if (payload.checkout != null && checkout === null) {
    throw new PricingApiError(
      "Tier change returned an invalid checkout session.",
      response.status,
    );
  }
  return {
    subscription: payload.subscription as BrandSubscriptionRecord,
    checkout,
  };
}

export type ReactivateSubscriptionResult = {
  subscription: BrandSubscriptionRecord;
  recovery_mode:
    | "resume_submitted"
    | "new_subscription"
    | "update_payment"
    | "trial_restored";
  payment_links?: string[];
};

export async function restoreFoundersTrial(): Promise<BrandSubscriptionRecord> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/trial/restore`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({}),
  });
  const json = await readJsonOrThrow(response);
  if (!(typeof json === "object" && json !== null && "subscription" in json)) {
    throw new PricingApiError(
      "Unexpected trial restore response.",
      response.status,
    );
  }
  const subscription = (json as { subscription: unknown }).subscription;
  if (!subscription || typeof subscription !== "object") {
    throw new PricingApiError(
      "Trial restore did not return a subscription.",
      response.status,
    );
  }
  return subscription as BrandSubscriptionRecord;
}

export async function reactivateSubscription(): Promise<ReactivateSubscriptionResult> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/reactivate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({}),
  });
  const json = await readJsonOrThrow(response);
  if (!(typeof json === "object" && json !== null && "subscription" in json)) {
    throw new PricingApiError(
      "Unexpected reactivate response.",
      response.status,
    );
  }
  const payload = json as ReactivateSubscriptionResult;
  if (!payload.subscription || typeof payload.subscription !== "object") {
    throw new PricingApiError(
      "Reactivate did not return a subscription.",
      response.status,
    );
  }
  return payload;
}

export async function cancelSubscription(
  cancelAtCycleEnd = false,
): Promise<BrandSubscriptionRecord> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/cancel`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ cancel_at_cycle_end: cancelAtCycleEnd }),
  });
  const json = await readJsonOrThrow(response);
  if (!(typeof json === "object" && json !== null && "subscription" in json)) {
    throw new PricingApiError("Unexpected cancel response.", response.status);
  }
  const subscription = (json as { subscription: unknown }).subscription;
  if (!subscription || typeof subscription !== "object") {
    throw new PricingApiError(
      "Cancel did not return a subscription.",
      response.status,
    );
  }
  return subscription as BrandSubscriptionRecord;
}
