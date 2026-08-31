import { z } from "zod";

export const offeringKindSchema = z.enum(["PRODUCT", "SERVICE", "EXPERIENCE", "BUNDLE"]);
export const offeringLifecycleSchema = z.enum(["DRAFT_INCOMPLETE", "ACTIVE", "PAUSED_INACTIVE"]);
export const canonicalOfferingIndexSchema = z.object({
  offerings: z.array(z.object({
    offeringId: z.string().uuid(), name: z.string(), kind: offeringKindSchema,
    subtype: z.string().nullable(), lifecycle: offeringLifecycleSchema,
  }).strict()),
}).strict();

const readiness = z.enum(["READY", "PARTIAL", "NOT_READY"]);
const freshness = z.enum(["CURRENT", "STALE", "UNKNOWN"]);
const candidate = z.object({ status: z.enum(["NONE", "AVAILABLE", "CONFLICT"]), count: z.number().int().nonnegative(), currentPreserved: z.boolean(), summaryAvailable: z.boolean(), rawCandidateVisible: z.literal(false) }).strict();
const contract = z.object({ id: z.string().min(1), version: z.string().min(1) }).strict();
const current = z.union([
  z.object({ kind: z.literal("VALUE"), value: z.unknown() }).strict(),
  z.object({ kind: z.enum(["EXPLICIT_NULL", "INTENTIONALLY_ABSENT", "NO_CURRENT", "NOT_EVALUATED", "NOT_OWNED"]) }).strict(),
]);
const objectBase = {
  current, readiness, freshness,
  authority: z.enum(["observed", "creator_shop", "confirmed", "protected", "system_managed", "mixed"]),
  candidate,
  lineage: z.object({ objectContract: contract.nullable(), outputContract: contract.nullable(), mixedGeneration: z.boolean(), mixedContractVersion: z.boolean(), components: z.array(z.object({ semanticPath: z.string().min(1), currentContract: contract, revision: z.string().regex(/^\d+$/u), generatedAt: z.string().datetime() }).strict()) }).strict(),
};
const factualObject = z.object({ semanticId: z.literal("offering_factual_profile"), ...objectBase }).strict();
const creatorObject = z.object({ semanticId: z.literal("offering_creator_communication_profile"), ...objectBase }).strict();
const actionabilityObject = z.object({ semanticId: z.literal("offering_actionability_profile"), ...objectBase }).strict();
const runtime = (processorId: "offering_factual_synthesis" | "offering_creator_communication" | "offering_actionability_synthesis", objectSemanticId: "offering_factual_profile" | "offering_creator_communication_profile" | "offering_actionability_profile") => z.object({
  processorId: z.literal(processorId), objectSemanticId: z.literal(objectSemanticId), readiness, freshness,
  activity: z.enum(["IDLE", "WAITING_FOR_EVIDENCE", "WAITING_FOR_DEPENDENCY", "READY_TO_RUN", "RETRY_SCHEDULED", "LEARNING", "REFRESHING", "TEMPORARILY_UNAVAILABLE"]),
  dependencyReadiness: z.enum(["UNKNOWN", "WAITING_FOR_EVIDENCE", "WAITING_FOR_DEPENDENCY", "READY_TO_RUN"]),
  latestExecutionStatus: z.enum(["WAITING_FOR_DEPENDENCY", "QUEUED", "RUNNING", "COMPLETED", "FAILED_TERMINAL", "CANCELLED"]).nullable(), reasonCode: z.string().nullable(), hasCurrent: z.boolean(), refreshing: z.boolean(),
  failure: z.object({ category: z.string().nullable(), code: z.string(), currentPreserved: z.boolean(), retryEligible: z.boolean() }).strict().nullable(), candidate,
  currentLineage: z.object({ generatedAt: z.array(z.string().datetime()), revisions: z.array(z.string().regex(/^\d+$/u)), mixedGeneration: z.boolean(), objectContract: contract.nullable(), outputContract: contract.nullable() }).strict().nullable(),
}).strict();
const canonicalPrice = z.discriminatedUnion("state", [z.object({ state: z.literal("UNAVAILABLE") }).strict(), z.object({
  state: z.literal("CURRENT"), revisionId: z.string().uuid(), mode: z.enum(["EXACT", "STARTING_AT", "RANGE", "NOT_PUBLICLY_LISTED"]), currentMinAmount: z.string().nullable(), currentMaxAmount: z.string().nullable(), regularMinAmount: z.string().nullable(), regularMaxAmount: z.string().nullable(), currency: z.string().regex(/^[A-Z]{3}$/u), freshness, authority: z.string().min(1), evaluatedAt: z.string().datetime(),
}).strict()]);

export const productConsumerSchema = z.object({
  offering: z.object({ id: z.string().uuid(), kind: offeringKindSchema.nullable(), subtype: z.string().nullable(), lifecycle: z.discriminatedUnion("state", [z.object({ state: z.literal("UNRESOLVED") }).strict(), z.object({ state: z.literal("RESOLVED"), value: offeringLifecycleSchema }).strict()]), name: z.string(), description: z.string().nullable(), customerDestination: z.string().url(), primaryMedia: z.object({ id: z.string().uuid(), url: z.string().url(), label: z.string().nullable(), altText: z.string().nullable() }).strict().nullable(), canonicalPrice, offerRefs: z.array(z.object({ offerId: z.string().uuid() }).strict()), locationRefs: z.array(z.object({ locationId: z.string().uuid() }).strict()) }).strict(),
  intelligence: z.object({ factualProfile: factualObject, creatorCommunicationProfile: creatorObject, actionabilityProfile: actionabilityObject }).strict(),
  processorRuntime: z.object({ offering_factual_synthesis: runtime("offering_factual_synthesis", "offering_factual_profile"), offering_creator_communication: runtime("offering_creator_communication", "offering_creator_communication_profile"), offering_actionability_synthesis: runtime("offering_actionability_synthesis", "offering_actionability_profile") }).strict(),
}).strict();

export const manualPriceInputSchema = z.object({ mode: z.enum(["EXACT", "STARTING_AT", "RANGE", "NOT_PUBLICLY_LISTED"]), currentMinAmount: z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/u).nullable().optional(), currentMaxAmount: z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/u).nullable().optional(), regularReferenceMinAmount: z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/u).nullable().optional(), regularReferenceMaxAmount: z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/u).nullable().optional(), currency: z.string().regex(/^[A-Za-z]{3}$/u) }).strict().superRefine((v, ctx) => {
  if (v.mode === "EXACT" && (!v.currentMinAmount || v.currentMinAmount !== v.currentMaxAmount)) ctx.addIssue({ code: "custom", path: ["currentMaxAmount"], message: "Exact prices must match." });
  if (v.mode === "STARTING_AT" && (!v.currentMinAmount || v.currentMaxAmount != null)) ctx.addIssue({ code: "custom", path: ["currentMinAmount"], message: "Enter one starting price." });
  if (v.mode === "RANGE" && (!v.currentMinAmount || !v.currentMaxAmount || Number(v.currentMinAmount) > Number(v.currentMaxAmount))) ctx.addIssue({ code: "custom", path: ["currentMaxAmount"], message: "Maximum must be at least the minimum." });
  if (v.mode === "NOT_PUBLICLY_LISTED" && (v.currentMinAmount != null || v.currentMaxAmount != null)) ctx.addIssue({ code: "custom", path: ["currentMinAmount"], message: "Remove amounts for a non-public price." });
});

export type CanonicalOfferingIndex = z.infer<typeof canonicalOfferingIndexSchema>;
export type ProductConsumer = z.infer<typeof productConsumerSchema>;
export type ManualPriceInput = z.infer<typeof manualPriceInputSchema>;
