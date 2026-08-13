import type {
  CampaignShellCommercials,
  CampaignShellTargeting,
  UceCampaignObjective,
  UceCampaignStatus,
} from "../contracts/brand-uce.contracts";
import { displayField, EMPTY_FIELD } from "./display-field";

export function buildCampaignDetailPath(campaignId: string): string {
  return `/brand/uce/campaigns/${campaignId}`;
}

const OBJECTIVE_LABELS: Record<UceCampaignObjective, string> = {
  PULSE: "Pulse",
  PROOF: "Proof",
  PRODUCTION: "Production",
  PUSH: "Push",
};

const STATUS_LABELS: Record<UceCampaignStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  LIVE: "Live",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
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

export function formatUceDateTime(iso: string | null | undefined): string {
  if (!iso?.trim()) return EMPTY_FIELD;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return displayField(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatStringList(
  values: string[] | null | undefined,
  options?: { emptyLabel?: string },
): string {
  if (!values || values.length === 0) {
    return options?.emptyLabel ?? EMPTY_FIELD;
  }
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(", ") : (options?.emptyLabel ?? EMPTY_FIELD);
}

const GENDER_LABELS: Record<string, string> = {
  ALL: "All genders",
  FEMALE_SKEWING: "Female-skewing",
  MALE_SKEWING: "Male-skewing",
};

export function formatAudienceGender(value: string | null | undefined): string {
  if (!value?.trim()) return EMPTY_FIELD;
  return GENDER_LABELS[value] ?? value.replace(/_/g, " ");
}

const COMPENSATION_LABELS: Record<string, string> = {
  FIXED_FEE: "Fixed fee",
  NEGOTIABLE: "Negotiable range",
};

export function formatCompensationType(value: string | null | undefined): string {
  if (!value?.trim()) return EMPTY_FIELD;
  return COMPENSATION_LABELS[value] ?? value.replace(/_/g, " ");
}

const PAYOUT_LABELS: Record<string, string> = {
  IMMEDIATE: "Immediate (upon approval)",
  NET_7: "Net 7",
  NET_15: "Net 15",
  NET_30: "Net 30",
};

export function formatPayoutTerms(value: string | null | undefined): string {
  if (!value?.trim()) return EMPTY_FIELD;
  return PAYOUT_LABELS[value] ?? value.replace(/_/g, " ");
}

export function formatPlatformDeliverables(value: unknown): string {
  if (value == null) return EMPTY_FIELD;
  const entries = Array.isArray(value) ? value : [value];
  if (entries.length === 0) return EMPTY_FIELD;

  const parts = entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const platform = (entry as { platform?: string }).platform;
      const formats = (entry as { formats?: string[] }).formats;
      if (!platform) return null;
      const fmt =
        formats && formats.length > 0
          ? formats.map((f) => f.replace(/_/g, " ")).join(", ")
          : EMPTY_FIELD;
      return `${platform.replace(/_/g, " ")}: ${fmt}`;
    })
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : EMPTY_FIELD;
}

export function formatTargetingOperationalScope(
  targeting: CampaignShellTargeting | null | undefined,
): string {
  if (!targeting) return EMPTY_FIELD;
  const segments: string[] = [];
  if (targeting.industry_vertical?.trim()) {
    segments.push(`Industry: ${targeting.industry_vertical}`);
  }
  const tiers = formatStringList(targeting.follower_tiers, { emptyLabel: "" });
  if (tiers) {
    segments.push(`Tiers: ${tiers}`);
  }
  segments.push(`Audience ${targeting.audience_age_min}–${targeting.audience_age_max}`);
  const gender = formatAudienceGender(targeting.audience_gender);
  if (gender !== EMPTY_FIELD) {
    segments.push(gender);
  }
  return segments.length > 0 ? segments.join(" · ") : EMPTY_FIELD;
}

export function formatCommercialLogistics(
  commercials: CampaignShellCommercials | null | undefined,
): string {
  if (!commercials) return EMPTY_FIELD;
  return [
    `Advance escrow: ${commercials.advance_payment_percentage}%`,
    `Balance terms: ${formatPayoutTerms(commercials.final_balance_terms)}`,
  ].join(" · ");
}

export function formatCommercialFinancialTerms(
  commercials: CampaignShellCommercials | null | undefined,
): string {
  if (!commercials) return EMPTY_FIELD;
  const lines: string[] = [
    formatCompensationType(commercials.compensation_type),
    `Budget pool: ${formatCurrency(commercials.total_campaign_budget_pool)}`,
  ];
  if (commercials.compensation_type === "FIXED_FEE") {
    lines.push(`Fixed fee: ${formatCurrency(commercials.fixed_fee_amount, { cents: true })}`);
  } else if (commercials.compensation_type === "NEGOTIABLE") {
    lines.push(
      `Fee range: ${formatCurrency(commercials.negotiable_min_fee, { cents: true })} – ${formatCurrency(commercials.negotiable_max_fee, { cents: true })}`,
    );
  }
  return lines.join(" · ");
}

export function formatDynamicDaysLimit(
  timelineType: string | null | undefined,
  days: number | null | undefined,
): string {
  if (timelineType === "FIXED_DATES") return "N/A (fixed dates)";
  if (days != null && Number.isFinite(days)) return String(days);
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
