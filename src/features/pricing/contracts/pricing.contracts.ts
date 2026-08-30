export const SUBSCRIPTION_TIERS = [
  "FOUNDERS_BETA",
  "GROWTH_STARTER",
  "PROFESSIONAL",
  "ENTERPRISE",
] as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export type SubscriptionStatus =
  | "TRIALING"
  | "TRIAL_EXPIRED"
  | "ACTIVE"
  | "CANCEL_SCHEDULED"
  | "CANCELED"
  | "PAST_DUE"
  | "HALTED";

export type SubscriptionLifecycleStatus =
  | "TRIALING"
  | "TRIAL_EXPIRED"
  | "ACTIVE"
  | "CANCEL_SCHEDULED"
  | "CANCELLED"
  | "PAST_DUE"
  | "HALTED";

export type SubscriptionAccessMode = "FULL_ACCESS" | "RESTRICTED_WIND_DOWN";

export type SubscriptionRequiredAction =
  | "NONE"
  | "PAYMENT_REQUIRED"
  | "UPDATE_PAYMENT_METHOD";

export type SubscriptionCurrency = "INR" | "USD";

export type CatalogPlanView = {
  tierKey: SubscriptionTier;
  name: string;
  priceDescriptor: string;
  isPubliclyAvailable: boolean;
  availability: "PURCHASABLE" | "UPCOMING";
  isPurchasable: boolean;
  currency: SubscriptionCurrency | null;
  amountMinor: number | null;
  billingInterval: "MONTH" | null;
  trialDays: number | null;
  platformCommissionRate: number | null;
  taxInclusive: boolean | null;
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

export type SubscriptionCommercialTerms = {
  amountMinor: number;
  currency: SubscriptionCurrency;
  billingInterval: "MONTH";
  trialDays: number;
  platformCommissionRate: number;
  taxInclusive: boolean;
};

export type BrandSubscriptionRecord = {
  id: string;
  brandProfileId: string;
  tier: SubscriptionTier;
  plan: SubscriptionTier;
  status: SubscriptionStatus;
  currency: SubscriptionCurrency;
  razorpayCustomerId: string | null;
  razorpaySubscriptionId: string | null;
  razorpayPlanId: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelEffectiveAt: string | null;
  paymentGraceEndsAt: string | null;
  lifecycleStatus: SubscriptionLifecycleStatus;
  accessMode: SubscriptionAccessMode;
  requiredAction: SubscriptionRequiredAction;
  commercialTerms: SubscriptionCommercialTerms | null;
  createdAt: string;
  updatedAt: string;
  featureUsages?: FeatureUsageRecord[];
};

export type GeoContext = {
  zone: "ZONE_IN" | "ZONE_US" | "ZONE_ROW";
  currency: SubscriptionCurrency;
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
  billingIdentity: {
    legalEntityName: string;
    legalEntityType: string | null;
    billingCountryCode: string | null;
    billingAddress: string;
    gstin: string | null;
  } | null;
  historicalBillingIdentityAvailable: boolean;
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

function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return SUBSCRIPTION_TIERS.includes(value as SubscriptionTier);
}

function isCommercialTerms(value: unknown): value is SubscriptionCommercialTerms {
  if (!isRecord(value)) return false;
  return (
    isNumber(value.amountMinor) &&
    (value.currency === "INR" || value.currency === "USD") &&
    value.billingInterval === "MONTH" &&
    isNumber(value.trialDays) &&
    isNumber(value.platformCommissionRate) &&
    typeof value.taxInclusive === "boolean"
  );
}

export function isCatalogPlanView(value: unknown): value is CatalogPlanView {
  if (!isRecord(value)) return false;
  return (
    isSubscriptionTier(value.tierKey) &&
    isString(value.name) &&
    isString(value.priceDescriptor) &&
    typeof value.isPubliclyAvailable === "boolean" &&
    (value.availability === "PURCHASABLE" || value.availability === "UPCOMING") &&
    typeof value.isPurchasable === "boolean" &&
    (value.currency === null || value.currency === "INR" || value.currency === "USD") &&
    (value.amountMinor === null || isNumber(value.amountMinor)) &&
    (value.billingInterval === null || value.billingInterval === "MONTH") &&
    (value.trialDays === null || isNumber(value.trialDays)) &&
    (value.platformCommissionRate === null || isNumber(value.platformCommissionRate)) &&
    (value.taxInclusive === null || typeof value.taxInclusive === "boolean")
  );
}

export function isBrandSubscriptionRecord(
  value: unknown,
): value is BrandSubscriptionRecord {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.brandProfileId) &&
    isSubscriptionTier(value.tier) &&
    isSubscriptionTier(value.plan) &&
    isString(value.status) &&
    (value.currency === "INR" || value.currency === "USD") &&
    isNullableString(value.razorpayCustomerId) &&
    isNullableString(value.razorpaySubscriptionId) &&
    isNullableString(value.razorpayPlanId) &&
    isNullableString(value.trialEndsAt) &&
    isString(value.currentPeriodStart) &&
    isString(value.currentPeriodEnd) &&
    isNullableString(value.cancelEffectiveAt) &&
    isNullableString(value.paymentGraceEndsAt) &&
    isString(value.lifecycleStatus) &&
    (value.accessMode === "FULL_ACCESS" || value.accessMode === "RESTRICTED_WIND_DOWN") &&
    isString(value.requiredAction) &&
    (value.commercialTerms === null || isCommercialTerms(value.commercialTerms))
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
  return isRecord(value) && Array.isArray(value.plans) && value.plans.every(isCatalogPlanView);
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
  return isRecord(value) && Array.isArray(value.invoices) && value.invoices.every(isBillingInvoiceRecord);
}

export function isFeatureUsageRecord(value: unknown): value is FeatureUsageRecord {
  if (!isRecord(value)) return false;
  return (
    isString(value.featureKey) &&
    isNumber(value.currentUsageCount) &&
    (value.limit === null || isNumber(value.limit))
  );
}
