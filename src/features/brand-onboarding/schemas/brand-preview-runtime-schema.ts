import { z } from "zod";

import type {
  BrandPreviewAudienceGroup,
  BrandPreviewArchetype,
  BrandPreviewOpportunity,
  BrandPreviewPayload,
  BrandPreviewRuntimeProjection,
} from "../contracts/brand-preview.contracts";

const industrySchema = z.enum([
  "D2C",
  "SAAS_AI",
  "HEALTHCARE",
  "OFFLINE_SERVICES",
]);

const stateSchema = z.enum([
  "ANALYSIS_ACTIVE",
  "PREVIEW_READY",
  "PREVIEW_FAILED_RECOVERABLE",
  "PREVIEW_NOT_READY",
]);

const phaseSchema = z.enum([
  "UNDERSTANDING_BRAND",
  "LEARNING_AUDIENCE",
  "FINDING_CREATOR_OPPORTUNITIES",
  "PREPARING_PREVIEW",
]);

const completenessSchema = z.enum(["NORMAL", "PARTIAL"]);

const requiredText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z.string().trim().min(1).max(max).nullable().optional();

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function first(value: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in value) return value[key];
  }
  return undefined;
}

function parseWebsiteUrl(value: unknown): string {
  const raw = z.string().trim().min(1).parse(value);
  if (z.string().url().safeParse(raw).success) return raw;
  try {
    return new URL(`https://${raw}`).toString();
  } catch {
    throw new Error("Brand Preview website URL is invalid.");
  }
}

function normalizeAudience(value: unknown): BrandPreviewAudienceGroup {
  const item = record(value);
  return {
    id: z.string().trim().min(1).parse(first(item, "id")),
    label: requiredText(38).parse(first(item, "label")),
    whyItMatters: requiredText(240).parse(
      first(item, "whyItMatters", "why_it_matters"),
    ),
  };
}

function normalizeOpportunity(value: unknown): BrandPreviewOpportunity {
  const item = record(value);
  return {
    title: requiredText(55).parse(first(item, "title")),
    whyItMatters: requiredText(290).parse(
      first(item, "whyItMatters", "why_it_matters"),
    ),
  };
}

function normalizeArchetype(value: unknown): BrandPreviewArchetype {
  const item = record(value);
  return {
    archetypeId: z
      .string()
      .trim()
      .min(1)
      .parse(first(item, "archetypeId", "archetype_id")),
    label: requiredText(40).parse(first(item, "label")),
    rationale: requiredText(220).parse(first(item, "rationale")),
  };
}

function normalizePreview(value: unknown): BrandPreviewPayload {
  const raw = record(value);
  const identity = record(first(raw, "identity"));
  const understandingRaw = first(raw, "understanding");
  const understanding = record(understandingRaw);
  const audiencesRaw = first(raw, "audience_groups", "audiences");
  const audiencesObject = record(audiencesRaw);
  const opportunitiesRaw = first(
    raw,
    "creator_marketing_opportunities",
    "opportunities",
  );
  const opportunitiesObject = record(opportunitiesRaw);
  const creatorRaw = first(
    raw,
    "creatorStartingPoint",
    "creator_starting_point",
  );
  const creator = record(creatorRaw);
  const backendArchetypes = first(raw, "creator_archetype_recommendations");

  const audiencesSource = Array.isArray(audiencesRaw)
    ? audiencesRaw
    : first(audiencesObject, "groups");
  const opportunitiesSource = Array.isArray(opportunitiesRaw)
    ? opportunitiesRaw
    : first(opportunitiesObject, "items");
  const archetypesSource = Array.isArray(backendArchetypes)
    ? backendArchetypes
    : first(creator, "archetypes");

  const audiences = z
    .array(z.unknown())
    .min(1)
    .max(3)
    .parse(audiencesSource)
    .map(normalizeAudience);
  const opportunities = z
    .array(z.unknown())
    .min(1)
    .max(3)
    .parse(opportunitiesSource)
    .map(normalizeOpportunity);
  const archetypes = z
    .array(z.unknown())
    .min(1)
    .max(4)
    .parse(archetypesSource)
    .map(normalizeArchetype);

  const backendNarrative = first(
    raw,
    "brand_understanding_narrative",
    "brandUnderstandingNarrative",
  );
  const narrativeCandidate =
    backendNarrative !== undefined
      ? backendNarrative
      : typeof understandingRaw === "string"
        ? understandingRaw
        : first(understanding, "narrative");
  const backendDescriptor = first(raw, "brand_descriptor", "brandDescriptor");
  const descriptorCandidate =
    backendDescriptor !== undefined
      ? backendDescriptor
      : first(identity, "brandDescriptor", "brand_descriptor");

  return {
    identity: {
      brandName: requiredText(160).parse(
        first(identity, "brandName", "brand_name"),
      ),
      brandLogo:
        optionalText(2048).parse(
          first(identity, "brandLogo", "brand_logo", "logoUrl", "logo_url"),
        ) ?? null,
      websiteUrl: parseWebsiteUrl(
        first(identity, "websiteUrl", "website_url"),
      ),
      displayDomain: requiredText(255).parse(
        first(identity, "displayDomain", "display_domain"),
      ),
      confirmedIndustry: industrySchema.parse(
        first(identity, "confirmedIndustry", "confirmed_industry"),
      ),
      brandDescriptor: optionalText(90).parse(descriptorCandidate) ?? null,
    },
    understanding: {
      narrative: requiredText(1200).parse(narrativeCandidate),
    },
    audiences,
    opportunities,
    creatorStartingPoint: { archetypes },
  };
}

export function parseBrandPreviewRuntimeProjection(
  value: unknown,
): BrandPreviewRuntimeProjection {
  const raw = record(value);
  const state = stateSchema.parse(first(raw, "state"));
  const phaseValue = first(raw, "phase");
  const phase = phaseValue == null ? null : phaseSchema.parse(phaseValue);
  const canRetryValue = first(raw, "canRetry", "retryAllowed", "retry_allowed");
  const canRetry = typeof canRetryValue === "boolean" ? canRetryValue : false;

  if (state === "ANALYSIS_ACTIVE") {
    return {
      state,
      phase,
      completeness: null,
      canRetry: false,
      preview: null,
      verificationContext: null,
    };
  }

  if (state === "PREVIEW_READY") {
    const completeness = completenessSchema.parse(first(raw, "completeness"));
    const preview = normalizePreview(first(raw, "preview", "payload"));
    const verification = record(
      first(raw, "verificationContext", "verification_context"),
    );
    const brandProfileId = z
      .string()
      .trim()
      .min(1)
      .parse(first(verification, "brandProfileId", "brand_profile_id"));
    return {
      state,
      phase,
      completeness,
      canRetry: false,
      preview,
      verificationContext: { brandProfileId },
    };
  }

  if (state === "PREVIEW_FAILED_RECOVERABLE") {
    if (!canRetry) {
      throw new Error(
        "Recoverable Brand Preview failure did not authorize retry.",
      );
    }
    return {
      state,
      phase,
      completeness: null,
      canRetry: true,
      preview: null,
      verificationContext: null,
    };
  }

  return {
    state,
    phase,
    completeness: null,
    canRetry,
    preview: null,
    verificationContext: null,
  };
}
