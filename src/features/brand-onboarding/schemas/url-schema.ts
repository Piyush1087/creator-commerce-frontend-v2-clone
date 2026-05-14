import { z } from "zod";

export const urlSchema = z
  .string()
  .min(1, "Please enter a website address.")
  .regex(
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i,
    "Please enter a valid website address (e.g., brand.com).",
  )
  .refine((val) => {
    const domain = val.toLowerCase();
    const isSocialOrMarketplace =
      domain.includes("instagram.com") ||
      domain.includes("tiktok.com") ||
      domain.includes("amazon.com") ||
      domain.includes("facebook.com");
    return !isSocialOrMarketplace;
  }, "We need your brand’s direct website. Social profiles and marketplaces are not supported.");
