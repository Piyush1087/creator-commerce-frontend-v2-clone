import { z } from "zod";
import {
  authority,
  jsonValue,
  safeUrl,
  semanticId,
  uniqueItems,
} from "./brand-consumer-primitives";

const text = semanticId;
export const valueItem = z
  .object({ semantic_id: semanticId, value: text })
  .strict();
export const traitItem = z
  .object({ semantic_id: semanticId, trait: text })
  .strict();
const values = uniqueItems(valueItem, "semantic_id");
const traits = uniqueItems(traitItem, "semantic_id");
export const brandValues = values;
export const personality = traits;
export const differentiation = uniqueItems(
  z
    .object({
      semantic_id: semanticId,
      differentiator: text,
      proof_points: uniqueItems(
        z.object({ semantic_id: semanticId, statement: text }).strict(),
        "semantic_id",
      ).nullish(),
    })
    .strict(),
  "semantic_id",
);

// Assembled current Objects can contain only independently mature components.
// Undefined is retained as omission; explicit null is retained as evaluated null.
export const communication = z
  .object({
    tone_traits: traits.nullish(),
    free_text_guidance: text.nullish(),
    communication_constraints: uniqueItems(
      z.object({ semantic_id: semanticId, constraint: text }).strict(),
      "semantic_id",
    ).nullish(),
    primary_language: z
      .string()
      .regex(/^[a-z]{2}$/u)
      .nullish(),
  })
  .strict();

export const personas = uniqueItems(
  z
    .object({
      semantic_id: semanticId,
      lifecycle: z.literal("ACTIVE"),
      label: text,
      summary: text.nullish(),
      key_characteristics: values.nullish(),
      motivations: values.nullish(),
      barriers_or_concerns: values.nullish(),
      trust_credibility_needs: values.nullish(),
      creator_communication_implications: values.nullish(),
      // Optional context has no frozen display shape. Validate JSON, retain it, do not render arbitrary keys.
      geography_context: z.record(jsonValue).nullish(),
      demographic_context: z.record(jsonValue).nullish(),
    })
    .strict(),
  "semantic_id",
);

export const visualStyle = z
  .object({
    summary: text.nullish(),
    style_traits: traits.nullish(),
    imagery_style: z
      .object({
        photographic_tendencies: values.nullish(),
        subject_tendencies: values.nullish(),
        mood_or_treatment: values.nullish(),
      })
      .strict()
      .nullish(),
    graphic_treatment: z
      .object({ traits: values.nullish() })
      .strict()
      .nullish(),
    visual_constraints: uniqueItems(
      z.object({ semantic_id: semanticId, rule: text }).strict(),
      "semantic_id",
    ).nullish(),
  })
  .strict();

export const serviceability = z
  .object({
    overall_scope: z
      .enum(["LOCAL", "REGIONAL", "COUNTRY", "MULTI_COUNTRY", "GLOBAL"])
      .nullish(),
    coverage_is_heterogeneous: z.boolean().optional(),
    serviceable_markets: uniqueItems(
      z
        .object({
          semantic_id: semanticId,
          scope: z.enum([
            "LOCAL",
            "REGIONAL",
            "COUNTRY",
            "MULTI_COUNTRY_MEMBER",
            "GLOBAL",
          ]),
          label: text.nullable(),
          country_code: z
            .string()
            .regex(/^[A-Z]{2}$/u)
            .nullable(),
          locality: text.nullable(),
          region: text.nullable(),
          radius_km: z.number().finite().nonnegative().nullable(),
        })
        .strict(),
      "semantic_id",
    ).nullish(),
    mixed_coverage_note: text.nullish(),
  })
  .strict();

const visualItem = z
  .object({
    id: z.string().uuid(),
    authority,
    revision: z.number().int().positive(),
    lifecycle: z.enum(["ACTIVE", "INACTIVE"]),
    label: z.string().nullable(),
  })
  .strict();
export const visualAsset = visualItem
  .extend({
    url: safeUrl,
    role: z.enum(["LOGO", "ALTERNATE_MARK", "REFERENCE_IMAGE"]),
  })
  .strict();
export const visualColor = visualItem
  .extend({ value: text, usage: z.string().nullable() })
  .strict();
export const visualFont = visualItem
  .extend({ family: text, usage: z.string().nullable() })
  .strict();

export const location = z
  .object({
    locationId: z.string().uuid(),
    lifecycle: z.enum(["ACTIVE", "INACTIVE"]),
    authority,
    observationFreshness: z.enum(["CURRENT", "POSSIBLY_STALE", "UNKNOWN"]),
    reconciliationState: z.enum(["UNVERIFIED", "MATCHED", "AMBIGUOUS"]),
    lastObservedAt: z.string().datetime({ offset: true }).nullable(),
    name: z.string().nullable(),
    address: z.string(),
    city: z.string().nullable(),
    zip: z.string().nullable(),
    latitude: z.number().finite().min(-90).max(90).nullable(),
    longitude: z.number().finite().min(-180).max(180).nullable(),
    contactDetails: jsonValue,
    editability: z.literal("POLICY_PENDING"),
  })
  .strict();
