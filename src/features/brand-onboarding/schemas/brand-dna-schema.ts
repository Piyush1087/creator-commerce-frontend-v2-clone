import { z } from "zod";

/** Continue from DNA — only brand name is mandatory; scan may omit tagline/description. */
export const brandDnaFormSchema = z.object({
  brandName: z.string().min(1, "Brand name is required."),
  tagline: z.string().optional(),
  description: z
    .string()
    .max(500, "Briefs work best with concise descriptions. Please trim this down.")
    .optional(),
  personaName: z.string().optional(),
});
