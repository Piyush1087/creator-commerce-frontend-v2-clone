import { z } from "zod";
import { isCanonicalComponentPath } from "../contracts/brand-component-path";

export const semanticId = z
  .string()
  .refine((value) => value.trim().length > 0, "Stable identity is required");
export const readiness = z.enum(["READY", "PARTIAL", "NOT_READY"]);
export const freshness = z.enum(["CURRENT", "STALE", "UNKNOWN"]);
export const authority = z.enum([
  "observed",
  "creator_shop",
  "confirmed",
  "protected",
  "system_managed",
  "mixed",
]);
export const runtimeActivity = z.enum([
  "NONE",
  "LEARNING",
  "REFRESHING",
  "TEMPORARILY_UNAVAILABLE",
]);
export const candidate = z
  .object({
    status: z.enum(["NONE", "AVAILABLE", "CONFLICT"]),
    count: z.number().int().nonnegative(),
    currentPreserved: z.boolean(),
    summaryAvailable: z.boolean(),
    rawCandidateVisible: z.literal(false),
  })
  .strict();

export const fieldMeta = z
  .object({
    semanticId,
    readiness,
    resultReadiness: readiness,
    freshness,
    authority,
    editability: z.enum(["READ_ONLY", "POLICY_PENDING"]),
    candidate: candidate.optional(),
  })
  .strict();

export function currentValue<T extends z.ZodTypeAny>(value: T) {
  return z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("VALUE"), value }).strict(),
    z.object({ kind: z.literal("EXPLICIT_NULL") }).strict(),
    z.object({ kind: z.literal("INTENTIONALLY_ABSENT") }).strict(),
    z.object({ kind: z.literal("NO_CURRENT") }).strict(),
    z.object({ kind: z.literal("NOT_EVALUATED") }).strict(),
    z.object({ kind: z.literal("NOT_OWNED") }).strict(),
  ]);
}

export function field<T extends z.ZodTypeAny>(value: T) {
  return fieldMeta.extend({ current: currentValue(value) }).strict();
}

const componentPath = z
  .string()
  .refine(
    isCanonicalComponentPath,
    "Expected a canonical typed component path",
  );
const componentMeta = z
  .record(componentPath, fieldMeta)
  .superRefine((entries, context) => {
    for (const [path, meta] of Object.entries(entries)) {
      if (path !== meta.semanticId)
        context.addIssue({
          code: "custom",
          path: [path],
          message: "Component path and identity must agree",
        });
    }
  });

export function intelligenceField<T extends z.ZodTypeAny>(value: T) {
  return field(value)
    .extend({
      candidate,
      mixedGeneration: z.boolean(),
      componentMeta,
    })
    .strict();
}

export function uniqueItems<T extends z.ZodTypeAny>(item: T, key: string) {
  return z.array(item).superRefine((items, context) => {
    const seen = new Set<string>();
    for (const [index, value] of items.entries()) {
      const id: unknown = value[key];
      if (typeof id !== "string" || seen.has(id)) {
        context.addIssue({
          code: "custom",
          path: [index, key],
          message: "Collection identities must be present and unique",
        });
      } else seen.add(id);
    }
  });
}

export const safeUrl = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  }, "Expected a public HTTP(S) URL");

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
export const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(jsonValue),
  ]),
);
