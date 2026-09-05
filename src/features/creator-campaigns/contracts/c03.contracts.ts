import { z } from "zod";

export const idSchema = z.string().uuid();
const text = z.string().nullable();
const date = z.string().datetime({ offset: true }).nullable();
const decimal = z.string().regex(/^-?\d+(\.\d+)?$/);
export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };
const json: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(json),
    z.record(json),
  ]),
);
export const brandSchema = z
  .object({ name: z.string(), description: text, logoUrl: text, domain: text })
  .strict();
export const offeringSchema = z
  .object({ name: z.string(), description: text, imageUrl: text, url: text })
  .strict();
export const offerSchema = z
  .object({ offerName: z.string(), description: text, entityLink: text })
  .strict();
export const commercialSchema = z
  .object({
    compensationModel: z.enum(["FIXED", "NEGOTIABLE"]),
    offer: decimal,
    currency: z.enum(["INR", "USD"]),
    receivesBrandSupport: z.boolean(),
    brandSupportType: text,
    brandSupportEstimatedValue: decimal.nullable(),
  })
  .strict();
export const deliverableSchema = z
  .object({
    id: idSchema,
    format: z
      .enum(["REEL_VIDEO", "STORY", "PHOTOSHOOT", "BANNER_CAROUSEL"])
      .nullable(),
    displayOrder: z.number().int().nullable(),
    configuration: json,
    creativeGuidance: json,
    amplifyTargetDeliverableId: idSchema.nullable(),
  })
  .strict();
export const definitionSchema = z
  .object({
    briefName: text,
    creativeIntent: text,
    creatorBrief: text,
    briefType: z.enum(["CREATOR_LED", "BRAND_LED"]).nullable(),
    platform: z.enum(["INSTAGRAM", "TIKTOK", "YOUTUBE"]).nullable(),
    briefLevelGuidance: json,
    referenceContent: json,
    usageRights: json,
    creatorRequirements: text,
    deliverables: z.array(deliverableSchema),
  })
  .strict();
export const briefSchema = z
  .object({
    id: idSchema,
    campaignAssetId: idSchema,
    status: z.enum(["DRAFT", "PUBLISHED", "PAUSED"]),
    creationSource: z.string().min(1),
    applicationSelection: z.discriminatedUnion("state", [
      z.object({ state: z.literal("AVAILABLE") }).strict(),
      z
        .object({ state: z.literal("UNAVAILABLE"), reason: z.string().min(1) })
        .strict(),
    ]),
    definition: definitionSchema,
  })
  .strict();
export const assetSchema = z
  .object({
    id: idSchema,
    campaignId: idSchema,
    kind: z.enum(["BRAND", "OFFERING", "OFFER"]),
    status: z.enum(["ACTIVE", "PAUSED"]),
    offering: offeringSchema.nullable(),
    offer: offerSchema.nullable(),
    briefs: z.array(briefSchema),
  })
  .strict();
const identitySchema = z
  .object({ id: idSchema, name: z.string(), platforms: z.array(z.string()) })
  .strict();
export const authorizedSchema = z
  .object({
    schemaVersion: z.literal(1),
    state: z.literal("AUTHORIZED"),
    applicationsOpen: z.boolean(),
    canApply: z.boolean(),
    applyBlockedReason: text,
    applicationDeadline: date,
    campaign: identitySchema
      .extend({
        brand: brandSchema.nullable(),
        objective: text,
        publishingStart: date,
        publishingEnd: date,
        commercial: z.union([
          commercialSchema,
          z.object({ state: z.literal("UNAVAILABLE") }).strict(),
        ]),
      })
      .strict(),
    assets: z.array(assetSchema),
  })
  .strict();
export const opportunitySchema = z
  .discriminatedUnion("state", [
    z
      .object({
        schemaVersion: z.literal(1),
        state: z.literal("TEASER"),
        reason: z.enum(["AUTHENTICATION_REQUIRED", "CREATOR_ACCOUNT_REQUIRED"]),
        recoveryAction: z.literal("SIGN_IN_OR_CREATE_CREATOR"),
        campaign: identitySchema,
      })
      .strict(),
    z
      .object({
        schemaVersion: z.literal(1),
        state: z.literal("LOCKED"),
        reason: z.string().min(1),
        recoveryAction: text,
      })
      .strict(),
    authorizedSchema,
  ])
  .superRefine((value, ctx) => {
    if (value.state !== "AUTHORIZED") return;
    for (const asset of value.assets) {
      if (
        asset.campaignId !== value.campaign.id ||
        asset.briefs.some((b) => b.campaignAssetId !== asset.id)
      )
        ctx.addIssue({ code: "custom", message: "Invalid selection ancestry" });
    }
  });
export const opportunityListSchema = z
  .object({
    items: z.array(opportunitySchema.refine((v) => v.state === "AUTHORIZED")),
    nextCursor: text,
  })
  .strict();
export const statusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
]);
const historyBrief = z
  .object({
    id: idSchema.nullable(),
    campaignAssetId: idSchema.nullable(),
    briefName: text,
  })
  .strict();
export const applicationSchema = z
  .object({
    schemaVersion: z.literal(1),
    applicationId: idSchema,
    referenceAuthority: z.literal("C03_CANONICAL"),
    campaignId: idSchema,
    canonicalCampaignAssetId: idSchema,
    canonicalBriefId: idSchema,
    status: statusSchema,
    statusVersion: z.number().int().positive(),
    appliedAt: z.string().datetime({ offset: true }),
    terminalAt: date,
    campaign: z
      .object({
        id: idSchema.nullable(),
        name: text,
        brand: brandSchema.nullable(),
        objective: text,
        platforms: z.array(z.string()).nullable(),
        publishingStart: date,
        publishingEnd: date,
        applicationDeadline: date,
      })
      .strict(),
    asset: z
      .object({
        id: idSchema.nullable(),
        campaignId: idSchema.nullable(),
        kind: z.enum(["BRAND", "OFFERING", "OFFER"]).nullable(),
        offering: offeringSchema.nullable(),
        offer: offerSchema.nullable(),
      })
      .strict(),
    brief: historyBrief,
    creator: z.object({ displayName: text, avatarUrl: text }).strict(),
    commercial: commercialSchema,
    canWithdrawPending: z.boolean(),
    collaborationId: idSchema.nullable(),
  })
  .strict();
export const applicationDetailSchema = applicationSchema
  .extend({
    brief: historyBrief
      .merge(definitionSchema.omit({ briefName: true }))
      .strict(),
  })
  .strict();
export const applicationListSchema = z
  .object({ items: z.array(applicationSchema), nextCursor: text })
  .strict();
export const receiptSchema = z
  .object({
    applicationId: idSchema,
    transitionId: idSchema,
    status: statusSchema,
    statusVersion: z.number().int().positive(),
    occurredAt: z.string().datetime({ offset: true }),
  })
  .strict();
export const continuationSchema = z
  .object({
    intent: z.literal("CAMPAIGN_APPLY"),
    expiresAt: z.string().datetime({ offset: true }),
    continuationPresent: z.literal(true),
  })
  .strict();
export const notificationSchema = z
  .object({
    id: idSchema,
    event_type: z.enum([
      "campaigns.application_approved",
      "campaigns.application_rejected",
    ]),
    category: z.string(),
    urgency_level: z.string(),
    actionable: z.boolean(),
    payload: z
      .object({
        application_id: idSchema,
        campaign_id: idSchema,
        collaboration_id: idSchema.optional(),
      })
      .strict(),
    created_at: z.string().datetime({ offset: true }),
    is_read: z.boolean(),
    is_emailed: z.boolean(),
    read_at: date,
  })
  .strict();
export const notificationsSchema = z
  .object({ notifications: z.array(notificationSchema).max(100) })
  .strict();
export const unreadSchema = z
  .object({ unread_count: z.number().int().nonnegative() })
  .strict();
export const readSchema = z
  .object({ notification_id: idSchema, is_read: z.boolean(), read_at: date })
  .strict();
export const allReadSchema = z
  .object({ updated_count: z.number().int().nonnegative() })
  .strict();
export type Opportunity = z.infer<typeof opportunitySchema>;
export type AuthorizedOpportunity = z.infer<typeof authorizedSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Brief = z.infer<typeof briefSchema>;
export type Application = z.infer<typeof applicationSchema>;
export type ApplicationDetail = z.infer<typeof applicationDetailSchema>;
export type Receipt = z.infer<typeof receiptSchema>;
