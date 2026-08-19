import type { CanonicalReadinessCurrency } from "../../api/canonical-campaign-draft-client";
import type { AdvancePaymentPercentage, BrandSupportType, CompensationModel, PayoutTerms, WizardData } from "../../types/campaign-wizard";

export const SUPPORT_OPTIONS: ReadonlyArray<{ value: BrandSupportType; label: string }> = [
  { value: "PRODUCT", label: "Product" }, { value: "SERVICE", label: "Service" }, { value: "EXPERIENCE", label: "Experience" },
  { value: "ACCESS_SUBSCRIPTION", label: "Access / subscription" }, { value: "OTHER", label: "Other" },
];
export const COMPENSATION_OPTIONS: ReadonlyArray<{ value: CompensationModel; label: string }> = [
  { value: "FIXED", label: "Fixed" }, { value: "NEGOTIABLE", label: "Negotiable" },
];
export const ADVANCE_OPTIONS: readonly AdvancePaymentPercentage[] = [0, 25, 50, 75, 100];
export const PAYOUT_OPTIONS: ReadonlyArray<{ value: PayoutTerms; label: string; days: number }> = [
  { value: "NET_7", label: "Net 7", days: 7 }, { value: "NET_15", label: "Net 15", days: 15 },
  { value: "NET_30", label: "Net 30", days: 30 }, { value: "NET_45", label: "Net 45", days: 45 },
  { value: "NET_60", label: "Net 60", days: 60 },
];

export function compensationPresentation(model: CompensationModel) {
  return model === "NEGOTIABLE"
    ? { label: "Payout Starting From", helper: "Creators may make one counter-offer." }
    : { label: "Creator Payout", helper: "Fixed payout offered to each creator collaboration." };
}

export function formatCommercialAmount(value: number | null, currency: CanonicalReadinessCurrency) {
  if (value == null) return "";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: 0 }).format(value);
}

export function parseCommercialAmount(value: string) {
  const normalized = value.replace(/[,_\s]/g, "");
  return /^\d+$/.test(normalized) ? Number(normalized) : null;
}

export function currencySymbol(currency: CanonicalReadinessCurrency) {
  return currency === "INR" ? "₹" : "$";
}

export function payoutTermsHelper(value: PayoutTerms) {
  const days = PAYOUT_OPTIONS.find((item) => item.value === value)?.days ?? 30;
  return `Remaining payout is due within ${days} days of the approved payment trigger.`;
}

export function supportDisabledPatch() {
  return { receivesBrandSupport: false, brandSupportType: null, brandSupportEstimatedValue: null } as const;
}

export function commercialStrategySummary(data: WizardData, currency: CanonicalReadinessCurrency) {
  const symbol = currencySymbol(currency);
  const amount = (value: number | null) => `${symbol}${formatCommercialAmount(value, currency)}`;
  const rows: Array<{ label: string; value: string }> = [];
  if (data.receivesBrandSupport) {
    const type = SUPPORT_OPTIONS.find((item) => item.value === data.brandSupportType)?.label ?? "Brand support";
    rows.push({ label: "Brand support", value: data.brandSupportEstimatedValue == null ? type : `${type} · ${amount(data.brandSupportEstimatedValue)}` });
  } else rows.push({ label: "Brand support", value: "No" });
  rows.push({ label: "Compensation", value: `${data.compensationModel === "NEGOTIABLE" ? "Negotiable · Starting from" : "Fixed ·"} ${amount(data.commercialOffer)}` });
  rows.push({ label: "Budget", value: amount(data.totalCampaignBudget) });
  rows.push({ label: "Payment", value: `${data.advancePaymentPercentage}% advance · ${PAYOUT_OPTIONS.find((item) => item.value === data.payoutTerms)?.label ?? data.payoutTerms}` });
  return rows;
}

export function commercialStrategyCanPublish(data: WizardData) {
  return (!data.receivesBrandSupport || Boolean(data.brandSupportType)) && (data.brandSupportEstimatedValue == null || data.brandSupportEstimatedValue >= 0) && data.commercialOffer >= 0 && data.totalCampaignBudget >= data.commercialOffer && ADVANCE_OPTIONS.includes(data.advancePaymentPercentage) && PAYOUT_OPTIONS.some((item) => item.value === data.payoutTerms);
}
