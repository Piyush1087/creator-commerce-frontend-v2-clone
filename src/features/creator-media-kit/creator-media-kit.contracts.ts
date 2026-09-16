import { z } from "zod";

const nullableText = z.string().nullable();
export const mediaKitIdentitySchema = z
  .object({
    name: nullableText,
    avatarUrl: z.string().url().nullable(),
    instagramHandle: nullableText,
    headline: nullableText,
    bio: nullableText,
    niches: z.array(z.string()).max(6),
    visualStyle: z.array(z.string()).max(6),
  })
  .strict();

export const publicVisualSchema = z
  .object({
    visualId: z.string(),
    sourceDestination: z.string().url(),
    staticAssetUrl: z.string().url().nullable(),
    altText: z.string(),
  })
  .strict();

export const callsToActionSchema = z.tuple([
  z
    .object({
      action: z.literal("WORK_WITH_CREATOR"),
      label: z.literal("Work with Creator"),
      subtext: z.literal("Start a collaboration"),
    })
    .strict(),
  z
    .object({
      action: z.literal("REVEAL_EMAIL_ID"),
      label: z.literal("Reveal Email ID"),
      subtext: z.literal("Agencies and email enquiries"),
    })
    .strict(),
]);

export const publicMediaKitSchema = z
  .object({
    contractVersion: z.literal("creator-media-kit-public-v3.1"),
    publicId: z.string(),
    lifecycle: z.literal("LIVE"),
    identity: mediaKitIdentitySchema,
    visuals: z.array(publicVisualSchema).max(3),
    callsToAction: callsToActionSchema,
  })
  .strict();

const audienceSection = z
  .object({
    state: z.string(),
    facts: z.array(z.record(z.unknown())).max(8),
    observedAsOf: z.unknown().nullable(),
  })
  .strict();
const contentSection = z
  .object({
    state: z.string(),
    themes: z.array(z.record(z.unknown())).max(12),
    performance: z.array(z.record(z.unknown())).max(6),
    representatives: z
      .array(
        z
          .object({
            visualId: z.string(),
            sourceDestination: z.string().url(),
            reason: z.string().nullable(),
          })
          .strict(),
      )
      .max(6)
      .optional(),
    observedAsOf: z.unknown().nullable(),
  })
  .strict();
const portfolioItem = z
  .object({
    id: z.string(),
    title: z.unknown(),
    kind: z.unknown(),
    sourceDestination: z.unknown(),
  })
  .strict();
const portfolioSection = z
  .object({
    state: z.string(),
    items: z.array(portfolioItem).max(6),
    eligibleItems: z.array(portfolioItem).max(100).optional(),
  })
  .strict();
const rateCardSection = z
  .object({
    state: z.string(),
    currency: z.unknown().nullable(),
    startingFrom: z.boolean().optional(),
    lines: z.array(z.record(z.unknown())).max(6),
    standardConditions: z.boolean().optional(),
  })
  .strict();
const availabilitySection = z
  .object({
    state: z.string(),
    basedIn: z.unknown().nullable(),
    availability: z.unknown().nullable(),
    pausedUntil: z.unknown().nullable().optional(),
  })
  .strict();

export const verifiedCompositionSchema = z
  .object({
    state: z.enum(["DRAFT", "LIVE"]),
    publicId: z.string().optional(),
    identity: mediaKitIdentitySchema,
    sections: z
      .object({
        audience: audienceSection.nullable(),
        content: contentSection.nullable(),
        portfolio: portfolioSection.nullable(),
        rateCard: rateCardSection.nullable(),
        availability: availabilitySection,
      })
      .strict(),
    callsToAction: callsToActionSchema,
    viewer: z.union([
      z
        .object({
          kind: z.literal("CREATOR"),
          role: z.enum(["OWNER", "MANAGER", "ASSISTANT"]),
        })
        .strict(),
      z
        .object({
          kind: z.literal("VERIFIED_BRAND"),
          brandId: z.string(),
        })
        .strict(),
    ]),
  })
  .strict();

export const creatorMediaKitSchema = z
  .object({
    contractVersion: z.literal("creator-media-kit-v3.1"),
    actorRole: z.enum(["OWNER", "MANAGER", "ASSISTANT"]),
    allowedActions: z.array(
      z.enum([
        "MEDIA_KIT_READ",
        "MEDIA_KIT_MANAGE",
        "MEDIA_KIT_PUBLISH",
        "MEDIA_KIT_PDF_DOWNLOAD",
      ]),
    ),
    configuration: z
      .object({
        lifecycle: z.enum(["DRAFT", "LIVE"]),
        publicId: z.string(),
        publicPath: z.string(),
        revision: z.number().int().nonnegative(),
        visibility: z
          .object({
            audience: z.boolean(),
            content: z.boolean(),
            portfolio: z.boolean(),
            rateCard: z.boolean(),
          })
          .strict(),
        publicVisuals: z.array(publicVisualSchema).max(3),
        featuredPortfolioItemIds: z.array(z.string()).max(6),
        publishedAt: z.string().datetime().nullable(),
        unpublishedAt: z.string().datetime().nullable(),
      })
      .strict(),
    preview: verifiedCompositionSchema,
  })
  .strict();

export const verifiedMediaKitSchema = verifiedCompositionSchema.extend({
  contractVersion: z.literal("creator-media-kit-verified-v3.1"),
});

export const mediaKitEmailSchema = z
  .object({
    state: z.enum(["AVAILABLE", "UNAVAILABLE"]),
    email: z.string().email().nullable(),
  })
  .strict();

export const mediaKitPdfSnapshotSchema = z
  .object({
    contractVersion: z.literal("creator-media-kit-pdf-v3.1"),
    generatedOn: z.string().datetime(),
    publicId: z.string(),
    projection: verifiedCompositionSchema,
  })
  .strict();

export type CreatorMediaKit = z.infer<typeof creatorMediaKitSchema>;
export type PublicMediaKit = z.infer<typeof publicMediaKitSchema>;
export type VerifiedMediaKit = z.infer<typeof verifiedMediaKitSchema>;
export type MediaKitPdfSnapshot = z.infer<typeof mediaKitPdfSnapshotSchema>;
