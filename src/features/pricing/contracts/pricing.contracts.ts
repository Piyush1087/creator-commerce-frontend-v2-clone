export const SUBSCRIPTION_TIERS = [
  "FOUNDERS_BETA",
  "GROWTH_STARTER",
  "PROFESSIONAL",
  "ENTERPRISE",
] as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export const SUBSCRIPTION_STATUSES = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "HALTED",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_CURRENCIES = ["INR", "USD"] as const;

export type SubscriptionCurrency = (typeof SUBSCRIPTION_CURRENCIES)[number];

export type CatalogPlanView = {
  tierKey: string;
  name: string;
  priceDescriptor: string;
  isPubliclyAvailable: boolean;
};

export type FeatureUsageRecord = {
  featureKey: string;
  currentUsageCount: number;
  limit: number | null;
  resetAt: string | null;
};

export type UsageSnapshot = {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  limits: Record<string, number>;
  usages: FeatureUsageRecord[];
};

export type BrandSubscriptionRecord = {
  id: string;
  brandProfileId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currency: SubscriptionCurrency;
  razorpayCustomerId: string | null;
  razorpaySubscriptionId: string | null;
  razorpayPlanId: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
  featureUsages?: FeatureUsageRecord[];
};

export type GeoContext = {
  zone: "ZONE_IN" | "ZONE_US" | "ZONE_ROW";
  currency: "INR" | "USD";
  complianceWarning?: string;
};

export type BillingInvoiceRecord = {
  id: string;
  razorpayInvoiceId: string;
  razorpayPaymentId: string | null;
  status: string;
  amount: number;
  amountPaid: number;
  currency: string;
  invoiceNumber: string | null;
  shortUrl: string | null;
  paidAt: string | null;
  issuedAt: string | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  lineItems: Array<{
    name: string;
    amount: number;
    currency: string;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export function isCatalogPlanView(value: unknown): value is CatalogPlanView {
  if (!isRecord(value)) return false;
  return (
    isString(value.tierKey) &&
    isString(value.name) &&
    isString(value.priceDescriptor) &&
    typeof value.isPubliclyAvailable === "boolean"
  );
}

export function isBrandSubscriptionRecord(
  value: unknown,
): value is BrandSubscriptionRecord {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.brandProfileId) &&
    isString(value.tier) &&
    isString(value.status) &&
    isString(value.currency) &&
    isNullableString(value.razorpayCustomerId) &&
    isNullableString(value.razorpaySubscriptionId) &&
    isNullableString(value.razorpayPlanId) &&
    isNullableString(value.trialEndsAt) &&
    isString(value.currentPeriodStart) &&
    isString(value.currentPeriodEnd)
  );
}

export function isUsageSnapshot(value: unknown): value is UsageSnapshot {
  if (!isRecord(value)) return false;
  return isString(value.tier) && isString(value.status) && isRecord(value.limits);
}

export function isGeoContext(value: unknown): value is GeoContext {
  if (!isRecord(value)) return false;
  return isString(value.zone) && (value.currency === "INR" || value.currency === "USD");
}

export function isPlansApiResponse(
  value: unknown,
): value is { plans: CatalogPlanView[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.plans) &&
    value.plans.every(isCatalogPlanView)
  );
}

export function isSubscriptionApiResponse(
  value: unknown,
): value is { subscription: BrandSubscriptionRecord | null } {
  if (!isRecord(value)) return false;
  return value.subscription === null || isBrandSubscriptionRecord(value.subscription);
}

export function isUsageApiResponse(
  value: unknown,
): value is { usage: UsageSnapshot | null } {
  if (!isRecord(value)) return false;
  return value.usage === null || isUsageSnapshot(value.usage);
}

export function isGeoContextApiResponse(
  value: unknown,
): value is { geoContext: GeoContext } {
  return isRecord(value) && isGeoContext(value.geoContext);
}

export function isBillingInvoiceRecord(value: unknown): value is BillingInvoiceRecord {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.razorpayInvoiceId) &&
    isString(value.status) &&
    isNumber(value.amount) &&
    isNumber(value.amountPaid) &&
    isString(value.currency) &&
    Array.isArray(value.lineItems)
  );
}

export function isInvoicesApiResponse(
  value: unknown,
): value is { invoices: BillingInvoiceRecord[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.invoices) &&
    value.invoices.every(isBillingInvoiceRecord)
  );
}

export function isFeatureUsageRecord(value: unknown): value is FeatureUsageRecord {
  if (!isRecord(value)) return false;
  return (
    isString(value.featureKey) &&
    isNumber(value.currentUsageCount) &&
    (value.limit === null || isNumber(value.limit))
  );
}
