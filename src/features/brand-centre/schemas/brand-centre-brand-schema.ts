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
        style: intelligenceField(domain.visualStyle),
      })
      .strict(),
    brandIdentity: z
      .object({
        description: intelligenceField(z.string()),
        positioning: intelligenceField(z.string()),
        valueProposition: intelligenceField(z.string()),
        values: intelligenceField(domain.brandValues),
        personality: intelligenceField(domain.personality),
        differentiation: intelligenceField(domain.differentiation),
        communication: intelligenceField(domain.communication),
      })
      .strict(),
    audience: z
      .object({
        state: intelligenceField(domain.personas),
        personas: domain.personas,
      })
      .strict(),
    locations: uniqueItems(domain.location, "locationId"),
    serviceability: z
      .object({ state: intelligenceField(domain.serviceability) })
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
