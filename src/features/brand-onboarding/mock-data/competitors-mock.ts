import type { CompetitorRow } from "../types";

export const COMPETITORS_ROOT_DOMAIN = "themancompany.com";

export const INITIAL_COMPETITORS: CompetitorRow[] = [
  {
    id: "c1",
    name: "Minimalist",
    logo: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100&h=100&fit=crop",
    url: "https://beminimalist.co",
    handles: { instagram: "beminimalist__", tiktok: "minimalist_skincare" },
    narrative:
      'Minimalist is the "gold standard" for affordable clinical skincare in India. Anyone looking at The Man Company is likely comparing it to the efficacy and price of Minimalist.',
  },
  {
    id: "c2",
    name: "The Inkey List",
    logo: "https://images.unsplash.com/photo-1556227702-d1e4e7b5c232?w=100&h=100&fit=crop",
    url: "https://theinkeylist.com",
    handles: { instagram: "theinkeylist" },
    narrative:
      "Strong competitor in the education-led space. They utilize short-form video to simplify complex ingredients, making high-performance skincare accessible to Gen Z through energetic activations.",
  },
];
