import { env } from "../../../shared/config/env";
import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import {
  isBillingInvoiceRecord,
  isBrandSubscriptionRecord,
  isGeoContextApiResponse,
  isInvoicesApiResponse,
  isPlansApiResponse,
  isSubscriptionApiResponse,
  isUsageApiResponse,
  type BillingInvoiceRecord,
  type BrandSubscriptionRecord,
  type CatalogPlanView,
  type GeoContext,
  type SubscriptionTier,
  type UsageSnapshot,
} from "../contracts/pricing.contracts";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

export class PricingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly missingRequiredFields: string[] = [],
  ) {
    super(message);
    this.name = "PricingApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
    const rawMessage = isRecord(body) ? body.message : undefined;
    const message = Array.isArray(rawMessage)
      ? rawMessage.filter((item): item is string => typeof item === "string").join(", ")
      : typeof rawMessage === "string"
        ? rawMessage
        : `Request failed (${response.status}).`;
    const missingRequiredFields =
      isRecord(body) && Array.isArray(body.missing_required_fields)
        ? body.missing_required_fields.filter(
            (field): field is string => typeof field === "string",
          )
        : [];
    throw new PricingApiError(message, response.status, missingRequiredFields);
  }

  return body;
}

export async function fetchVisiblePlans(): Promise<CatalogPlanView[]> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/plans`, {
    method: "GET",
    headers: JSON_HEADERS,
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
    headers: JSON_HEADERS,
  });
  const json = await readJsonOrThrow(response);
  if (!isSubscriptionApiResponse(json)) {
    throw new PricingApiError("Unexpected subscription response.", response.status);
  }
  return json.subscription;
}

export async function fetchUsageSnapshot(): Promise<UsageSnapshot | null> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/usage`, {
    method: "GET",
    headers: JSON_HEADERS,
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
    headers: JSON_HEADERS,
  });
  const json = await readJsonOrThrow(response);
  if (!isInvoicesApiResponse(json)) {
    throw new PricingApiError("Unexpected invoices response.", response.status);
  }
  return json.invoices;
}

export async function fetchBillingInvoice(
  razorpayInvoiceId: string,
): Promise<BillingInvoiceRecord> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/pricing/invoices/${encodeURIComponent(razorpayInvoiceId)}`,
    { method: "GET", headers: JSON_HEADERS },
  );
  const json = await readJsonOrThrow(response);
  const invoice = isRecord(json) ? json.invoice : undefined;
  if (!isBillingInvoiceRecord(invoice)) {
    throw new PricingApiError("Unexpected invoice response.", response.status);
  }
  return invoice;
}

export async function fetchGeoContext(): Promise<GeoContext> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/geo-context`, {
    method: "GET",
    headers: JSON_HEADERS,
  });
  const json = await readJsonOrThrow(response);
  if (!isGeoContextApiResponse(json)) {
    throw new PricingApiError("Unexpected geo context response.", response.status);
  }
  return json.geoContext;
}

function requireSubscription(json: unknown, response: Response): BrandSubscriptionRecord {
  if (!isRecord(json) || !isBrandSubscriptionRecord(json.subscription)) {
    throw new PricingApiError("Unexpected subscription action response.", response.status);
  }
  return json.subscription;
}

export async function bootstrapLocalTrial(): Promise<BrandSubscriptionRecord> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/trial/bootstrap`, {
    method: "POST",
    headers: JSON_HEADERS,
  });
  const json = await readJsonOrThrow(response);
  return requireSubscription(json, response);
}

export type PricingCheckoutSession = {
  subscriptionId: string;
  razorpayKeyId: string;
  targetTier: SubscriptionTier;
};

export type PaidConversionResult = {
  subscription: BrandSubscriptionRecord;
  checkout: PricingCheckoutSession;
};

function isPricingCheckoutSession(value: unknown): value is PricingCheckoutSession {
  if (!isRecord(value)) return false;
  return (
    typeof value.subscriptionId === "string" &&
    typeof value.razorpayKeyId === "string" &&
    typeof value.targetTier === "string"
  );
}

function readCheckoutResult(json: unknown, response: Response): PaidConversionResult {
  const subscription = requireSubscription(json, response);
  const checkout = isRecord(json) ? json.checkout : undefined;
  if (!isPricingCheckoutSession(checkout)) {
    throw new PricingApiError("Checkout session was not returned.", response.status);
  }
  return { subscription, checkout };
}

export async function startPaidConversion(): Promise<PaidConversionResult> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/paid-conversion/start`, {
    method: "POST",
    headers: JSON_HEADERS,
  });
  const json = await readJsonOrThrow(response);
  return readCheckoutResult(json, response);
}

export type ReactivateSubscriptionResult = {
  subscription: BrandSubscriptionRecord;
  recovery_mode?:
    | "continuation_authorization"
    | "update_payment"
    | "trial_restored";
  payment_links?: string[];
  checkout?: PricingCheckoutSession;
};

export async function reactivateSubscription(): Promise<ReactivateSubscriptionResult> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/reactivate`, {
    method: "POST",
    headers: JSON_HEADERS,
  });
  const json = await readJsonOrThrow(response);
  const subscription = requireSubscription(json, response);
  if (!isRecord(json)) {
    throw new PricingApiError("Unexpected reactivate response.", response.status);
  }
  const recoveryMode = json.recovery_mode;
  if (
    recoveryMode !== undefined &&
    recoveryMode !== "continuation_authorization" &&
    recoveryMode !== "update_payment" &&
    recoveryMode !== "trial_restored"
  ) {
    throw new PricingApiError("Unknown reactivation response mode.", response.status);
  }
  const checkout = json.checkout;
  if (checkout !== undefined && !isPricingCheckoutSession(checkout)) {
    throw new PricingApiError("Invalid reactivation checkout session.", response.status);
  }
  const paymentLinks = Array.isArray(json.payment_links)
    ? json.payment_links.filter((link): link is string => typeof link === "string")
    : undefined;
  return {
    subscription,
    recovery_mode: recoveryMode,
    payment_links: paymentLinks,
    checkout,
  };
}

export async function cancelSubscription(): Promise<BrandSubscriptionRecord> {
  const response = await fetch(`${env.apiUrl}/api/v1/pricing/cancel`, {
    method: "POST",
    headers: JSON_HEADERS,
  });
  const json = await readJsonOrThrow(response);
  return requireSubscription(json, response);
}
