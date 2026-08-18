export type AudienceAffinityOption = {
  id: string;
  label: string;
  aliases: readonly string[];
};

/**
 * MVP seed mirrored from the frozen Campaign canonical affinity library.
 * Persist IDs only. Labels and aliases are presentation/search metadata.
 */
export const AUDIENCE_AFFINITIES: readonly AudienceAffinityOption[] = [
  { id: "HEALTH", label: "Health", aliases: ["healthcare", "healthy living"] },
  { id: "WOMENS_HEALTH", label: "Women's Health", aliases: ["female health", "women health"] },
  { id: "PREGNANCY", label: "Pregnancy", aliases: ["pregnant", "expecting mothers", "expecting mom", "maternity"] },
  { id: "NUTRITION", label: "Nutrition", aliases: ["healthy eating", "diet", "nutrition advice"] },
  { id: "MENTAL_WELLNESS", label: "Mental Wellness", aliases: ["mental wellbeing", "mindfulness"] },
  { id: "FERTILITY", label: "Fertility", aliases: ["reproductive health", "trying to conceive", "TTC"] },
  { id: "SKINCARE", label: "Skincare", aliases: ["skin care", "skin health", "skincare products"] },
  { id: "BEAUTY", label: "Beauty", aliases: ["makeup", "cosmetics", "beauty products"] },
  { id: "FASHION", label: "Fashion", aliases: ["clothing", "apparel", "style"] },
  { id: "SHOPPING", label: "Shopping", aliases: ["online shopping", "retail shopping"] },
  { id: "LUXURY_LIFESTYLE", label: "Luxury Lifestyle", aliases: ["luxury", "premium lifestyle"] },
  { id: "STREETWEAR", label: "Streetwear", aliases: ["street fashion", "urban fashion"] },
  { id: "FITNESS", label: "Fitness", aliases: ["gym", "workout", "exercise", "bodybuilding", "strength training"] },
  { id: "ARTIFICIAL_INTELLIGENCE", label: "Artificial Intelligence", aliases: ["AI", "GenAI", "generative AI", "machine learning", "LLMs"] },
  { id: "PRODUCTIVITY", label: "Productivity", aliases: ["productive work", "work efficiency"] },
  { id: "STARTUPS", label: "Startups", aliases: ["startup", "entrepreneurship", "founders"] },
  { id: "SOFTWARE_DEVELOPMENT", label: "Software Development", aliases: ["coding", "programming", "software engineering"] },
  { id: "AUTOMATION", label: "Automation", aliases: ["workflow automation", "automated workflows"] },
  { id: "TECHNOLOGY", label: "Technology", aliases: ["tech", "gadgets"] },
  { id: "PERSONAL_FINANCE", label: "Personal Finance", aliases: ["money management", "financial planning"] },
  { id: "INVESTING", label: "Investing", aliases: ["investments", "stock market"] },
  { id: "TRAVEL", label: "Travel", aliases: ["travelling", "vacations", "holidays"] },
  { id: "FOOD", label: "Food", aliases: ["foodie", "cuisine", "food lover"] },
  { id: "COOKING", label: "Cooking", aliases: ["recipes", "home cooking"] },
  { id: "PARENTING", label: "Parenting", aliases: ["parents", "motherhood", "fatherhood"] },
  { id: "BABY_AND_KIDS", label: "Baby & Kids", aliases: ["babies", "children", "kids"] },
  { id: "HOME_AND_INTERIORS", label: "Home & Interiors", aliases: ["home decor", "interior design"] },
  { id: "EDUCATION", label: "Education", aliases: ["learning", "studying"] },
  { id: "CAREER_AND_PRODUCTIVITY", label: "Career & Productivity", aliases: ["career", "professional growth"] },
  { id: "PERSONAL_STYLE", label: "Personal Style", aliases: ["styling", "outfit styling"] },
] as const;

export const AUDIENCE_AFFINITY_IDS = new Set(AUDIENCE_AFFINITIES.map((item) => item.id));
