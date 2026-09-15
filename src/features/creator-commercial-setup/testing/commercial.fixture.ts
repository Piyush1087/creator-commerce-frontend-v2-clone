import {
  WorkConsumerSchema,
  RateConsumerSchema,
  emptyRates,
} from "../contracts/commercial.schema";
export function commercialFixture(
  role: "OWNER" | "MANAGER" | "ASSISTANT" = "OWNER",
) {
  const context = {
    role,
    allowedActions:
      role === "ASSISTANT"
        ? ["COMMERCIAL_SETUP_READ"]
        : ["COMMERCIAL_SETUP_READ", "WORK_PREFERENCES_EDIT", "RATE_CARD_EDIT"],
    sourceIndependent: true,
  };
  const country = {
    state: "AVAILABLE",
    effectiveBaseCountry: "IN",
    baseCountrySource: "CREATOR_DECLARED",
    baseCountryEditable: true,
    canonicalRateCardCurrency: "INR",
    authorityBinding: {
      source: "CREATOR_DECLARED",
      sourceReference: "00000000-0000-4000-8000-000000000001",
      sourceVersion: 1,
      legalProfileVersion: null,
      country: "IN",
      currency: "INR",
    },
    authorityFingerprint: "a".repeat(64),
  };
  return {
    work: WorkConsumerSchema.parse({
      contractVersion: "creator-work-preferences-v0.1",
      state: "CONFIGURED",
      currentRevision: 1,
      values: {
        baseCountry: "IN",
        openToInternationalBrands: null,
        preferredIndustryIds: [],
        excludedIndustryIds: [],
        availability: "ACCEPTING_COLLABORATIONS",
        pausedUntil: null,
        physicalProductCollaborations: null,
        ugcProjects: null,
        giftingBarter: null,
      },
      context,
      readiness: {
        shipping: "NEEDS_SETUP",
        payout: "NEEDS_SETUP",
        kyc: "COMING_SOON",
      },
      country,
    }),
    rates: RateConsumerSchema.parse({
      contractVersion: "creator-rate-card-v0.1",
      state: "CURRENT",
      currentRevision: 1,
      values: emptyRates(),
      country,
      context,
      workPreferences: { ugcProjects: null, giftingBarter: null },
    }),
  };
}
