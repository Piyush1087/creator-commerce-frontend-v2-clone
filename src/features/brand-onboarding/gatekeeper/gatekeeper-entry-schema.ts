import { z } from "zod";

const SOCIAL_OR_MARKETPLACE_HOSTS = [
  "instagram.com",
  "facebook.com",
  "tiktok.com",
  "youtube.com",
  "linkedin.com",
  "amazon.com",
  "amazon.in",
  "flipkart.com",
  "myntra.com",
  "meesho.com",
  "nykaa.com",
] as const;

function normalizedHost(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(candidate).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export const gatekeeperEntrySchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Please enter your brand website.")
    .superRefine((value, ctx) => {
      const host = normalizedHost(value);
      if (!host || !host.includes(".")) {
        ctx.addIssue({ code: "custom", message: "Enter a valid website address, such as brand.com." });
        return;
      }
      if (
        SOCIAL_OR_MARKETPLACE_HOSTS.some(
          (blocked) => host === blocked || host.endsWith(`.${blocked}`),
        )
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Enter the brand's own website rather than a social profile or marketplace page.",
        });
      }
    }),
  ownershipAttested: z.literal(true, {
    errorMap: () => ({ message: "Confirm that you own or are authorized to represent this brand." }),
  }),
  legalAccepted: z.literal(true, {
    errorMap: () => ({ message: "Accept the Terms and Privacy Policy to continue." }),
  }),
});

export type GatekeeperEntryInput = z.input<typeof gatekeeperEntrySchema>;
