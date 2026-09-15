import { z } from "zod";

const identity = z.string().regex(/^portfolio-item:[a-f0-9]{64}$/u);
const text = (max: number) => z.string().min(1).max(max);
export const PortfolioDestinationSchema = z
  .string()
  .max(4096)
  .superRefine((value, ctx) => {
    try {
      const url = new URL(value);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.hostname.endsWith(".") ||
        (url.port && url.port !== "443") ||
        !url.hostname.includes(".") ||
        /^[\d.]+$/u.test(url.hostname) ||
        url.hostname.includes(":") ||
        /(?:^|\.)(?:localhost|local|internal|test|invalid|cdninstagram\.com|fbcdn\.net)$/iu.test(
          url.hostname,
        )
      )
        throw new Error();
      for (const key of url.searchParams.keys())
        if (
          /token|signature|credential|secret|password|x-amz|x-goog|expires|expiry|oauth|authkey|^(?:sig|policy|key-pair-id|hmac|sas)$/iu.test(
            key,
          )
        )
          throw new Error();
      if (
        ["instagram.com", "www.instagram.com"].includes(url.hostname) &&
        !/^\/(?:p|reel)\/[A-Za-z0-9_-]+\/$/u.test(url.pathname)
      )
        throw new Error();
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use a stable HTTPS work link, not a temporary media link.",
      });
    }
  });
const provenance = z.discriminatedUnion("source", [
  z
    .object({
      source: z.literal("INSTAGRAM"),
      classification: z.literal("POSSIBLE_COLLABORATION"),
      confidence: z.enum(["LOW", "MEDIUM"]),
      observedAt: z.string().datetime(),
      basis: z.literal("SPONSORSHIP_DISCLOSURE"),
    })
    .strict(),
  z
    .object({
      source: z.literal("CREATOR_SHOP"),
      verification: z.literal("COMPLETED_WORK"),
      verifiedAt: z.string().datetime(),
    })
    .strict(),
  z
    .object({
      source: z.literal("CREATOR_PROVIDED"),
      createdAt: z.string().datetime(),
    })
    .strict(),
]);
export const PortfolioPublicItemSchema = z
  .object({
    id: identity,
    kind: z.enum([
      "INSTAGRAM_IMAGE",
      "INSTAGRAM_REEL",
      "INSTAGRAM_CAROUSEL",
      "INSTAGRAM_STORY",
      "EXTERNAL",
      "UGC",
    ]),
    destination: PortfolioDestinationSchema,
    title: text(160),
    creatorContext: z.string().max(300).nullable(),
    brandLabel: text(160).nullable(),
    workDate: z.string().datetime().nullable(),
    state: z.enum(["INCLUDED", "REMOVED"]),
    provenance: z.array(provenance).min(1).max(32),
    presentation: z.literal("SOURCE_LINK_ONLY"),
    access: z.enum(["PUBLIC_DESTINATION", "ACCESS_REQUIREMENTS_UNKNOWN"]),
  })
  .strict()
  .superRefine((item, ctx) => {
    if (
      item.kind === "INSTAGRAM_STORY" ||
      (item.provenance.some((p) => p.source === "INSTAGRAM") &&
        !item.destination.startsWith("https://www.instagram.com/"))
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unsupported source presentation",
      });
  });
export const PortfolioConsumerSchema = z
  .object({
    contractVersion: z.literal("creator-portfolio-v3.1"),
    currentRevision: z.number().int().nonnegative(),
    context: z
      .object({
        role: z.enum(["OWNER", "MANAGER", "ASSISTANT"]),
        canCurate: z.boolean(),
      })
      .strict(),
    items: z.array(PortfolioPublicItemSchema).max(100),
    nextCursor: identity.nullable(),
    discovery: z.enum(["AVAILABLE", "PARTIAL", "UNAVAILABLE", "NOT_PROCESSED"]),
    limitations: z.array(text(200)).max(32),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.context.canCurate !== (data.context.role !== "ASSISTANT") ||
      new Set(data.items.map((i) => i.id)).size !== data.items.length
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid role or duplicate item identity",
      });
  });
export type PortfolioConsumer = z.infer<typeof PortfolioConsumerSchema>;
export type PortfolioItem = z.infer<typeof PortfolioPublicItemSchema>;
export const PORTFOLIO_FILTERS = [
  "ALL",
  "INSTAGRAM",
  "CREATOR_SHOP",
  "CREATOR_PROVIDED",
  "REMOVED",
] as const;
export type PortfolioFilter = (typeof PORTFOLIO_FILTERS)[number];
const revision = {
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey: z.string().uuid(),
};
const reference = {
  destination: PortfolioDestinationSchema,
  title: text(160),
  creatorContext: z.string().max(300).nullable(),
  workDate: z.string().datetime().nullable(),
};
export const PortfolioCommandSchema = z.discriminatedUnion("intent", [
  z
    .object({
      intent: z.literal("ADD_REFERENCE"),
      ...revision,
      ...reference,
      kind: z.enum(["EXTERNAL", "UGC"]),
    })
    .strict(),
  z
    .object({
      intent: z.literal("EDIT_REFERENCE"),
      ...revision,
      ...reference,
      itemId: identity,
    })
    .strict(),
  z
    .object({
      intent: z.enum(["REMOVE", "RESTORE"]),
      ...revision,
      itemId: identity,
    })
    .strict(),
]);
export type PortfolioCommand = z.infer<typeof PortfolioCommandSchema>;
