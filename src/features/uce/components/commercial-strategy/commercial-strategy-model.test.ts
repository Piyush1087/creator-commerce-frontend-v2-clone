import { describe, expect, it } from "vitest";
import type { WizardData } from "../../types/campaign-wizard";
import { validateCampaignWizardStep } from "../../utils/validate-campaign-wizard";
import { ADVANCE_OPTIONS, PAYOUT_OPTIONS, commercialStrategyCanPublish, commercialStrategySummary, compensationPresentation, formatCommercialAmount, parseCommercialAmount, payoutTermsHelper, supportDisabledPatch } from "./commercial-strategy-model";

const data = { receivesBrandSupport: true, brandSupportType: "PRODUCT", brandSupportEstimatedValue: 1299, compensationModel: "FIXED", commercialOffer: 25000, totalCampaignBudget: 500000, advancePaymentPercentage: 25, payoutTerms: "NET_15" } as WizardData;
describe("Commercial Strategy model", () => {
  it("clears dependent support fields when No is selected", () => expect(supportDisabledPatch()).toEqual({ receivesBrandSupport: false, brandSupportType: null, brandSupportEstimatedValue: null }));
  it("uses one canonical offer with Fixed and Negotiable copy", () => {
    expect(compensationPresentation("FIXED")).toEqual({ label: "Creator Payout", helper: "Fixed payout offered to each creator collaboration." });
    expect(compensationPresentation("NEGOTIABLE")).toEqual({ label: "Payout Starting From", helper: "Creators may make one counter-offer." });
  });
  it("formats INR and USD without corrupting numeric values", () => {
    expect(formatCommercialAmount(500000, "INR")).toBe("5,00,000");
    expect(formatCommercialAmount(500000, "USD")).toBe("500,000");
    expect(parseCommercialAmount("5,00,000")).toBe(500000);
  });
  it("freezes discrete Advance and canonical Payout Terms", () => {
    expect(ADVANCE_OPTIONS).toEqual([0, 25, 50, 75, 100]);
    expect(PAYOUT_OPTIONS.map((item) => item.value)).toEqual(["NET_7", "NET_15", "NET_30", "NET_45", "NET_60"]);
    expect(payoutTermsHelper("NET_15")).toBe("Remaining payout is due within 15 days of the approved payment trigger.");
  });
  it("enforces support type and Budget versus Offer", () => {
    expect(validateCampaignWizardStep(3, data).success).toBe(true);
    expect(validateCampaignWizardStep(3, { ...data, brandSupportType: null }).success).toBe(false);
    expect(validateCampaignWizardStep(3, { ...data, totalCampaignBudget: 24999 }).success).toBe(false);
    expect(commercialStrategyCanPublish({ ...data, totalCampaignBudget: 24999 })).toBe(false);
  });
  it("derives Fixed and Negotiable summaries with server-derived currency", () => {
    expect(commercialStrategySummary(data, "INR")).toEqual([
      { label: "Brand support", value: "Product · ₹1,299" }, { label: "Compensation", value: "Fixed · ₹25,000" },
      { label: "Budget", value: "₹5,00,000" }, { label: "Payment", value: "25% advance · Net 15" },
    ]);
    expect(commercialStrategySummary({ ...data, compensationModel: "NEGOTIABLE", commercialOffer: 20000 }, "USD")[1]).toEqual({ label: "Compensation", value: "Negotiable · Starting from $20,000" });
  });
  it("allows the valid Fixed and Negotiable publication paths", () => {
    expect(commercialStrategyCanPublish(data)).toBe(true);
    expect(commercialStrategyCanPublish({ ...data, compensationModel: "NEGOTIABLE", commercialOffer: 20000 })).toBe(true);
  });
});
