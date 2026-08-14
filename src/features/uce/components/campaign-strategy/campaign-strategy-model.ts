import type { CanonicalCampaignReadinessState } from "../../readiness/canonical-campaign-readiness-controller";
import type { CampaignObjective, WizardData } from "../../types/campaign-wizard";

export const CAMPAIGN_OBJECTIVES: ReadonlyArray<{
  value: CampaignObjective;
  name: string;
  outcome: string;
  description: string;
}> = [
  { value: "PULSE", name: "Pulse", outcome: "Awareness & Reach", description: "Maximize unique reach and visibility." },
  { value: "PROOF", name: "Proof", outcome: "Trust & Validation", description: "Build credibility through meaningful engagement." },
  { value: "PRODUCTION", name: "Production", outcome: "High-Quality Assets", description: "Generate reusable creator content." },
  { value: "PUSH", name: "Push", outcome: "Direct Action", description: "Drive measurable action through Campaign links." },
];

const KPI_LABELS: Record<string, string> = {
  ASSET_QUALITY_SCORE: "Asset Quality Score",
  CTR: "CTR",
  CTA: "CTA",
  DM_INQUIRIES: "DM Inquiries",
  UGC_MENTIONS: "UGC Mentions",
};

export function kpiDisplayLabel(value: string) {
  if (KPI_LABELS[value]) return KPI_LABELS[value];
  return value.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    .replace(/ Cta /g, " CTA ")
    .replace(/^Cta /, "CTA ")
    .replace(/ Dm /g, " DM ")
    .replace(/^Dm /, "DM ");
}

export type ReadinessPresentation =
  | { kind: "hidden" }
  | { kind: "resolving"; title: "Resolving success metrics…" }
  | { kind: "ready"; primary: string; supporting: string[] }
  | { kind: "retryable-failure"; message: string; canRetry: true }
  | { kind: "configuration-failure"; message: string; canRetry: false };

export function campaignReadinessPresentation(state: CanonicalCampaignReadinessState): ReadinessPresentation {
  switch (state.status) {
    case "idle":
    case "not-ready": return { kind: "hidden" };
    case "resolving": return { kind: "resolving", title: "Resolving success metrics…" };
    case "ready": return { kind: "ready", primary: kpiDisplayLabel(state.primaryKpi), supporting: state.supportingKpis.map(kpiDisplayLabel) };
    case "failed-retryable": return { kind: "retryable-failure", message: "Success metrics couldn't be loaded.", canRetry: true };
    case "failed-non-retryable": return { kind: "configuration-failure", message: "Success metrics aren't configured for this Campaign.", canRetry: false };
  }
}

export function showScheduledDates(schedule: WizardData["publishingSchedule"]) {
  return schedule === "SCHEDULED";
}

export function scheduleSelectionPatch(schedule: WizardData["publishingSchedule"]): Partial<WizardData> {
  return schedule === "EVERGREEN"
    ? { publishingSchedule: "EVERGREEN", publishFrom: "", publishUntil: "" }
    : { publishingSchedule: "SCHEDULED" };
}

export function campaignStrategyNavigationBlocked(
  readiness: CanonicalCampaignReadinessState,
  autosaveFailed: boolean,
) {
  return autosaveFailed || readiness.status !== "ready";
}

export function campaignStrategySummary(data: WizardData) {
  const objective = CAMPAIGN_OBJECTIVES.find((item) => item.value === data.objective);
  const rows = [
    data.name.trim() ? { label: "Name", value: data.name.trim() } : null,
    objective ? { label: "Objective", value: `${objective.name} — ${objective.outcome}` } : null,
    { label: "Schedule", value: data.publishingSchedule === "EVERGREEN" ? "Evergreen" : formatSchedule(data.publishFrom, data.publishUntil) },
    { label: "Platform", value: "Instagram" },
    { label: "Visibility", value: ({ PUBLIC: "Public", ELIGIBLE_CREATORS_ONLY: "Eligible Creators Only", INVITE_ONLY: "Invite Only" } as const)[data.visibility] },
  ];
  return rows.filter((row): row is { label: string; value: string } => Boolean(row));
}

function formatSchedule(from: string, until: string) {
  if (!from || !until) return "Scheduled";
  return `${formatDate(from)} – ${formatDate(until)}`;
}

export function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
