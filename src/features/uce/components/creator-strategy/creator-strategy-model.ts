import { AUDIENCE_AFFINITIES } from "../../canonical/audience-affinities";
import type { AudienceGender, CampaignAudienceGeography, WizardData } from "../../types/campaign-wizard";
import { CAMPAIGN_OBJECTIVES } from "../campaign-strategy/campaign-strategy-model";

export const CREATOR_ARCHETYPES = [
  ["TRENDSETTER", "Trendsetter"], ["ENTERTAINER", "Entertainer"], ["VIRAL_CREATOR", "Viral Creator"],
  ["CHALLENGER", "Challenger"], ["LIFESTYLE_INTEGRATOR", "Lifestyle Integrator"], ["STORYTELLER", "Storyteller"],
  ["EDUCATOR", "Educator"], ["INDUSTRY_EXPERT", "Industry Expert"], ["DEEP_DIVER", "Deep Diver"],
  ["MYTH_BUSTER", "Myth Buster"], ["RELATABLE_PEER", "Relatable Peer"], ["COMMUNITY_BUILDER", "Community Builder"],
  ["LOCAL_GUIDE", "Local Guide"], ["CONVERSATION_STARTER", "Conversation Starter"], ["ADVOCATE", "Advocate"],
  ["PROBLEM_SOLVER", "Problem Solver"], ["PRODUCT_REVIEWER", "Product Reviewer"], ["DEAL_HUNTER", "Deal Hunter"],
  ["COMPARISON_CREATOR", "Comparison Creator"], ["CURATED_COLLECTOR", "Curated Collector"], ["VISUAL_ARTIST", "Visual Artist"],
  ["UGC_CREATOR", "UGC Creator"], ["CINEMATIC_CREATOR", "Cinematic Creator"], ["CREATIVE_DIRECTOR", "Creative Director"],
  ["AESTHETIC_MINIMALIST", "Aesthetic Minimalist"], ["FOUNDER_VOICE", "Founder Voice"], ["COACH", "Coach"],
  ["RESEARCHER", "Researcher"], ["THOUGHT_LEADER", "Thought Leader"], ["DEMONSTRATOR", "Demonstrator"],
] as const;

export const CREATOR_ARCHETYPE_MAX = 5;
export const GENDER_OPTIONS: ReadonlyArray<{ value: AudienceGender; label: string }> = [
  { value: "ALL", label: "All" }, { value: "FEMALE", label: "Female" }, { value: "MALE", label: "Male" },
];

export function archetypeLabel(id: string) {
  return CREATOR_ARCHETYPES.find(([value]) => value === id)?.[1] ?? id;
}

export function filterArchetypes(query: string, selected: readonly string[]) {
  const needle = query.trim().toLowerCase();
  return CREATOR_ARCHETYPES.filter(([id, label]) => !selected.includes(id) && (!needle || `${id} ${label}`.toLowerCase().includes(needle)));
}

export function toggleCanonicalValue(values: readonly string[], id: string, max: number) {
  if (values.includes(id)) return values.filter((value) => value !== id);
  return values.length >= max ? [...values] : [...values, id];
}

export function parseGroupedInteger(value: string): number | null {
  const normalized = value.replace(/[,_\s]/g, "");
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}

export function formatInteger(value: number | null) {
  return value == null ? "" : value.toLocaleString("en-IN");
}

export function geographyOptionSelected(value: readonly CampaignAudienceGeography[], candidate: CampaignAudienceGeography) {
  return value.some((item) => item.scope === candidate.scope && item.label === candidate.label);
}

export function providerFailureCopy(kind: "configuration" | "network" | "result") {
  if (kind === "result") return "We couldn't use that location. Choose another result.";
  return "Location search is temporarily unavailable. Your selected locations are still saved.";
}

export function affinityResults(query: string, selected: readonly string[]) {
  const needle = query.trim().toLowerCase();
  return AUDIENCE_AFFINITIES.filter((item) => !selected.includes(item.id) && (!needle || [item.id, item.label, ...item.aliases].some((candidate) => candidate.toLowerCase().includes(needle))));
}

export function creatorStrategySummary(data: WizardData) {
  const rows: Array<{ label: string; value: string }> = [];
  if (data.name.trim()) rows.push({ label: "Campaign", value: data.name.trim() });
  const objective = CAMPAIGN_OBJECTIVES.find((item) => item.value === data.objective);
  if (objective) rows.push({ label: "Objective", value: `${objective.name} — ${objective.outcome}` });
  if (data.archetypes.length) rows.push({ label: "Archetypes", value: `${data.archetypes.length} selected` });
  const maximum = data.maximumFollowers == null ? "No maximum" : formatInteger(data.maximumFollowers);
  rows.push({ label: "Followers", value: `${formatInteger(data.minimumFollowers)} – ${maximum}` });
  rows.push({ label: "Audience", value: `${GENDER_OPTIONS.find((item) => item.value === data.audienceGender)?.label} · ${data.audienceAgeMin}–${data.audienceAgeMax}` });
  if (data.audienceGeographies.length) rows.push({ label: "Geography", value: data.audienceGeographies.map((item) => item.label).join(" · ") });
  return rows;
}

export function creatorStrategyCanContinue(data: WizardData) {
  return data.archetypes.length > 0 && data.archetypes.length <= CREATOR_ARCHETYPE_MAX && data.minimumFollowers >= 0 && (data.maximumFollowers == null || data.maximumFollowers > data.minimumFollowers) && data.audienceAgeMin >= 13 && data.audienceAgeMax <= 65 && data.audienceAgeMin <= data.audienceAgeMax && data.audienceGeographies.length > 0;
}
