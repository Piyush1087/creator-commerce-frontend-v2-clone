import { z } from "zod";
const candidateValue = z.union([
  z.string().min(1).max(300),
  z.array(z.string().min(1).max(100)).min(1).max(10),
  z
    .object({
      kind: z.literal("COLOR_WORDS"),
      words: z.array(z.string().min(1).max(100)).min(1).max(5),
    })
    .strict(),
]);
const candidate = z
  .object({
    candidateId: z.string().regex(/^[a-f0-9]{64}$/u),
    field: z.enum([
      "primaryNicheIds",
      "headline",
      "voiceDescriptorIds",
      "voiceDescription",
      "creatorArchetypeIds",
      "visualStyleDescriptors",
      "paletteCue",
      "languageTags",
    ]),
    value: candidateValue,
    confidence: z.enum(["LOW", "MEDIUM"]),
    supportingPosts: z.number().int().min(3).max(24),
    componentGenerationId: z.string().uuid(),
    confirmable: z.boolean(),
  })
  .strict();
const section = z
  .object({
    availability: z.enum(["AVAILABLE", "INSUFFICIENT_EVIDENCE"]),
    candidates: z.array(candidate).max(2),
  })
  .strict();
export const CreatorBrandSuggestionProjectionSchema = z
  .object({
    contractVersion: z.literal("creator-brand-suggestions-v0.1"),
    state: z.enum(["AVAILABLE", "PARTIAL", "UNAVAILABLE", "STALE", "DEGRADED"]),
    freshness: z.enum(["CURRENT", "STALE", "UNKNOWN"]),
    processing: z.enum(["IDLE", "PROCESSING", "FAILED"]),
    objectGenerationId: z.string().uuid().nullable(),
    autoApply: z.literal(false),
    coverage: z.number().min(0).max(1),
    eligiblePosts: z.number().int().min(0).max(24),
    limitations: z.array(z.string().max(160)).max(8),
    families: z
      .object({
        positioning: section,
        voice_personality: section,
        creator_style: section,
        visual_identity: section,
        languages: section,
      })
      .strict(),
  })
  .strict();

export type CreatorBrandCandidate = z.infer<typeof candidate>;
