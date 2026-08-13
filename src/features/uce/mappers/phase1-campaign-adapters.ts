/**
 * Phase 1 Create/Edit adapters (product vocab → persistence wire format).
 * Keep mature wizard UI; map at the API boundary only.
 */

export const CAMPAIGN_VISIBILITY_TO_PERSISTENCE = {
  PUBLIC: "EVERYONE",
  ELIGIBLE_CREATORS_ONLY: "ELIGIBLE_ONLY",
  INVITE_ONLY: "INVITED_ONLY",
} as const;

export const COMPENSATION_MODEL_TO_PERSISTENCE = {
  FIXED: "FIXED_FEE",
  NEGOTIABLE: "NEGOTIABLE",
} as const;

export type CampaignVisibilityProduct =
  keyof typeof CAMPAIGN_VISIBILITY_TO_PERSISTENCE;
export type CompensationModelProduct =
  keyof typeof COMPENSATION_MODEL_TO_PERSISTENCE;

export function toPersistenceVisibility(
  visibility: CampaignVisibilityProduct = "PUBLIC",
): (typeof CAMPAIGN_VISIBILITY_TO_PERSISTENCE)[CampaignVisibilityProduct] {
  return CAMPAIGN_VISIBILITY_TO_PERSISTENCE[visibility];
}

export function toPersistenceCompensation(
  model: CompensationModelProduct,
): (typeof COMPENSATION_MODEL_TO_PERSISTENCE)[CompensationModelProduct] {
  return COMPENSATION_MODEL_TO_PERSISTENCE[model];
}

/** Canonical Create payment terms (IMMEDIATE is legacy-only). */
export const PHASE1_PAYOUT_TERMS = [
  "NET_7",
  "NET_15",
  "NET_30",
  "NET_45",
  "NET_60",
] as const;

export type Phase1PayoutTerm = (typeof PHASE1_PAYOUT_TERMS)[number];

/** Persistence currently stores IMMEDIATE|NET_7|NET_15|NET_30 only. */
export function toPersistencePayoutTerms(
  term: string,
): "IMMEDIATE" | "NET_7" | "NET_15" | "NET_30" {
  if (term === "IMMEDIATE" || term === "NET_7" || term === "NET_15" || term === "NET_30") {
    return term;
  }
  if (term === "NET_45" || term === "NET_60") return "NET_30";
  return "NET_30";
}
