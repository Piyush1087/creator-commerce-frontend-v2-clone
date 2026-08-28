import type { BrandRuntimeActivity } from "../contracts/brand-centre-brand.contracts";
import {
  BRAND_PROCESSOR_IDS,
  BRAND_PROCESSOR_OBJECT_OWNERSHIP,
  type BrandObjectSemanticId,
  type BrandProcessorRuntime,
  type BrandProcessorRuntimeEntry,
} from "../schemas/brand-processor-runtime";

export type BrandObjectRuntimeActivities = Record<
  BrandObjectSemanticId,
  BrandRuntimeActivity
>;

export function processorPresentationActivity(
  activity: BrandProcessorRuntimeEntry["activity"],
): BrandRuntimeActivity {
  if (
    activity === "LEARNING" ||
    activity === "REFRESHING" ||
    activity === "TEMPORARILY_UNAVAILABLE"
  )
    return activity;
  return "NONE";
}

export function mapBrandObjectRuntimeActivities(
  runtime: BrandProcessorRuntime,
): BrandObjectRuntimeActivities {
  return {
    communication_profile: processorPresentationActivity(
      runtime.brand_communication.activity,
    ),
    brand_description: processorPresentationActivity(
      runtime.brand_meaning.activity,
    ),
    positioning: processorPresentationActivity(runtime.brand_meaning.activity),
    value_proposition: processorPresentationActivity(
      runtime.brand_meaning.activity,
    ),
    brand_values: processorPresentationActivity(
      runtime.brand_character.activity,
    ),
    brand_personality: processorPresentationActivity(
      runtime.brand_character.activity,
    ),
    audience_personas: processorPresentationActivity(
      runtime.audience_persona_synthesis.activity,
    ),
    differentiation_and_proof: processorPresentationActivity(
      runtime.brand_differentiation.activity,
    ),
    visual_style_profile: processorPresentationActivity(
      runtime.visual_style_synthesis.activity,
    ),
    serviceability_profile: processorPresentationActivity(
      runtime.serviceability_synthesis.activity,
    ),
  };
}

const POLLING_ACTIVITIES = new Set<BrandProcessorRuntimeEntry["activity"]>([
  "LEARNING",
  "REFRESHING",
  "READY_TO_RUN",
  "RETRY_SCHEDULED",
]);

export function shouldPollProcessorRuntime(
  runtime: BrandProcessorRuntime | undefined,
): boolean {
  return (
    runtime !== undefined &&
    BRAND_PROCESSOR_IDS.some((processorId) =>
      POLLING_ACTIVITIES.has(runtime[processorId].activity),
    )
  );
}

export const BRAND_OWNED_OBJECT_COUNT = BRAND_PROCESSOR_IDS.reduce(
  (count, processorId) =>
    count + BRAND_PROCESSOR_OBJECT_OWNERSHIP[processorId].length,
  0,
);
