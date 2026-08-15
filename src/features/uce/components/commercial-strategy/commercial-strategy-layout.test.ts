import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { WizardData } from "../../types/campaign-wizard";
import { CommercialStrategyStep } from "./CommercialStrategyStep";

const data = {
  receivesBrandSupport: true,
  brandSupportType: "PRODUCT",
  brandSupportEstimatedValue: 1299,
  compensationModel: "FIXED",
  commercialOffer: 25000,
  totalCampaignBudget: 500000,
  advancePaymentPercentage: 25,
  payoutTerms: "NET_15",
} as WizardData;

const commercialCss = readFileSync(new URL("./commercial-strategy.css", import.meta.url), "utf8");
const frameCss = readFileSync(new URL("../create-campaign-frame/create-campaign-frame.css", import.meta.url), "utf8");

function renderCommercialStep() {
  return renderToStaticMarkup(createElement(CommercialStrategyStep, {
    data,
    currency: "INR",
    patchData: vi.fn(),
    errors: {},
    validateOnExit: vi.fn(),
  }));
}

describe("Commercial Strategy responsive Payment Terms", () => {
  it("keeps all canonical Advance choices selectable with 25% selected", () => {
    const html = renderCommercialStep();
    for (const value of [0, 25, 50, 75, 100]) {
      expect(html).toContain(`name="advance"`);
      expect(html).toContain(`<span>${value}%</span>`);
    }
    expect(html).toContain('name="advance" checked=""');
    expect(html).toContain('<span>25%</span>');
  });

  it("retains the desktop five-column row and uses a three-column mobile grid", () => {
    expect(commercialCss).toMatch(/commercial-choice-grid--advance\s*\{\s*grid-template-columns:\s*repeat\(5,/);
    expect(commercialCss).toMatch(/@media \(max-width: 767px\)[\s\S]*commercial-choice-grid--advance\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,/);
    expect(commercialCss).toContain("min-height: 44px");
    expect(commercialCss).toContain("gap: var(--space-sm)");
  });

  it("preserves canonical commercial values and complete Payout Terms helper", () => {
    const html = renderCommercialStep();
    expect(html).toContain("1,299");
    expect(html).toContain("25,000");
    expect(html).toContain("5,00,000");
    expect(html).toContain('<option value="NET_15" selected="">Net 15</option>');
    expect(html).toContain("Remaining payout is due within 15 days of the approved payment trigger.");
  });

  it("reserves mobile clearance for actions, navigation, safe area and helper spacing", () => {
    expect(frameCss).toContain("var(--height-bottom-nav) + 128px + var(--space-md) + env(safe-area-inset-bottom)");
  });
});
