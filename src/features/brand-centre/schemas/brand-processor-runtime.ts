import { z } from "zod";

export const BRAND_PROCESSOR_OBJECT_OWNERSHIP = {
  brand_communication: ["communication_profile"],
  brand_meaning: ["brand_description", "positioning", "value_proposition"],
  brand_character: ["brand_values", "brand_personality"],
  audience_persona_synthesis: ["audience_personas"],
  brand_differentiation: ["differentiation_and_proof"],
  visual_style_synthesis: ["visual_style_profile"],
  serviceability_synthesis: ["serviceability_profile"],
} as const;

export const BRAND_PROCESSOR_IDS = [
  "brand_communication",
  "brand_meaning",
  "brand_character",
  "audience_persona_synthesis",
  "brand_differentiation",
  "visual_style_synthesis",
  "serviceability_synthesis",
] as const;

export type BrandProcessorId = (typeof BRAND_PROCESSOR_IDS)[number];
export type BrandObjectSemanticId =
  (typeof BRAND_PROCESSOR_OBJECT_OWNERSHIP)[BrandProcessorId][number];

export const processorRuntimeActivity = z.enum([
  "IDLE",
  "WAITING_FOR_EVIDENCE",
  "WAITING_FOR_DEPENDENCY",
  "READY_TO_RUN",
  "RETRY_SCHEDULED",
  "LEARNING",
  "REFRESHING",
  "TEMPORARILY_UNAVAILABLE",
]);

export const processorExecutionReadiness = z.enum([
  "UNKNOWN",
  "WAITING_FOR_EVIDENCE",
  "WAITING_FOR_DEPENDENCY",
  "READY_TO_RUN",
]);

const latestExecutionStatus = z.enum([
  "WAITING_FOR_DEPENDENCY",
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED_TERMINAL",
  "CANCELLED",
]);

const processorFailure = z
  .object({
    category: z.string().nullable(),
    code: z.string(),
    currentPreserved: z.boolean(),
    retryEligible: z.boolean(),
  })
  .strict();

function processorRuntimeEntry<Id extends BrandProcessorId>(processorId: Id) {
  return z
    .object({
      processorId: z.literal(processorId),
      activity: processorRuntimeActivity,
      readiness: processorExecutionReadiness,
      latestExecutionStatus: latestExecutionStatus.nullable(),
      reasonCode: z.string().nullable(),
      hasCurrent: z.boolean(),
      refreshing: z.boolean(),
      failure: processorFailure.nullable(),
    })
    .strict()
    .superRefine((entry, context) => {
      if (entry.refreshing !== (entry.activity === "REFRESHING"))
        context.addIssue({
          code: "custom",
          path: ["refreshing"],
          message: "Refreshing flag must agree with processor activity",
        });
    });
}

// The accepted backend boundary owns exactly these keys. Do not infer this record.
export const brandProcessorRuntime = z
  .object({
    brand_communication: processorRuntimeEntry("brand_communication"),
    brand_meaning: processorRuntimeEntry("brand_meaning"),
    brand_character: processorRuntimeEntry("brand_character"),
    audience_persona_synthesis: processorRuntimeEntry(
      "audience_persona_synthesis",
    ),
    brand_differentiation: processorRuntimeEntry("brand_differentiation"),
    visual_style_synthesis: processorRuntimeEntry("visual_style_synthesis"),
    serviceability_synthesis: processorRuntimeEntry("serviceability_synthesis"),
  })
  .strict();

export type BrandProcessorRuntime = z.infer<typeof brandProcessorRuntime>;
export type BrandProcessorRuntimeEntry =
  BrandProcessorRuntime[BrandProcessorId];
