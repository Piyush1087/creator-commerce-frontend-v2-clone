import { z } from "zod";

export const brandDnaFormSchema = z.object({
  brandName: z.string().min(1, "Brand name is required."),
  tagline: z.string().min(1, "Tagline is required."),
  description: z
    .string()
    .min(1, "Description is required.")
    .max(500, "Briefs work best with concise descriptions. Please trim this down."),
  personaName: z.string().min(1, "Persona name is required."),
});
