import type {
  BrandPayoutsActivity,
  BrandPayoutsAmountBucket,
  BrandPayoutsMoney,
  BrandPayoutsObligation,
  BrandPayoutsViewerRole,
} from "../contracts/brand-payouts.contracts";
import type { UserRole } from "../../../shared/auth/user-role";
import { AUTH_ROUTES } from "../../auth/constants";

export type BrandPayoutsRouteAccess =
  | { readonly kind: "ALLOW" }
  | { readonly kind: "REDIRECT"; readonly to: string }
  | { readonly kind: "DENY" };

export function resolveBrandPayoutsRouteAccess(
  role: UserRole | null,
): BrandPayoutsRouteAccess {
  if (role === "BRAND") return { kind: "ALLOW" };
  if (role === "CREATOR") {
    return { kind: "REDIRECT", to: AUTH_ROUTES.creatorPayouts };
  }
  return { kind: "DENY" };
}

const currencyPrefix: Readonly<Record<string, string>> = {
  INR: "₹",
  USD: "$",
};

const reasonMessages: Readonly<Record<string, string>> = {
  CANONICAL_ENTITY_SCOPE_UNAVAILABLE:
    "Campaign and Collaboration scope is not yet available for this role.",
  C04_INSTRUCTION_PROVENANCE_UNAVAILABLE:
    "Canonical Collaboration instruction history is not yet available.",
  C04_RESERVE_REQUEST_SOURCE_NOT_AVAILABLE:
    "Canonical reserve-request state is not yet available.",
  HISTORICAL_DUE_EVIDENCE_UNAVAILABLE:
    "The historical record does not prove a payment term or due date.",
  IMMUTABLE_TRANSFER_MILESTONES_INCOMPLETE:
    "Immutable transfer milestones are not complete enough to report this total.",
  PENDING_FUNDING_SNAPSHOT_UNAVAILABLE:
    "Pending funding cannot yet be reported from an authoritative snapshot.",
  PROTECTED_FUNDING_EVIDENCE_UNAVAILABLE:
    "Protected funding evidence is incomplete for this historical obligation.",
  VAULT_NOT_ESTABLISHED:
    "No pooled Brand vault state has been established for this workspace.",
};

export function formatPayoutsMoney(value: BrandPayoutsMoney | null): string {
  if (!value) return "Amount unavailable";
  const [integer, fraction] = value.amount.split(".");
  const sign = integer.startsWith("-") ? "-" : "";
  const digits = sign ? integer.slice(1) : integer;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
  const exact = `${sign}${grouped}${fraction === undefined ? "" : `.${fraction}`}`;
  const prefix = currencyPrefix[value.currency];
  return prefix ? `${prefix}${exact}` : `${value.currency} ${exact}`;
}

export function formatAmountBucket(bucket: BrandPayoutsAmountBucket): string {
  return bucket.status === "AUTHORITATIVE"
    ? formatPayoutsMoney(bucket.value)
    : "Unavailable";
}

export function formatPayoutsActivityAmount(
  item: BrandPayoutsActivity,
): string {
  if (!item.is_financial_movement && !item.financial_value) {
    return "No money movement";
  }
  return formatPayoutsMoney(item.financial_value);
}

export function payoutReason(reason: string | null | undefined): string {
  if (!reason) return "The authoritative source did not provide more detail.";
  return (
    reasonMessages[reason] ??
    "This value is withheld until its authoritative source can be verified."
  );
}

export function formatPayoutsTimestamp(value: string | null): string {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

export function viewerRoleLabel(role: BrandPayoutsViewerRole): string {
  switch (role) {
    case "BRAND_OWNER":
      return "Brand Owner";
    case "FINANCE_ADMIN":
      return "Finance Admin";
    case "CAMPAIGN_MANAGER":
      return "Campaign Manager";
  }
}

export function readableState(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function activityTone(
  item: BrandPayoutsActivity,
): "success" | "pending" | "error" | "neutral" {
  if (
    item.normalized_status === "SETTLED" ||
    item.normalized_status === "COMPLETED"
  ) {
    return "success";
  }
  if (
    item.normalized_status.includes("FAILED") ||
    item.normalized_status.includes("ACTION_REQUIRED") ||
    item.normalized_status.includes("UNRECONCILED")
  ) {
    return "error";
  }
  if (
    item.normalized_status.includes("PENDING") ||
    item.normalized_status.includes("PROCESSING")
  ) {
    return "pending";
  }
  return "neutral";
}

export function obligationTone(
  item: BrandPayoutsObligation,
): "success" | "pending" | "error" | "neutral" {
  if (item.lifecycle === "SETTLED") return "success";
  if (
    item.lifecycle === "ACTION_REQUIRED" ||
    item.lifecycle === "FAILED_RETRYABLE" ||
    item.lifecycle === "LEGACY_UNRECONCILED"
  ) {
    return "error";
  }
  if (
    item.lifecycle === "SCHEDULED" ||
    item.lifecycle === "READY_QUEUED" ||
    item.lifecycle === "PROCESSING" ||
    item.lifecycle === "HELD_RELEASE_PENDING"
  ) {
    return "pending";
  }
  return "neutral";
}

export function shortReference(value: string): string {
  return value.length <= 24 ? value : `${value.slice(0, 20)}…`;
}
