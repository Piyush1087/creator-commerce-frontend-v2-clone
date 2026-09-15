import { z } from "zod";
import { CREATOR_ARCHETYPES } from "../../uce/components/creator-strategy/creator-strategy-model";
const CreatorBrandArchetypeIdSchema = z
  .string()
  .refine(
    (id) => CREATOR_ARCHETYPES.some(([value]) => value === id),
    "Canonical Creator archetype required",
  );
import {
  CREATOR_BRAND_BOUNDS as B,
  CREATOR_BRAND_NICHE_IDS,
  CREATOR_BRAND_VOICE_IDS,
} from "./creator-brand-taxonomies";

/** Projection from existing canonical owners; never stored/mutated as Brand. */
export type CreatorBrandProjectedIdentity = Readonly<{
  creatorName: string | null;
  avatarImageReference: string | null;
  primaryInstagramHandle: string | null;
}>;

export const CreatorBrandNicheIdSchema = z.enum(CREATOR_BRAND_NICHE_IDS);
export const CreatorBrandVoiceIdSchema = z.enum(CREATOR_BRAND_VOICE_IDS);
export const CreatorBrandPaletteColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/u)
  .transform((value) => value.toUpperCase());
export const CreatorBrandLanguageSchema = z
  .string()
  .min(2)
  .max(100)
  .refine((value) => {
    try {
      return Intl.getCanonicalLocales(value).length === 1;
    } catch {
      return false;
    }
  }, "Valid BCP-47 tag required")
  .transform((value) => Intl.getCanonicalLocales(value)[0]);
export const CreatorBrandVisualDescriptorSchema = z
  .string()
  .trim()
  .min(1)
  .max(B.visualDescriptorCharacters);
const unique = <T extends z.ZodTypeAny>(schema: T, maximum: number) =>
  z
    .array(schema)
    .max(maximum)
    .refine(
      (values) => new Set(values).size === values.length,
      "Duplicate canonical values rejected",
    );

/** No name/avatar/handle, source identity, willingness or caller-selected subject. */
export const CreatorBrandProfileInputSchema = z
  .object({
    headline: z.string().trim().min(1).max(B.headlineCharacters).nullable(),
    commercialBio: z
      .string()
      .trim()
      .min(1)
      .max(B.commercialBioCharacters)
      .nullable(),
    primaryNicheIds: unique(CreatorBrandNicheIdSchema, B.primaryNiches),
    creatorArchetypeIds: unique(
      CreatorBrandArchetypeIdSchema,
      B.configuredArchetypes,
    ),
    archetypeState: z.enum(["UNCONFIGURED", "CONFIRMED"]),
    voiceDescriptorIds: unique(CreatorBrandVoiceIdSchema, B.voiceDescriptors),
    voiceDescription: z
      .string()
      .trim()
      .min(1)
      .max(B.voiceDescriptionCharacters)
      .nullable(),
    visualStyleDescriptors: unique(
      CreatorBrandVisualDescriptorSchema,
      B.visualDescriptors,
    ),
    palette: unique(CreatorBrandPaletteColorSchema, B.paletteColors).nullable(),
    languages: unique(CreatorBrandLanguageSchema, B.languages),
  })
  .strict()
  .superRefine((profile, context) => {
    if (
      (profile.creatorArchetypeIds.length === 0) !==
      (profile.archetypeState === "UNCONFIGURED")
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["archetypeState"],
        message:
          "Empty selection is partial/unconfigured; confirmed selection requires 1..3 IDs",
      });
  });
export type CreatorBrandProfileInput = z.infer<
  typeof CreatorBrandProfileInputSchema
>;

export const CreatorBrandActionSchema = z.enum([
  "CREATOR_BRAND_READ",
  "CREATOR_BRAND_EDIT",
  "CREATOR_BRAND_CONFIRM_SUGGESTION",
]);
export const suggestionReferenceSchema = z
  .object({
    objectGenerationId: z.string().uuid(),
    componentGenerationId: z.string().uuid(),
    candidateId: z.string().regex(/^[a-f0-9]{64}$/u),
  })
  .strict();
const concurrency = {
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey: z.string().uuid(),
};
export const CreatorBrandMutationRequestSchema = z.discriminatedUnion(
  "intent",
  [
    z
      .object({
        ...concurrency,
        intent: z.literal("MANUAL"),
        values: CreatorBrandProfileInputSchema,
      })
      .strict(),
    z
      .object({
        ...concurrency,
        intent: z.literal("USE_SUGGESTION"),
        suggestionReference: suggestionReferenceSchema,
      })
      .strict(),
    z
      .object({
        ...concurrency,
        intent: z.literal("EDIT_SUGGESTION"),
        suggestionReference: suggestionReferenceSchema,
        values: CreatorBrandProfileInputSchema,
      })
      .strict(),
  ],
);
export type CreatorBrandCommand = z.infer<
  typeof CreatorBrandMutationRequestSchema
>;
export const emptyCreatorBrandProfile = (): CreatorBrandProfileInput => ({
  headline: null,
  commercialBio: null,
  primaryNicheIds: [],
  creatorArchetypeIds: [],
  archetypeState: "UNCONFIGURED",
  voiceDescriptorIds: [],
  voiceDescription: null,
  visualStyleDescriptors: [],
  palette: null,
  languages: [],
});
