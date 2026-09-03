import { z } from "zod";

export const CHAT_RESPONSE_STATUSES = [
  "ANSWERED",
  "PARTIAL",
  "STALE",
  "CAPABILITY_UNAVAILABLE",
  "NOT_AUTHORIZED",
  "NAVIGATION",
] as const;

export const CHAT_ENTITY_TYPES = [
  "BRAND",
  "OFFERING",
  "CAMPAIGN",
  "COLLABORATION",
  "SETTINGS",
  "PROVIDER",
] as const;

export const CHAT_DESTINATION_IDS = [
  "HOME",
  "BRAND_CENTRE",
  "OFFERINGS",
  "CAMPAIGNS",
  "COLLABORATIONS",
  "SETTINGS",
  "SETTINGS_INTEGRATIONS",
  "SETTINGS_BILLING",
] as const;

export const ChatEntityRefSchema = z
  .object({
    type: z.enum(CHAT_ENTITY_TYPES),
    id: z.string().trim().min(1).max(128),
  })
  .strict();

export const ChatGroundingRefSchema = z
  .object({
    sourceType: z.enum(["CANONICAL", "INTELLIGENCE"]),
    capabilityId: z.string().trim().min(1).max(128),
    entityRefs: z.array(ChatEntityRefSchema),
    readiness: z.string().trim().min(1).max(64).optional(),
    freshness: z.string().trim().min(1).max(64).optional(),
    resultRefs: z.array(z.string().trim().min(1).max(128)).optional(),
  })
  .strict();

export const ChatNavigationSchema = z
  .object({
    destinationId: z.enum(CHAT_DESTINATION_IDS),
    entityRef: ChatEntityRefSchema.optional(),
  })
  .strict()
  .superRefine((navigation, context) => {
    const expectedType =
      navigation.destinationId === "BRAND_CENTRE"
        ? "BRAND"
        : navigation.destinationId === "OFFERINGS"
        ? "OFFERING"
        : navigation.destinationId === "CAMPAIGNS"
          ? "CAMPAIGN"
          : navigation.destinationId === "COLLABORATIONS"
            ? "COLLABORATION"
          : null;

    if (expectedType && navigation.entityRef?.type !== expectedType) {
      if (navigation.entityRef) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${navigation.destinationId} only accepts ${expectedType} entities`,
          path: ["entityRef", "type"],
        });
      }
      return;
    }

    if (!expectedType && navigation.entityRef) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${navigation.destinationId} does not accept an entity`,
        path: ["entityRef"],
      });
    }
  });

export const ChatGroundedResponseSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    status: z.enum(CHAT_RESPONSE_STATUSES),
    answer: z.string().max(20_000),
    grounding: z.array(ChatGroundingRefSchema),
    entityRefs: z.array(ChatEntityRefSchema),
    freshnessNotes: z.array(z.string().max(500)),
    limitations: z.array(z.string().max(500)),
    recommendation: z
      .object({
        text: z.string().trim().min(1).max(4_000),
        basisRefs: z.array(z.string().trim().min(1).max(128)).min(1),
        nonMutating: z.literal(true),
      })
      .strict()
      .optional(),
    navigation: ChatNavigationSchema.optional(),
  })
  .strict()
  .superRefine((response, context) => {
    if (response.status === "NAVIGATION" && !response.navigation) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "NAVIGATION status requires navigation metadata",
        path: ["navigation"],
      });
    }
    if (response.status !== "NAVIGATION" && response.navigation) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Navigation metadata requires NAVIGATION status",
        path: ["navigation"],
      });
    }
  });

export const ChatConversationSchema = z
  .object({
    id: z.string().uuid(),
    brandProfileId: z.string().uuid(),
    createdByUserId: z.string().uuid(),
    title: z.string(),
    scopeContext: z.enum(["GLOBAL", "BRAND_CENTRE", "ANALYTICS", "ESCROW"]),
    linkedEntityType: z.enum([
      "CAMPAIGN",
      "COLLABORATION",
      "PLANNER_CARD",
      "NONE",
    ]),
    linkedEntityId: z.string().nullable(),
    archivedAt: z.string().datetime().nullable(),
    lastMessageAt: z.string().datetime(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const ChatMessageRowSchema = z
  .object({
    id: z.string().uuid(),
    threadId: z.string().uuid(),
    role: z.enum(["USER", "ASSISTANT", "SYSTEM"]),
    textContent: z.string().nullable(),
    payload: z.record(z.unknown()).nullable(),
    formatType: z.string().nullable(),
    createdAt: z.string().datetime(),
  })
  .strict();

export const ChatConversationListSchema = z.array(ChatConversationSchema);

export const ChatConversationDetailSchema = z
  .object({
    conversation: ChatConversationSchema,
    messages: z.array(ChatMessageRowSchema),
  })
  .strict();

export const ChatCreateConversationInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const ChatListConversationsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).optional(),
    includeArchived: z.boolean().optional(),
  })
  .strict();

export const ChatPatchConversationInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    archived: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) => value.title !== undefined || value.archived !== undefined,
    "At least one conversation metadata field is required",
  );

export const ChatTurnRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(8_000),
    surface: z.enum(["HOME", "WORKSPACE", "MODULE"]).optional(),
    routePath: z.string().trim().min(1).max(2_048).optional(),
    selectedEntity: z
      .object({
        type: z.string().trim().min(1).max(64),
        id: z.string().trim().min(1).max(128),
      })
      .strict()
      .optional(),
  })
  .strict();

export type ChatGroundedResponse = z.infer<typeof ChatGroundedResponseSchema>;
export type ChatConversation = z.infer<typeof ChatConversationSchema>;
export type ChatMessageRow = z.infer<typeof ChatMessageRowSchema>;
export type ChatConversationDetail = z.infer<
  typeof ChatConversationDetailSchema
>;
export type ChatCreateConversationInput = z.infer<
  typeof ChatCreateConversationInputSchema
>;
export type ChatListConversationsInput = z.infer<
  typeof ChatListConversationsInputSchema
>;
export type ChatPatchConversationInput = z.infer<
  typeof ChatPatchConversationInputSchema
>;
export type ChatTurnRequest = z.infer<typeof ChatTurnRequestSchema>;
