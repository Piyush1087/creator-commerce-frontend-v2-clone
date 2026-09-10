import { z } from "zod";
import {
  field,
  intelligenceField,
  readiness,
  runtimeActivity,
  safeUrl,
  semanticId,
  uniqueItems,
} from "./brand-consumer-primitives";
import * as domain from "./brand-consumer-domains";
import { brandProcessorRuntime } from "./brand-processor-runtime";

const compatibleIntelligenceField = <T extends z.ZodTypeAny>(value: T) =>
  intelligenceField(value).strip();

const details = z
  .object({
    industry: field(z.string()),
    category: field(z.string()),
    primaryGeography: field(z.string()),
    currency: field(z.string()),
  })
  .strict();

export const brandCentreBrandSchema = z
  .object({
    brandId: z.string().uuid(),
    workspaceReadiness: readiness,
    runtimeActivity,
    processorRuntime: brandProcessorRuntime,
    identity: details
      .extend({
        brandName: field(z.string()),
        website: field(
          z.object({ url: safeUrl, displayDomain: semanticId }).strict(),
        ),
        socialHandles: uniqueItems(
          z
            .object({
              semanticId,
              platform: z.enum(["instagram", "youtube", "tiktok"]),
              handle: z.string(),
              field: field(z.string()),
            })
            .strict(),
          "semanticId",
        ),
      })
      .strict(),
    details,
    visualIdentity: z
      .object({
        canonical: z
          .object({
            primaryLogo: field(domain.visualAsset),
            secondaryMarks: field(uniqueItems(domain.visualAsset, "id")),
            palette: field(uniqueItems(domain.visualColor, "id")),
            headingFont: field(domain.visualFont),
            bodyFont: field(domain.visualFont),
            typography: field(uniqueItems(domain.visualFont, "id")),
            referenceImages: field(uniqueItems(domain.visualAsset, "id")),
          })
          .strict(),
        style: compatibleIntelligenceField(domain.visualStyle),
      })
      .strict(),
    brandIdentity: z
      .object({
        description: compatibleIntelligenceField(z.string()),
        positioning: compatibleIntelligenceField(z.string()),
        valueProposition: compatibleIntelligenceField(z.string()),
        values: compatibleIntelligenceField(domain.brandValues),
        personality: compatibleIntelligenceField(domain.personality),
        differentiation: compatibleIntelligenceField(domain.differentiation),
        communication: compatibleIntelligenceField(domain.communication),
      })
      .strict(),
    audience: z
      .object({
        state: compatibleIntelligenceField(domain.personas),
        personas: domain.personas,
      })
      .strict(),
    locations: uniqueItems(domain.location, "locationId"),
    serviceability: z
      .object({ state: compatibleIntelligenceField(domain.serviceability) })
      .strict(),
  })
  .strict()
  .superRefine((projection, context) => {
    const current = projection.audience.state.current;
    const expected = current.kind === "VALUE" ? current.value : [];
    if (
      JSON.stringify(expected) !== JSON.stringify(projection.audience.personas)
    ) {
      context.addIssue({
        code: "custom",
        path: ["audience", "personas"],
        message: "Audience must match the current ACTIVE collection",
      });
    }
  });

export class BrandConsumerContractError extends Error {
  readonly code = "MALFORMED_RESPONSE";
  constructor() {
    super(
      "Brand information could not be read safely. Please try again later.",
    );
    this.name = "BrandConsumerContractError";
  }
}

export function parseBrandCentreBrand(value: unknown) {
  const parsed = brandCentreBrandSchema.safeParse(value);
  if (!parsed.success) throw new BrandConsumerContractError();
  return parsed.data;
}
