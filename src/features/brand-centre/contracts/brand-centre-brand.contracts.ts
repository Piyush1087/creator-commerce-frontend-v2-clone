import type { z } from "zod";
import type { brandCentreBrandSchema } from "../schemas/brand-centre-brand-schema";
import type {
  fieldMeta,
  runtimeActivity,
} from "../schemas/brand-consumer-primitives";
import type {
  BrandProcessorRuntime,
  BrandProcessorRuntimeEntry,
} from "../schemas/brand-processor-runtime";

export type BrandWorkspaceProjection = z.infer<typeof brandCentreBrandSchema>;
export type BrandFieldMeta = z.infer<typeof fieldMeta>;
export type BrandRuntimeActivity = z.infer<typeof runtimeActivity>;
export type { BrandProcessorRuntime, BrandProcessorRuntimeEntry };
export type BrandCurrent<T> =
  | { kind: "VALUE"; value: T }
  | {
      kind:
        | "EXPLICIT_NULL"
        | "INTENTIONALLY_ABSENT"
        | "NO_CURRENT"
        | "NOT_EVALUATED"
        | "NOT_OWNED";
    };
export type BrandField<T = unknown> = BrandFieldMeta & {
  current: BrandCurrent<T>;
  mixedGeneration?: boolean;
  componentMeta?: Record<string, BrandFieldMeta>;
};
