import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { WizardData, WizardFieldErrors } from "../../types/campaign-wizard";
import { CampaignWizardFrame } from "../create-campaign-frame/CreateCampaignFrame";
import { CampaignStrategyStep } from "./CampaignStrategyStep";

const data = {
  name: "Summer Collection",
  objective: "PULSE",
  publishingSchedule: "SCHEDULED",
  publishFrom: "2026-09-15",
  publishUntil: "2026-10-15",
  visibility: "PUBLIC",
} as WizardData;

function renderStep(errors: WizardFieldErrors = {}) {
  return renderToStaticMarkup(createElement(CampaignStrategyStep, {
    data,
    errors,
    patchData: vi.fn(),
    readiness: { status: "idle" },
    retryReadiness: vi.fn(),
    validateOnExit: vi.fn(),
  }));
}

describe("Campaign Strategy accessibility", () => {
  it("associates permanent labels with Campaign Name and scheduled dates", () => {
    const html = renderStep();
    for (const [id, label] of [["campaign-name", "Campaign Name"], ["publish-from", "Publish From"], ["publish-until", "Publish Until"]]) {
      expect(html).toContain(`<label class="cw-label" for="${id}">${label}`);
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("describes controls with helpers and errors without marking valid fields invalid", () => {
    const valid = renderStep();
    expect(valid).toContain('aria-describedby="campaign-name-counter"');
    expect(valid).toContain('aria-describedby="publishing-window-helper"');
    expect(valid).not.toContain('aria-invalid="true"');

    const invalid = renderStep({ name: "Enter a Campaign name.", publishUntil: "Publish Until must be after Publish From." });
    expect(invalid).toContain('aria-describedby="campaign-name-counter campaign-name-error"');
    expect(invalid).toContain('aria-describedby="publishing-window-helper publish-until-error"');
    expect(invalid.match(/aria-invalid="true"/g)).toHaveLength(2);

    const invalidSelection = renderStep({ objective: "Select a Campaign objective." });
    expect(invalidSelection).toContain('aria-invalid="true" aria-describedby="campaign-objective-error"');
  });

  it("uses labelled roving-tabindex radio groups with non-color selection state", () => {
    const html = renderStep();
    expect(html).toContain('role="radiogroup" aria-labelledby="publishing-schedule-heading"');
    expect(html).toContain('role="radiogroup" aria-labelledby="campaign-objective-heading"');
    expect(html).toContain('role="radiogroup" aria-labelledby="campaign-visibility-label"');
    expect(html.match(/role="radio" aria-checked="true" tabindex="0"/g)).toHaveLength(3);
    expect(html).toContain("campaign-choice__indicator");
  });

  it("keeps exactly one page-level heading in the composed wizard", () => {
    const html = renderToStaticMarkup(createElement(CampaignWizardFrame, {
      step: 1,
      autosave: createElement("span", null, "Saved just now"),
      validationSummary: false,
      summary: createElement("aside", null, "Summary"),
      actions: createElement("div", null, "Actions"),
      children: createElement(CampaignStrategyStep, { data, errors: {}, patchData: vi.fn(), readiness: { status: "idle" }, retryReadiness: vi.fn(), validateOnExit: vi.fn() }),
    }));
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("<h1>Create Campaign</h1>");
    expect(html).toContain("<h2>Campaign Strategy</h2>");
  });
});
