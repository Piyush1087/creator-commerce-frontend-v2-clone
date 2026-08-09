import { z } from "zod";

import {
  CoPilotChatPayloadSchema,
  HitlResolutionSchema,
  ResponseFormatTypeSchema,
} from "../schemas/co-pilot-payload.schema";

export const CoPilotScopeContextSchema = z.enum([
  "GLOBAL",
  "BRAND_CENTRE",
  "ANALYTICS",
  "ESCROW",
]);

export const CoPilotThreadStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);

export const CoPilotThreadRowSchema = z.object({
  threadId: z.string().uuid(),
  title: z.string(),
  scopeContext: CoPilotScopeContextSchema,
  lastMessageAt: z.string().datetime(),
  archivedAt: z.string().datetime().nullable(),
  status: CoPilotThreadStatusSchema,
  createdAt: z.string().datetime(),
});

export const CoPilotMessageRowSchema = z.object({
  id: z.string().uuid(),
  threadId: z.string().uuid(),
  role: z.enum(["USER", "ASSISTANT", "SYSTEM"]),
  textContent: z.string().nullable(),
  payload: z.record(z.unknown()).nullable(),
  formatType: ResponseFormatTypeSchema.nullable(),
  createdAt: z.string().datetime(),
});

export const CoPilotThreadListResponseSchema = z.object({
  threads: z.array(CoPilotThreadRowSchema),
});

export const CoPilotThreadDetailResponseSchema = z.object({
  thread: CoPilotThreadRowSchema,
  messages: z.array(CoPilotMessageRowSchema),
});

export const CoPilotCreateThreadResponseSchema = CoPilotThreadDetailResponseSchema;

export const CoPilotPostMessageResponseSchema = z.object({
  userMessage: CoPilotMessageRowSchema,
  assistantMessage: CoPilotMessageRowSchema.extend({
    payload: CoPilotChatPayloadSchema,
  }),
});

export const CoPilotHitlConfirmResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
  result: z.record(z.unknown()),
  hitlResolution: HitlResolutionSchema.optional(),
  pendingBrandCentreJobId: z.string().uuid().optional(),
});

export const CoPilotHitlDiscardResponseSchema = z.object({
  ok: z.literal(true),
  hitlResolution: HitlResolutionSchema.optional(),
});

export const CoPilotUsageSnapshotSchema = z.object({
  featureKey: z.literal("MAX_AI_CHATS"),
  current: z.number(),
  limit: z.number(),
  resetAt: z.string().datetime().nullable(),
  percentUsed: z.number(),
  warningLevel: z.enum(["ok", "warn", "critical", "exhausted"]),
  warningMessage: z.string().nullable(),
  canSend: z.boolean(),
  tier: z.string(),
});

export const CoPilotUsageResponseSchema = z.object({
  usage: CoPilotUsageSnapshotSchema.nullable(),
});

export type CoPilotThreadStatus = z.infer<typeof CoPilotThreadStatusSchema>;
export type CoPilotScopeContext = z.infer<typeof CoPilotScopeContextSchema>;
export type CoPilotThreadRow = z.infer<typeof CoPilotThreadRowSchema>;
export type CoPilotMessageRow = z.infer<typeof CoPilotMessageRowSchema>;
export type CoPilotPostMessageResponse = z.infer<
  typeof CoPilotPostMessageResponseSchema
>;
export type CoPilotHitlConfirmResponse = z.infer<
  typeof CoPilotHitlConfirmResponseSchema
>;
export type HitlResolution = z.infer<typeof HitlResolutionSchema>;
export type CoPilotHitlDiscardResponse = z.infer<
  typeof CoPilotHitlDiscardResponseSchema
>;
export type CoPilotUsageSnapshot = z.infer<typeof CoPilotUsageSnapshotSchema>;

export function isCoPilotThreadListResponse(
  value: unknown,
): value is z.infer<typeof CoPilotThreadListResponseSchema> {
  return CoPilotThreadListResponseSchema.safeParse(value).success;
}

export function isCoPilotThreadDetailResponse(
  value: unknown,
): value is z.infer<typeof CoPilotThreadDetailResponseSchema> {
  return CoPilotThreadDetailResponseSchema.safeParse(value).success;
}

export function isCoPilotPostMessageResponse(
  value: unknown,
): value is CoPilotPostMessageResponse {
  return CoPilotPostMessageResponseSchema.safeParse(value).success;
}

export function isCoPilotHitlConfirmResponse(
  value: unknown,
): value is CoPilotHitlConfirmResponse {
  return CoPilotHitlConfirmResponseSchema.safeParse(value).success;
}

export function isCoPilotHitlDiscardResponse(
  value: unknown,
): value is CoPilotHitlDiscardResponse {
  return CoPilotHitlDiscardResponseSchema.safeParse(value).success;
}

export function isCoPilotUsageResponse(
  value: unknown,
): value is z.infer<typeof CoPilotUsageResponseSchema> {
  return CoPilotUsageResponseSchema.safeParse(value).success;
}
