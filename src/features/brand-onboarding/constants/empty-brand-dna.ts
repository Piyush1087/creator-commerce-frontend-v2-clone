import type { BrandDnaState } from "../types";

/** Placeholder before `getBrandProfile` hydrates the form (no sample brand content). */
export const EMPTY_BRAND_DNA: BrandDnaState = {
  brandName: "",
  logo: "",
  tagline: "",
  description: "",
  industry: [],
  colors: [],
  typography: { heading: "", body: "" },
  tones: [],
  aesthetics: [],
  persona: {
    name: "",
    location: "",
    ageRange: "",
    affluence: 0,
    traits: [],
  },
};
