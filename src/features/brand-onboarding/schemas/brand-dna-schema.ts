import { z } from "zod";

const colorHex = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a valid hex color (e.g. #1A2B3C).");

const shortTag = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

export const brandDnaFormSchema = z
  .object({
    brandName: z
      .string()
      .trim()
      .min(1, "Brand name is required.")
      .max(200, "Brand name must be 200 characters or fewer."),
    tagline: z
      .string()
      .max(150, "Tagline must be 150 characters or fewer.")
      .optional(),
    description: z
      .string()
      .max(
        500,
        "Briefs work best with concise descriptions. Please trim this down (max 500 characters).",
      )
      .optional(),
    personaName: z
      .string()
      .trim()
      .min(3, "Persona name must be at least 3 characters.")
      .max(120, "Persona name must be 120 characters or fewer.")
      .optional()
      .or(z.literal("")),
    affluence: z.number().int().min(1).max(5).optional(),
    ageMin: z.number().int().min(13).max(99).optional(),
    ageMax: z.number().int().min(13).max(99).optional(),
    industry: z
      .array(z.string().min(1))
      .min(1, "Select at least 1 industry."),
    colors: z
      .array(colorHex)
      .max(8, "You can keep at most 8 brand colors."),
    tones: z
      .array(shortTag("Tone tag", 80))
      .min(1, "Select at least 1 tone of voice.")
      .max(5, "You can keep at most 5 tone tags."),
    aesthetics: z
      .array(shortTag("Visual aesthetic", 80))
      .min(1, "Select at least 1 visual aesthetic.")
      .max(5, "You can keep at most 5 visual aesthetic tags."),
    traits: z
      .array(shortTag("Audience trait", 80))
      .min(1, "Select at least 1 audience trait.")
      .max(7, "You can keep at most 7 audience traits."),
  })
  .superRefine((value, ctx) => {
    if (
      value.ageMin != null &&
      value.ageMax != null &&
      value.ageMin > value.ageMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimum age cannot be greater than maximum age.",
        path: ["ageMin"],
      });
    }
  });

export const dnaToneTagSchema = shortTag("Tone tag", 80);
export const dnaAestheticTagSchema = shortTag("Visual aesthetic", 80);
export const dnaTraitTagSchema = shortTag("Audience trait", 80);
export const dnaColorSchema = colorHex;
export const dnaBrandNameSchema = z
  .string()
  .trim()
  .min(1, "Brand name is required.")
  .max(200, "Brand name must be 200 characters or fewer.");
export const dnaTaglineSchema = z
  .string()
  .max(150, "Tagline must be 150 characters or fewer.");
export const dnaDescriptionSchema = z
  .string()
  .max(
    500,
    "Briefs work best with concise descriptions. Please trim this down (max 500 characters).",
  );
export const dnaPersonaNameSchema = z
  .string()
  .trim()
  .min(3, "Persona name must be at least 3 characters.")
  .max(120, "Persona name must be 120 characters or fewer.");
export const dnaAgeRangeSchema = z
  .string()
  .trim()
  .min(1, "Age range is required.")
  .max(40, "Age range must be 40 characters or fewer.")
  .regex(
    /^(\d{1,3})\s*[-–to]+\s*(\d{1,3})$/i,
    "Use an age range like 25-34.",
  )
  .superRefine((value, ctx) => {
    const match = value.match(/(\d{1,3}).*?(\d{1,3})/);
    if (!match) {
      return;
    }
    const min = Number(match[1]);
    const max = Number(match[2]);
    if (min < 13 || max > 99 || min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Age range must be between 13 and 99, with min ≤ max.",
      });
    }
  });

export const catalogueOfferingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(200, "Product name must be 200 characters or fewer."),
  url: z.string().url("Enter a valid product URL."),
  description: z
    .string()
    .max(150, "Product description must be 150 characters or fewer.")
    .optional(),
  imageUrl: z
    .union([z.string().url("Enter a valid image URL."), z.literal(""), z.null()])
    .optional(),
  type: z.enum(["PRODUCT", "TREATMENT", "SERVICE", "COLLECTION"]).default("PRODUCT"),
  categoryTag: z
    .string()
    .max(200, "Category must be 200 characters or fewer.")
    .optional(),
  startingPriceLabel: z
    .string()
    .max(120, "Price label must be 120 characters or fewer.")
    .optional(),
});

export const competitorEditSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Competitor name is required.")
    .max(200, "Competitor name must be 200 characters or fewer."),
  websiteUrl: z.string().url("Enter a valid competitor website."),
  whyCompetitor: z
    .string()
    .trim()
    .min(40, "Please provide a bit more detail on why they are a rival.")
    .max(300, "Keep the comparison concise (max 300 characters)."),
  logoUrl: z
    .union([z.string().url("Enter a valid logo URL."), z.literal(""), z.null()])
    .optional(),
});

export function zodFirstError(
  error: z.ZodError,
  fallback = "Please fix the highlighted fields.",
): string {
  return error.issues[0]?.message ?? fallback;
}
