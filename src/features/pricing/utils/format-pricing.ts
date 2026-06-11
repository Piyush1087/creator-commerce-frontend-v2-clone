import type {
  BrandSubscriptionRecord,
  SubscriptionStatus,
  SubscriptionTier,
} from "../contracts/pricing.contracts";
import {
  TIER_DISPLAY_NAMES,
  TIER_MONTHLY_PRICE_LABEL,
  TIER_TAKE_RATES,
} from "../constants/pricing-copy";

export const EMPTY_DISPLAY = "—";

export function formatPricingDate(value: string | null | undefined): string {
  if (!value) return EMPTY_DISPLAY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_DISPLAY;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCurrencyLabel(currency: string | null | undefined): string {
  if (!currency) return EMPTY_DISPLAY;
  if (currency === "INR") return "INR (₹)";
  if (currency === "USD") return "USD ($)";
  return currency;
}

export function formatStatusLabel(status: SubscriptionStatus | null | undefined): string {
  if (!status) return EMPTY_DISPLAY;
  return status.replace(/_/g, " ");
}

export function getStatusDescription(
  status: SubscriptionStatus | null | undefined,
): string {
  switch (status) {
    case "TRIALING":
      return "Active No-Card Preview Node";
    case "ACTIVE":
      return "Recurring billing active";
    case "PAST_DUE":
      return "Payment failed — read-only mode";
    case "HALTED":
      return "Workspace automation frozen";
    case "CANCELED":
      return "Subscription canceled";
    default:
      return EMPTY_DISPLAY;
  }
}

export function getBillingCycleLabel(
  subscription: BrandSubscriptionRecord | null,
): string {
  if (!subscription) return EMPTY_DISPLAY;
  if (subscription.status === "TRIALING") {
    return "30-Day Free Window";
  }
  return "Monthly recurring";
}

export function getPostTrialLabel(tier: SubscriptionTier | null | undefined): string {
  if (!tier) return EMPTY_DISPLAY;
  const price = TIER_MONTHLY_PRICE_LABEL[tier];
  const takeRate = Math.round(TIER_TAKE_RATES[tier] * 100);
  if (tier === "ENTERPRISE") {
    return "Custom rate + negotiated collaboration fee";
  }
  return `Then ${price} + ${takeRate}% Collaboration Fee`;
}

export function getTierDisplayName(tier: SubscriptionTier | null | undefined): string {
  if (!tier) return EMPTY_DISPLAY;
  return TIER_DISPLAY_NAMES[tier];
}

export function formatInvoiceAmount(
  amountInMinorUnits: number,
  currency: string,
): string {
  const major = amountInMinorUnits / 100;
  if (currency === "INR") {
    return `₹${major.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === "USD") {
    return `$${major.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${major.toFixed(2)} ${currency}`;
}

export function getRenewalDate(subscription: BrandSubscriptionRecord | null): string {
  if (!subscription) return EMPTY_DISPLAY;
  if (subscription.status === "TRIALING" && subscription.trialEndsAt) {
    return formatPricingDate(subscription.trialEndsAt);
  }
  return formatPricingDate(subscription.currentPeriodEnd);
}

export function getRenewalLabel(
  subscription: BrandSubscriptionRecord | null,
): string {
  if (!subscription) return "Next renewal";
  if (subscription.status === "TRIALING") {
    return "Trial ends";
  }
  return "Next renewal";
}

export function getTrialDaysRemaining(
  subscription: BrandSubscriptionRecord | null,
): number | null {
  if (!subscription || subscription.status !== "TRIALING" || !subscription.trialEndsAt) {
    return null;
  }
  const end = new Date(subscription.trialEndsAt);
  if (Number.isNaN(end.getTime())) return null;
  const diffMs = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatTakeRateLabel(tier: SubscriptionTier | null | undefined): string {
  if (!tier) return EMPTY_DISPLAY;
  if (tier === "ENTERPRISE") return "Custom collaboration fee";
  const pct = Math.round(TIER_TAKE_RATES[tier] * 100);
  return `${pct}% collaboration fee on escrow locks`;
}
