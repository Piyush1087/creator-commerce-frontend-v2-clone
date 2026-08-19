import { z } from "zod";

import type {
  CollaborationDetailResponse,
  CollaborationMessageRow,
  CollaborationThreadRow,
  ListMessagesResponse,
  ListThreadsResponse,
} from "../contracts/collaboration.contracts";

const lifecycleSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
  "TERMINATED",
]);
const stageSchema = z.enum([
  "NEGOTIATION",
  "SECUREMENT",
  "FULFILLMENT",
  "PRODUCTION",
  "PUBLISHING_SETTLEMENT",
]);
const stageStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
  "SKIPPED",
]);
const actorSchema = z.enum(["BRAND", "CREATOR", "SYSTEM", "ADMIN", "NONE"]);

const identitySummarySchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().nullable(),
    handle: z.string().nullable().optional(),
    kind: z.enum(["BRAND", "CREATOR"]).optional(),
  })
  .passthrough();

const sourceContextSchema = z
  .object({
    campaign: z.object({ id: z.string().min(1), name: z.string() }).passthrough(),
    campaignAsset: z.record(z.unknown()).nullable(),
    brief: z.object({ id: z.string().min(1), title: z.string() }).passthrough(),
  })
  .passthrough();

const workflowSchema = z
  .object({
    stage: stageSchema,
    status: stageStatusSchema,
    actionRequiredBy: actorSchema,
    availableActions: z.array(z.string()),
    aggregateVersion: z.number().int().nonnegative(),
  })
  .passthrough();

const legacyCompatibilitySchema = z.object({
  applied: z.literal(true),
  reason: z.string(),
  fields: z.array(z.string()),
});

const threadBaseSchema = z
  .object({
    collaborationId: z.string().min(1),
    counterpart: identitySummarySchema,
    sourceContext: sourceContextSchema,
    lifecycle: lifecycleSchema,
    workflow: workflowSchema,
    inbox: z
      .object({
        unreadCount: z.number().int().nonnegative(),
        lastMessageSnippet: z.string().nullable(),
        lastMessageAt: z.string().nullable(),
      })
      .passthrough(),
    progress: z
      .object({
        stageIndex: z.number().int(),
        stageCount: z.number().int().positive(),
      })
      .passthrough(),
    updatedAt: z.string(),
  })
  .passthrough();

const canonicalThreadSchema = threadBaseSchema.extend({
  projectionSource: z.literal("CANONICAL"),
  legacyCompatibility: z.null(),
});

const compatibilityThreadSchema = threadBaseSchema.extend({
  projectionSource: z.literal("LEGACY_COMPATIBILITY"),
  legacyCompatibility: legacyCompatibilitySchema,
});

export const collaborationThreadSchema = z.discriminatedUnion("projectionSource", [
  canonicalThreadSchema,
  compatibilityThreadSchema,
]);

const deliverableSchema = z
  .object({
    deliverableExecutionId: z.string().min(1),
    sourceBriefDeliverableId: z.string().min(1),
    publishingRequired: z.boolean(),
    availableActions: z.array(z.string()),
  })
  .passthrough();

const detailBaseSchema = z
  .object({
    identity: z
      .object({
        collaborationId: z.string().min(1),
        sourceApplicationId: z.string().nullable(),
        campaignId: z.string().min(1),
        campaignCreatorId: z.string().nullable(),
        campaignAssetId: z.string().nullable(),
        briefId: z.string().min(1),
        brand: identitySummarySchema,
        creator: identitySummarySchema,
      })
      .passthrough(),
    sourceContext: sourceContextSchema,
    lifecycle: z
      .object({
        state: lifecycleSchema,
        completedAt: z.string().nullable(),
        endedFromStage: stageSchema.nullable(),
        endedReason: z
          .object({ code: z.string(), text: z.string().nullable() })
          .nullable(),
        endedByActorClass: actorSchema.nullable(),
        endedByUserId: z.string().nullable(),
        endedAt: z.string().nullable(),
      })
      .passthrough(),
    workflow: workflowSchema,
    deliverables: z.array(deliverableSchema),
    publishingComplete: z.boolean(),
    updatedAt: z.string(),
  })
  .passthrough();

const canonicalDetailSchema = detailBaseSchema.extend({
  projectionSource: z.literal("CANONICAL"),
  legacyCompatibility: z.null(),
});

const compatibilityDetailSchema = detailBaseSchema.extend({
  projectionSource: z.literal("LEGACY_COMPATIBILITY"),
  legacyCompatibility: legacyCompatibilitySchema,
});

export const collaborationDetailSchema = z.discriminatedUnion("projectionSource", [
  canonicalDetailSchema,
  compatibilityDetailSchema,
]);

export const collaborationMessageSchema = z
  .object({
    message_id: z.string().min(1),
    kind: z.enum(["USER", "SYSTEM"]),
    body: z.string(),
    sender_user_id: z.string().nullable(),
    system_event_tag: z.string().nullable(),
    created_at: z.string(),
  })
  .passthrough();

const listThreadsResponseSchema = z.object({ rows: z.array(collaborationThreadSchema) });
const listMessagesResponseSchema = z.object({
  messages: z.array(collaborationMessageSchema),
});

export class CollaborationReadContractError extends Error {
  readonly code = "COLLABORATION_READ_CONTRACT_INVALID";

  constructor(readonly surface: "threads" | "detail" | "messages") {
    super("Collaboration data could not be loaded safely.");
  }
}

function parseRead<T>(
  surface: "threads" | "detail" | "messages",
  parser: z.ZodType,
  value: unknown,
): T {
  const parsed = parser.safeParse(value);
  if (!parsed.success) {
    if (import.meta.env.DEV) {
      console.error("Collaboration read contract rejected", {
        surface,
        issues: parsed.error.issues.map(({ code, path }) => ({ code, path })),
      });
    }
    throw new CollaborationReadContractError(surface);
  }
  return parsed.data as T;
}

export function parseCollaborationThreads(value: unknown): ListThreadsResponse {
  return parseRead<ListThreadsResponse>("threads", listThreadsResponseSchema, value);
}

export function parseCollaborationDetail(value: unknown): CollaborationDetailResponse {
  return parseRead<CollaborationDetailResponse>("detail", collaborationDetailSchema, value);
}

export function parseCollaborationMessages(value: unknown): ListMessagesResponse {
  return parseRead<ListMessagesResponse>("messages", listMessagesResponseSchema, value);
}

export function isCompatibilityThread(
  row: CollaborationThreadRow,
): row is CollaborationThreadRow & { projectionSource: "LEGACY_COMPATIBILITY" } {
  return row.projectionSource === "LEGACY_COMPATIBILITY";
}

export function isCompatibilityDetail(
  detail: CollaborationDetailResponse,
): detail is CollaborationDetailResponse & {
  projectionSource: "LEGACY_COMPATIBILITY";
} {
  return detail.projectionSource === "LEGACY_COMPATIBILITY";
}

export type ParsedCollaborationMessage = CollaborationMessageRow;
