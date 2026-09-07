import { z } from "zod";

export const CREATOR_HOME_DESTINATIONS = [
  "CREATOR_CAMPAIGNS",
  "CREATOR_OPPORTUNITY_DETAIL",
  "CREATOR_APPLICATIONS",
  "CREATOR_APPLICATION_DETAIL",
  "CREATOR_COLLABORATIONS",
  "CREATOR_COLLABORATION_THREAD",
  "CREATOR_SETTINGS",
  "CREATOR_SETTINGS_INSTAGRAM",
] as const;

const destinationSchema = z
  .object({
    destinationId: z.enum(CREATOR_HOME_DESTINATIONS),
    entityId: z.string().trim().min(1).max(128).optional(),
  })
  .strict();

const actionSchema = z
  .object({
    state: z.enum(["AVAILABLE", "READ_ONLY", "HIDDEN"]),
    destination: destinationSchema.nullable(),
    reasonCode: z.string().trim().min(1).max(128).nullable(),
  })
  .strict();

const itemSchema = z
  .object({
    id: z.string().trim().min(1).max(300),
    kind: z.enum([
      "ATTENTION",
      "APPLICATION",
      "COLLABORATION",
      "CAMPAIGN",
      "ACTIVITY",
    ]),
    title: z.string().trim().min(1).max(500),
    subtitle: z.string().trim().min(1).max(1_000),
    status: z.string().trim().min(1).max(128).nullable(),
    occurredAt: z.string().datetime().nullable(),
    unreadCount: z.number().int().nonnegative().nullable(),
    availableActions: z.array(z.string().trim().min(1).max(128)).max(30),
    action: actionSchema.nullable(),
    source: z.enum([
      "SETTINGS",
      "OPPORTUNITIES",
      "APPLICATIONS",
      "COLLABORATIONS",
      "NOTIFICATIONS",
    ]),
  })
  .strict();

export const creatorHomeResponseSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    generatedAt: z.string().datetime(),
    status: z.enum(["READY", "PARTIAL", "UNAVAILABLE"]),
    creator: z
      .object({
        id: z.string().trim().min(1).max(128),
        workspaceId: z.string().trim().min(1).max(128),
        displayName: z.string().trim().min(1).max(500),
        workspaceDisplayName: z.string().trim().min(1).max(500),
        role: z.enum(["OWNER", "MANAGER", "ASSISTANT"]),
      })
      .strict(),
    kpis: z
      .array(
        z
          .object({
            id: z.enum([
              "AVAILABLE_CAMPAIGNS",
              "APPLICATIONS_IN_PROGRESS",
              "ACTIVE_COLLABORATIONS",
              "UNREAD_UPDATES",
            ]),
            state: z.enum(["READY", "PARTIAL", "UNAVAILABLE"]),
            value: z.number().int().nonnegative().nullable(),
            freshness: z.enum(["CURRENT", "STALE", "UNKNOWN"]),
            observedAt: z.string().datetime(),
          })
          .strict(),
      )
      .length(4),
    quickActions: z
      .array(
        z
          .object({
            id: z.enum([
              "BROWSE_CAMPAIGNS",
              "MY_APPLICATIONS",
              "COLLABORATIONS",
              "SETTINGS",
            ]),
            label: z.string().trim().min(1).max(100),
            action: actionSchema,
          })
          .strict(),
      )
      .length(4),
    sections: z
      .array(
        z
          .object({
            id: z.enum([
              "NEEDS_YOUR_ATTENTION",
              "YOUR_WORK",
              "CAMPAIGNS_AVAILABLE",
              "RECENT_ACTIVITY",
            ]),
            state: z.enum(["READY", "EMPTY", "PARTIAL", "UNAVAILABLE"]),
            items: z.array(itemSchema),
          })
          .strict(),
      )
      .length(4),
    sourceStates: z
      .array(
        z
          .object({
            sourceDomain: z.enum([
              "SETTINGS",
              "OPPORTUNITIES",
              "APPLICATIONS",
              "COLLABORATIONS",
              "NOTIFICATIONS",
            ]),
            state: z.enum(["READY", "PARTIAL", "UNAVAILABLE"]),
            freshness: z.enum(["CURRENT", "STALE", "UNKNOWN"]),
            observedAt: z.string().datetime(),
            truncated: z.boolean(),
            limitations: z.array(z.string().trim().min(1).max(500)),
          })
          .strict(),
      )
      .length(5),
    truncated: z.boolean(),
    limitations: z.array(z.string().trim().min(1).max(500)),
  })
  .strict();

export type CreatorHomeResponse = z.infer<typeof creatorHomeResponseSchema>;
export type CreatorHomeItem = z.infer<typeof itemSchema>;
export type CreatorHomeDestination = z.infer<typeof destinationSchema>;
