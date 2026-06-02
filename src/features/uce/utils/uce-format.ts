import type { UceCampaignObjective, UceCampaignStatus } from "../contracts/brand-uce.contracts";
import { displayField, EMPTY_FIELD } from "./display-field";

export function buildCampaignDetailPath(campaignId: string): string {
  return `/brand/uce/campaigns/${campaignId}`;
}

const OBJECTIVE_LABELS: Record<UceCampaignObjective, string> = {
  BRAND_AWARENESS: "Brand Awareness",
  TRAFFIC_CLICKS: "Traffic & Clicks",
  SALES_CONVERSIONS: "Sales & Conversions",
};

const STATUS_LABELS: Record<UceCampaignStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

export function formatObjective(
  value: UceCampaignObjective | null | undefined,
): string {
  if (!value) return EMPTY_FIELD;
  return OBJECTIVE_LABELS[value] ?? value;
}

export function formatStatus(value: UceCampaignStatus | null | undefined): string {
  if (!value) return EMPTY_FIELD;
  return STATUS_LABELS[value] ?? value;
}

export function formatCurrency(
  value: number | null | undefined,
  options?: { cents?: boolean },
): string {
  if (value == null || !Number.isFinite(value)) {
    return EMPTY_FIELD;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: options?.cents ? 2 : 0,
  }).format(value);
}

export function formatCompactCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return EMPTY_FIELD;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return formatCurrency(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return EMPTY_FIELD;
  }
  return `${Math.round(value)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return EMPTY_FIELD;
  }
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatBigIntString(value: string | null | undefined): string {
  if (!value?.trim()) return EMPTY_FIELD;
  try {
    return new Intl.NumberFormat("en-US").format(BigInt(value));
  } catch {
    return displayField(value);
  }
}

export function formatIsoDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start && !end) return EMPTY_FIELD;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  if (end) return `Ends ${fmt(end)}`;
  return EMPTY_FIELD;
}

export function pipelineBarSegments(
  prospects: number,
  applicants: number,
  active: number,
): [number, number, number] {
  const total = prospects + applicants + active;
  if (total <= 0) return [0, 0, 0];
  const p1 = Math.round((prospects / total) * 100);
  const p2 = Math.round((applicants / total) * 100);
  const p3 = Math.max(0, 100 - p1 - p2);
  return [p1, p2, p3];
}

export function budgetPercent(consumed: number, total: number): number {
  if (!Number.isFinite(consumed) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.round((consumed / total) * 100);
}
