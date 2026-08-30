import type {
  BrandSubscriptionRecord,
  SubscriptionLifecycleStatus,
  SubscriptionTier,
} from "../contracts/pricing.contracts";
import { TIER_DISPLAY_NAMES } from "../constants/pricing-copy";

export const EMPTY_DISPLAY = "—";

export type LifecyclePresentation = {
  label: string;
  heading: string;
  description: string;
};

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

export function getLifecyclePresentation(
  lifecycle: SubscriptionLifecycleStatus,
  subscription?: Pick<
    BrandSubscriptionRecord,
    "trialEndsAt" | "currentPeriodEnd" | "cancelEffectiveAt" | "paymentGraceEndsAt"
  >,
): LifecyclePresentation {
  switch (lifecycle) {
    case "TRIALING":
      return {
        label: "Trialing",
        heading: "Founder’s Beta trial is active",
        description: `Full access continues through ${formatPricingDate(subscription?.trialEndsAt)}. No payment method is required during the trial.`,
      };
    case "ACTIVE":
      return {
        label: "Active",
        heading: "Founder’s Beta is active",
        description: `Full access is enabled. The current paid period ends ${formatPricingDate(subscription?.currentPeriodEnd)}.`,
      };
    case "CANCEL_SCHEDULED":
      return {
        label: "Cancellation scheduled",
        heading: "Cancellation is scheduled",
        description: `Full access continues until ${formatPricingDate(subscription?.cancelEffectiveAt)}.`,
      };
    case "PAST_DUE":
      return {
        label: "Past due",
        heading: "Payment needs attention",
        description: `Full access remains available during the payment grace period through ${formatPricingDate(subscription?.paymentGraceEndsAt)}.`,
      };
    case "TRIAL_EXPIRED":
      return {
        label: "Trial expired",
        heading: "The Founder’s Beta trial has ended",
        description: "The workspace is in restricted wind-down. Start paid conversion to restore full access.",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        heading: "The subscription is cancelled",
        description: "The workspace is in restricted wind-down. Resume Founder’s Beta to restore full access.",
      };
    case "HALTED":
      return {
        label: "Halted",
        heading: "Billing access is halted",
        description: "The payment grace period has ended and the workspace is in restricted wind-down.",
      };
  }
}

export function getBillingCycleLabel(
  subscription: BrandSubscriptionRecord | null,
): string {
  if (!subscription) return EMPTY_DISPLAY;
  return subscription.lifecycleStatus === "TRIALING"
    ? "30-day trial"
    : "Monthly recurring";
}

export function formatCommercialPrice(
  subscription: BrandSubscriptionRecord | null,
): string {
  const terms = subscription?.commercialTerms;
  if (!terms) return EMPTY_DISPLAY;
  const major = terms.amountMinor / 100;
  const price =
    terms.currency === "INR"
      ? `₹${major.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
      : `$${major.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `${price}/month${terms.currency === "INR" && terms.taxInclusive ? " (tax inclusive)" : ""}`;
}

export function formatCommissionRate(
  subscription: BrandSubscriptionRecord | null,
): string {
  const rate = subscription?.commercialTerms?.platformCommissionRate;
  return rate === undefined || rate === null
    ? EMPTY_DISPLAY
    : `${Math.round(rate * 100)}% platform commission`;
}

export function getTierDisplayName(
  tier: SubscriptionTier | null | undefined,
): string {
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
  if (subscription.lifecycleStatus === "TRIALING") {
    return formatPricingDate(subscription.trialEndsAt);
  }
  if (subscription.lifecycleStatus === "CANCEL_SCHEDULED") {
    return formatPricingDate(subscription.cancelEffectiveAt);
  }
  return formatPricingDate(subscription.currentPeriodEnd);
}

export function getRenewalLabel(subscription: BrandSubscriptionRecord | null): string {
  if (!subscription) return "Next renewal";
  if (subscription.lifecycleStatus === "TRIALING") return "Trial ends";
  if (subscription.lifecycleStatus === "CANCEL_SCHEDULED") return "Access until";
  return "Current period ends";
}

export function getTrialDaysRemaining(
  subscription: BrandSubscriptionRecord | null,
): number | null {
  if (
    !subscription ||
    subscription.lifecycleStatus !== "TRIALING" ||
    !subscription.trialEndsAt
  ) {
    return null;
  }
  const end = new Date(subscription.trialEndsAt);
  if (Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000));
}
