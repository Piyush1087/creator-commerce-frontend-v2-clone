import type {
  BrandCentreAccountResponse,
  BrandCentreBudgetResponse,
  BrandCentreDnaResponse,
} from "../contracts/brand-centre.contracts";
import type { BrandCentreViewModel, ChartSlice } from "../types";
import { mapDnaCatalogView } from "./map-dna-catalog-view";
import { displayField, displayList, EMPTY_FIELD } from "./display-field";

const CHART_COLORS = [
  "var(--color-primary)",
  "#60A5FA",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
];

function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toLocaleString()}`;
  }
}

function websiteHost(websiteUrl: string): string {
  try {
    return new URL(websiteUrl).host.replace(/^www\./, "");
  } catch {
    return websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function mixToChart(
  mix: Record<string, number>,
  labels: Record<string, string>,
): ChartSlice[] {
  const entries = Object.entries(mix).filter(([, value]) => value > 0);
  if (entries.length === 0) {
    return [{ label: EMPTY_FIELD, value: 0, color: "#E5E7EB" }];
  }
  return entries.map(([key, value], index) => ({
    label: labels[key] ?? key,
    value,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function formatIndustry(dna: BrandCentreDnaResponse): string {
  const parts = [
    dna.profile.industry,
    dna.profile.subIndustry,
    dna.profile.industryNiche,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .map((part) => part.replace(/_/g, " "));
  return parts.length > 0 ? parts.join(" › ") : EMPTY_FIELD;
}

function formatMarketSetup(dna: BrandCentreDnaResponse): string {
  const country = dna.profile.countryCode?.trim();
  const currency = dna.profile.currencyCode?.trim();
  if (country && currency) {
    return `${country} / ${currency}`;
  }
  if (currency) {
    return currency;
  }
  return EMPTY_FIELD;
}

export function mapBrandCentreView(
  dna: BrandCentreDnaResponse,
  budget: BrandCentreBudgetResponse | null,
  account: BrandCentreAccountResponse,
): BrandCentreViewModel {
  const currencyCode = dna.profile.currencyCode ?? "USD";
  const utilizedTotal = budget
    ? budget.utilizedBooked + budget.utilizedSpent
    : 0;
  const monthlyBudget = budget?.masterMonthlyBudget ?? 0;
  const utilizationPercent = budget?.utilizationPercentage ?? 0;

  return {
    brandName: displayField(dna.profile.brandName),
    website: dna.profile.websiteUrl
      ? websiteHost(dna.profile.websiteUrl)
      : EMPTY_FIELD,
    websiteUrl: dna.profile.websiteUrl || null,
    logoUrl: dna.profile.logoUrl,
    marketSetup: formatMarketSetup(dna),
    industry: formatIndustry(dna),
    lifecycleStage: displayField(dna.profile.lifecycleStage?.replace(/_/g, " ")),
    igHandle: displayField(dna.profile.igHandle),
    ytHandle: displayField(dna.profile.ytHandle),
    tiktokHandle: displayField(dna.profile.tiktokHandle),
    narrativeTitle: displayField(dna.narrative.tagline),
    narrativeDescription: displayField(dna.narrative.briefDescription),
    toneTags: displayList(dna.narrative.toneOfVoice),
    colors: dna.identity.palette.length > 0 ? dna.identity.palette : [],
    fonts: displayList(dna.identity.fonts),
    personas:
      dna.personas.length > 0
        ? dna.personas.map((persona) => ({
            name: displayField(persona.personaName),
            imageUrl: null,
          }))
        : [{ name: EMPTY_FIELD, imageUrl: null }],
    currencyCode,
    monthlyBudgetLabel:
      budget && monthlyBudget > 0
        ? formatCurrency(monthlyBudget, currencyCode)
        : EMPTY_FIELD,
    utilizedBudgetLabel:
      budget && (utilizedTotal > 0 || monthlyBudget > 0)
        ? formatCurrency(utilizedTotal, currencyCode)
        : EMPTY_FIELD,
    utilizationPercent:
      budget && monthlyBudget > 0 ? utilizationPercent : 0,
    showUtilization: Boolean(budget && monthlyBudget > 0),
    assetAllocation: budget
      ? mixToChart(budget.assetMix, {
          product: "Product",
          collection: "Collection",
          sale: "Sale",
        })
      : [{ label: EMPTY_FIELD, value: 0, color: "#E5E7EB" }],
    influencerTiers: budget
      ? mixToChart(budget.tierMix, {
          nano: "Nano",
          micro: "Micro",
          midTier: "Mid-tier",
          mega: "Mega",
          celebrity: "Celebrity",
        })
      : [{ label: EMPTY_FIELD, value: 0, color: "#E5E7EB" }],
    campaignObjectives: budget
      ? mixToChart(budget.objectiveMix, {
          pulse: "Pulse",
          proof: "Proof",
          push: "Push",
          production: "Production",
        })
      : [{ label: EMPTY_FIELD, value: 0, color: "#E5E7EB" }],
    escrowStatus: displayField(account.escrowStatus),
    currentPlan: displayField(account.subscriptionTier?.replace(/_/g, " ")),
    outreachQuotaLabel:
      account.outreachQuota.total > 0
        ? `${account.outreachQuota.used} / ${account.outreachQuota.total} used`
        : EMPTY_FIELD,
    metaConnectionStatus: displayField(account.metaConnectionStatus),
    teamManagement: EMPTY_FIELD,
    catalog: mapDnaCatalogView(dna),
  };
}
