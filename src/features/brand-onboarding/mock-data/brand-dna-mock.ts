import type { BrandDnaState } from "../types";

export const INITIAL_BRAND_DNA: BrandDnaState = {
  brandName: "The Man Company",
  logo: "https://static.themancompany.com/tmc_logo_white.svg",
  tagline: "Be the gentleman you were meant to be.",
  description:
    "A premium men's grooming destination providing natural skin, hair, and body care products specifically designed for the modern gentleman's diverse needs.",
  industry: ["D2C", "PERSONAL CARE"],
  colors: ["#34D399", "#061F23", "#F4FBF4", "#F5926E"],
  typography: {
    heading: "Hanken Grotesk",
    body: "Source Sans 3",
  },
  tones: ["Empowering", "Minimalist"],
  aesthetics: ["Clean & Clinical", "Bold & Expressive"],
  persona: {
    name: "The Modern Alpha",
    location: "India",
    ageRange: "25 - 40",
    affluence: 4,
    traits: ["Tech-Savvy", "Grooming Conscious", "Eco-Aware"],
  },
};
