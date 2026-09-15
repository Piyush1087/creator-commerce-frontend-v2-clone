import { describe, it, expect } from "vitest";
import {
  WorkValuesSchema,
  RateValuesSchema,
  WorkConsumerSchema,
  RateConsumerSchema,
  MONEY_KEYS,
} from "./commercial.schema";
import { commercialFixture } from "../testing/commercial.fixture";
import {
  formatMinor,
  parsePrice,
  RATE_LABELS,
  RATE_TERMS,
} from "./rate-card.presentation";
describe("Commercial strict frontend contracts", () => {
  it.each(["OWNER", "MANAGER", "ASSISTANT"] as const)(
    "admits bounded %s contracts",
    (role) => {
      const { work, rates } = commercialFixture(role);
      expect(WorkConsumerSchema.safeParse(work).success).toBe(true);
      expect(RateConsumerSchema.safeParse(rates).success).toBe(true);
    },
  );
  it("rejects fabrication, injected values, conflicting industries and unauthorized edit projection", () => {
    const { work, rates } = commercialFixture();
    for (const value of [
      { ...work, secretPayloadEncrypted: "not-admitted" },
      { ...work, currentRevision: 0 },
      { ...work, readiness: { ...work.readiness, kyc: "VERIFIED" } },
      { ...work, context: { ...work.context, role: "ASSISTANT" } },
      {
        ...work,
        country: { ...work.country, canonicalRateCardCurrency: "USD" },
      },
    ])
      expect(WorkConsumerSchema.safeParse(value).success).toBe(false);
    expect(
      WorkValuesSchema.safeParse({ ...work.values, baseCountry: "ZZ" }).success,
    ).toBe(false);
    expect(
      WorkValuesSchema.safeParse({
        ...work.values,
        preferredIndustryIds: ["D2C"],
        excludedIndustryIds: ["D2C"],
      }).success,
    ).toBe(false);
    expect(
      RateValuesSchema.safeParse({
        ...rates.values,
        UGC_VIDEO: { enabled: true, amountMinor: 1 },
      }).success,
    ).toBe(false);
    expect(
      RateValuesSchema.safeParse({ ...rates.values, currency: "USD" }).success,
    ).toBe(false);
    expect(
      RateValuesSchema.safeParse({ ...rates.values, balanceTerm: "IMMEDIATE" })
        .success,
    ).toBe(false);
  });
  it.each(MONEY_KEYS.map((key) => ({ key })))(
    "enforces $key and stale money fails closed",
    ({ key }) => {
      const { rates } = commercialFixture();
      for (const amountMinor of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])
        expect(
          RateValuesSchema.safeParse({
            ...rates.values,
            [key]: { enabled: true, amountMinor },
          }).success,
        ).toBe(false);
      expect(
        RateConsumerSchema.safeParse({
          ...rates,
          state: "MONETARY_RATES_REQUIRE_REENTRY",
          values: { ...rates.values, [key]: { enabled: true, amountMinor: 1 } },
        }).success,
      ).toBe(false);
    },
  );
  it("uses exact decimal-to-minor arithmetic and frozen references", () => {
    expect(parsePrice("100.01")).toBe(10001);
    expect(parsePrice("0.01")).toBe(1);
    expect(parsePrice("90071992547409.91")).toBe(Number.MAX_SAFE_INTEGER);
    expect(formatMinor(Number.MAX_SAFE_INTEGER)).toBe("90071992547409.91");
    for (const value of ["0", "-1", "1e3", "1.001", "90071992547409.92"])
      expect(parsePrice(value)).toBeNull();
    expect(RATE_LABELS.paidAmplification.label).toBe("Partnership Ads");
    expect(RATE_TERMS).toHaveLength(9);
  });
});
