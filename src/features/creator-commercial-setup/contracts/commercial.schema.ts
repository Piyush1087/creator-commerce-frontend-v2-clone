import { z } from "zod";
const countryCodes = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO " +
  "JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR " +
  "MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO " +
  "RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV " +
  "TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
).split(" ");
export const COMMERCIAL_COUNTRY_CODES = Object.freeze(countryCodes);
const country = z
  .string()
  .trim()
  .toUpperCase()
  .refine(
    (value) => countryCodes.includes(value),
    "Choose an assigned country.",
  );
export const INDUSTRY_IDS = [
  "D2C",
  "HEALTHCARE",
  "OFFLINE_SERVICES",
  "SAAS_AI",
] as const;
export const answer = z.enum(["YES", "NO"]).nullable();
const industries = z
  .array(z.enum(INDUSTRY_IDS))
  .max(64)
  .transform((values) => [...new Set(values)].sort());
export const WorkValuesSchema = z
  .object({
    baseCountry: country,
    openToInternationalBrands: answer,
    preferredIndustryIds: industries,
    excludedIndustryIds: industries,
    availability: z.enum([
      "ACCEPTING_COLLABORATIONS",
      "PAUSED_UNTIL",
      "NOT_ACCEPTING_NEW_COLLABORATIONS",
    ]),
    pausedUntil: z.string().datetime().nullable(),
    physicalProductCollaborations: answer,
    ugcProjects: answer,
    giftingBarter: answer,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.preferredIndustryIds.some((id) =>
        value.excludedIndustryIds.includes(id),
      )
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["excludedIndustryIds"],
        message: "Preferred and excluded industries must not overlap.",
      });
    if (
      (value.availability === "PAUSED_UNTIL") !==
      (value.pausedUntil !== null)
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pausedUntil"],
        message: "Only paused availability requires a date.",
      });
  });
export type WorkValues = z.infer<typeof WorkValuesSchema>;
const line = z
  .object({
    enabled: z.boolean(),
    amountMinor: z
      .number()
      .int()
      .positive()
      .max(Number.MAX_SAFE_INTEGER)
      .nullable(),
  })
  .strict()
  .refine(
    (value) => value.enabled === (value.amountMinor !== null),
    "Enabled prices require positive minor units; disabled prices must be empty.",
  );
export const MONEY_KEYS = [
  "REEL_VIDEO",
  "STORY",
  "BANNER_CAROUSEL",
  "PHOTOSHOOT",
  "linkInBio",
  "paidAmplification",
] as const;
export const RateValuesSchema = z
  .object({
    REEL_VIDEO: line,
    STORY: line,
    BANNER_CAROUSEL: line,
    PHOTOSHOOT: line,
    linkInBio: line,
    paidAmplification: line,
    contentUsageRights: answer,
    usageDays: z
      .number()
      .int()
      .positive()
      .max(Number.MAX_SAFE_INTEGER)
      .nullable(),
    advancePercent: z
      .union([
        z.literal(0),
        z.literal(25),
        z.literal(50),
        z.literal(75),
        z.literal(100),
      ])
      .nullable(),
    balanceTerm: z
      .enum(["NET_7", "NET_15", "NET_30", "NET_45", "NET_60"])
      .nullable(),
  })
  .strict()
  .refine(
    (value) => value.contentUsageRights === "YES" || value.usageDays === null,
    "Duration requires explicit usage-right availability.",
  );
export type RateValues = z.infer<typeof RateValuesSchema>;
const fingerprint = z.string().regex(/^[a-f0-9]{64}$/);
const binding = z
  .object({
    source: z.enum(["CREATOR_DECLARED", "PAYOUT_BANK"]),
    sourceReference: z.string().uuid(),
    sourceVersion: z.number().int().positive(),
    legalProfileVersion: z.number().int().positive().nullable(),
    country,
    currency: z.enum(["INR", "USD"]),
  })
  .strict()
  .refine(
    (value) =>
      value.currency === (value.country === "IN" ? "INR" : "USD") &&
      (value.source !== "CREATOR_DECLARED" ||
        value.legalProfileVersion === null),
  );
const effectiveCountry = z
  .object({
    state: z.enum(["AVAILABLE", "UNCONFIGURED", "CONFLICT"]),
    effectiveBaseCountry: country.nullable(),
    baseCountrySource: z.enum(["CREATOR_DECLARED", "PAYOUT_BANK"]).nullable(),
    baseCountryEditable: z.boolean(),
    canonicalRateCardCurrency: z.enum(["INR", "USD"]).nullable(),
    authorityBinding: binding.nullable(),
    authorityFingerprint: fingerprint.nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.state === "AVAILABLE") {
      const b = value.authorityBinding;
      if (
        !b ||
        value.effectiveBaseCountry !== b.country ||
        value.baseCountrySource !== b.source ||
        value.canonicalRateCardCurrency !== b.currency ||
        value.authorityFingerprint === null ||
        value.baseCountryEditable !== (b.source === "CREATOR_DECLARED")
      )
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid current country authority.",
        });
    } else if (
      value.authorityBinding !== null ||
      value.effectiveBaseCountry !== null ||
      value.baseCountrySource !== null ||
      value.canonicalRateCardCurrency !== null ||
      value.authorityFingerprint !== null ||
      value.baseCountryEditable !== (value.state === "UNCONFIGURED")
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unavailable country must not fabricate money.",
      });
  });
const context = z
  .object({
    role: z.enum(["OWNER", "MANAGER", "ASSISTANT"]),
    allowedActions: z.array(
      z.enum([
        "COMMERCIAL_SETUP_READ",
        "WORK_PREFERENCES_EDIT",
        "RATE_CARD_EDIT",
      ]),
    ),
    sourceIndependent: z.literal(true),
  })
  .strict()
  .refine(
    (value) =>
      value.allowedActions.includes("COMMERCIAL_SETUP_READ") &&
      (value.role !== "ASSISTANT" ||
        value.allowedActions.every(
          (action) => action === "COMMERCIAL_SETUP_READ",
        )),
  );
export const WorkConsumerSchema = z
  .object({
    contractVersion: z.literal("creator-work-preferences-v0.1"),
    state: z.enum(["UNCONFIGURED", "CONFIGURED"]),
    currentRevision: z.number().int().nonnegative(),
    values: WorkValuesSchema.nullable(),
    context,
    readiness: z
      .object({
        shipping: z.enum(["READY", "NEEDS_SETUP"]),
        payout: z.enum([
          "READY",
          "NEEDS_SETUP",
          "PROVIDER_REVIEW",
          "UNAVAILABLE",
        ]),
        kyc: z.literal("COMING_SOON"),
      })
      .strict(),
    country: effectiveCountry,
  })
  .strict()
  .refine(
    (value) =>
      (value.currentRevision === 0) === (value.values === null) &&
      (value.state === "UNCONFIGURED") === (value.values === null),
  );
export const RateConsumerSchema = z
  .object({
    contractVersion: z.literal("creator-rate-card-v0.1"),
    state: z.enum([
      "UNCONFIGURED",
      "CURRENT",
      "MONETARY_RATES_REQUIRE_REENTRY",
    ]),
    currentRevision: z.number().int().nonnegative(),
    values: RateValuesSchema.nullable(),
    country: effectiveCountry,
    context,
    workPreferences: z
      .object({ ugcProjects: answer, giftingBarter: answer })
      .strict(),
  })
  .strict()
  .refine(
    (value) =>
      (value.currentRevision === 0) === (value.values === null) &&
      (value.state === "UNCONFIGURED") === (value.values === null) &&
      (value.state !== "CURRENT" || value.country.state === "AVAILABLE") &&
      (value.state !== "MONETARY_RATES_REQUIRE_REENTRY" ||
        value.values === null ||
        MONEY_KEYS.every((key) => !value.values?.[key].enabled)),
  );
export type WorkConsumer = z.infer<typeof WorkConsumerSchema>;
export type RateConsumer = z.infer<typeof RateConsumerSchema>;
export const WorkCommandSchema = z
  .object({
    expectedRevision: z.number().int().nonnegative(),
    expectedRateCardRevision: z.number().int().nonnegative(),
    confirmMonetaryReset: z.boolean(),
    idempotencyKey: z.string().uuid(),
    values: WorkValuesSchema,
  })
  .strict();
export const RateCommandSchema = z
  .object({
    expectedRevision: z.number().int().nonnegative(),
    expectedWorkPreferencesRevision: z.number().int().positive(),
    authorityFingerprint: fingerprint,
    idempotencyKey: z.string().uuid(),
    values: RateValuesSchema,
  })
  .strict();
export type WorkCommand = z.infer<typeof WorkCommandSchema>;
export type RateCommand = z.infer<typeof RateCommandSchema>;
export const emptyRates = (): RateValues => ({
  REEL_VIDEO: { enabled: false, amountMinor: null },
  STORY: { enabled: false, amountMinor: null },
  BANNER_CAROUSEL: { enabled: false, amountMinor: null },
  PHOTOSHOOT: { enabled: false, amountMinor: null },
  linkInBio: { enabled: false, amountMinor: null },
  paidAmplification: { enabled: false, amountMinor: null },
  contentUsageRights: null,
  usageDays: null,
  advancePercent: null,
  balanceTerm: null,
});
