import type { BrandCentreIntelligenceResponse } from "../contracts/brand-centre.contracts";
import { EMPTY_FIELD } from "./display-field";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function capitalizeWord(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function formatArchetypeLabel(key: string, pct: number): string {
  const label = capitalizeWord(key.replace(/_/g, " "));
  return `${label} — ${pct}%`;
}

function topArchetypeSlots(
  distribution: Record<string, unknown> | undefined,
): { primary: string; secondary: string; tertiary: string } {
  if (!distribution) {
    return { primary: EMPTY_FIELD, secondary: EMPTY_FIELD, tertiary: EMPTY_FIELD };
  }
  const sorted = Object.entries(distribution)
    .map(([key, raw]) => ({ key, pct: asNumber(raw) ?? 0 }))
    .filter((row) => row.pct > 0)
    .sort((a, b) => b.pct - a.pct);

  const slot = (index: number) =>
    sorted[index]
      ? formatArchetypeLabel(sorted[index].key, sorted[index].pct)
      : EMPTY_FIELD;

  return { primary: slot(0), secondary: slot(1), tertiary: slot(2) };
}

function mapShareOfVoice(sov: Record<string, unknown> | undefined) {
  const brand = asNumber(sov?.ourBrandShare);
  const matrix = isRecord(sov?.competitorsShareMatrix)
    ? Object.entries(sov.competitorsShareMatrix)
        .map(([name, share]) => ({
          name,
          share: asNumber(share) ?? 0,
        }))
        .sort((a, b) => b.share - a.share)
    : [];

  const competitorA = matrix[0]?.share ?? null;
  const competitorB = matrix[1]?.share ?? null;
  const others =
    matrix.length > 2
      ? matrix.slice(2).reduce((sum, row) => sum + row.share, 0)
      : null;

  return {
    brand,
    competitorA,
    competitorB,
    others,
  };
}

function mapCompetitivePillars(sov: Record<string, unknown> | undefined) {
  const themes = asStringArray(sov?.competitorThemesLast30Days);
  if (themes.length === 0) {
    return [{ theme: EMPTY_FIELD, context: EMPTY_FIELD }];
  }
  return themes.slice(0, 3).map((theme) => ({
    theme,
    context: EMPTY_FIELD,
  }));
}

/** Maps raw GET /intelligence baseline JSON into Tab 2 Zone 1 view fields. */
export function mapIntelligenceResponse(
  raw: BrandCentreIntelligenceResponse,
): BrandCentreIntelligenceResponse {
  const baselineAny = raw.baseline as unknown;
  if (!isRecord(baselineAny)) {
    return raw;
  }

  const gim = isRecord(baselineAny.growthImpactMatrix)
    ? baselineAny.growthImpactMatrix
    : {};
  const levers = isRecord(gim.levers) ? gim.levers : {};
  const health = isRecord(baselineAny.baselineHealth)
    ? baselineAny.baselineHealth
    : {};
  const archetypeMatch = isRecord(health.archetypeMatch)
    ? health.archetypeMatch
    : {};
  const ourDist = isRecord(archetypeMatch.ourBrandDistribution)
    ? archetypeMatch.ourBrandDistribution
    : undefined;
  const compDist = isRecord(archetypeMatch.competitorAverageDistribution)
    ? archetypeMatch.competitorAverageDistribution
    : undefined;
  const sov = isRecord(baselineAny.shareOfVoice)
    ? baselineAny.shareOfVoice
    : undefined;

  const reachMoM = asNumber(health.reachMoMPercentage);
  const engagement = asNumber(health.engagementRateVsBenchmark);
  const overlap = asNumber(health.audienceOverlapPercentage);
  const quality = asNumber(health.contentQualityScore);
  const hook = asNumber(health.averageHookRate);
  const safety = asNumber(health.brandSafetyScore);

  const ourArchetypes = topArchetypeSlots(ourDist);
  const compArchetypes = topArchetypeSlots(compDist);
  const sovMapped = mapShareOfVoice(sov);

  const projectedLift =
    asNumber(gim.projectedRevenueLiftPercentage) ??
    asNumber(
      (gim as Record<string, unknown>).totalRevenueLiftPercentage,
    );

  const insightText =
    typeof gim.insightNarrative === "string" && gim.insightNarrative.trim()
      ? gim.insightNarrative.trim()
      : typeof gim.statusIndicator === "string"
        ? gim.statusIndicator
        : null;

  return {
    ...raw,
    baseline: {
      source:
        typeof baselineAny.source === "string" ? baselineAny.source : EMPTY_FIELD,
      growthImpactMatrix: {
        totalRevenueLiftPercentage: projectedLift,
        statusIndicator: insightText,
        levers: {
          pdpAlignmentLift: asNumber(levers.pdpAlignmentLift),
          igPerformanceLift:
            asNumber(levers.creatorRosterLift) ??
            asNumber(levers.igPerformanceLift),
          metaAdBoostLift:
            asNumber(levers.paidAmplificationLift) ??
            asNumber(levers.metaAdBoostLift),
          creatorRosterLift: asNumber(levers.creatorRosterLift),
        },
      },
      baselineHealth: {
        reach: {
          value:
            reachMoM != null ? `${reachMoM}% MoM reach` : EMPTY_FIELD,
          growth:
            reachMoM != null ? `${reachMoM >= 0 ? "+" : ""}${reachMoM}% vs MoM` : EMPTY_FIELD,
        },
        engagement: {
          value: engagement != null ? `${engagement}% avg` : EMPTY_FIELD,
          benchmark:
            engagement != null ? `${engagement}% vs benchmark` : EMPTY_FIELD,
        },
        followerGrowth: { value: EMPTY_FIELD },
        creatorVolume: { value: EMPTY_FIELD },
        audienceOverlap: {
          value: overlap != null ? `${overlap}% niche match` : EMPTY_FIELD,
          target: "25%-40% for growth",
        },
        archetypeMatch: ourArchetypes,
        alignmentIndex: {
          value:
            quality != null ? `${Math.round(quality * 10)}% alignment` : EMPTY_FIELD,
          context: EMPTY_FIELD,
        },
        qualityRating: {
          score: quality != null ? `${quality} / 10` : EMPTY_FIELD,
          visuals: EMPTY_FIELD,
          messaging: EMPTY_FIELD,
          hookRate: hook != null ? `${hook}%` : EMPTY_FIELD,
        },
        brandSafety: {
          percentage: safety != null ? `${safety}% compliant` : EMPTY_FIELD,
          flags: EMPTY_FIELD,
        },
      },
      shareOfVoice: sovMapped,
      archetypeMatrix: {
        ourBrand: {
          primary: ourArchetypes.primary,
          secondary: ourArchetypes.secondary,
        },
        competitors: {
          primary: compArchetypes.primary,
          secondary: compArchetypes.secondary,
        },
        takeaway:
          ourArchetypes.primary !== EMPTY_FIELD &&
          compArchetypes.primary !== EMPTY_FIELD
            ? "Compare primary archetype weight vs competitor average in your category."
            : EMPTY_FIELD,
      },
      competitivePillars: mapCompetitivePillars(sov),
      competitiveTakeaway:
        asStringArray(sov?.competitorThemesLast30Days).length > 0
          ? "Themes below reflect competitor content signals from the baseline scan."
          : EMPTY_FIELD,
    },
  };
}
