import { describe, expect, it } from "vitest";

import { parseGatekeeperResult, parseIndustryConfirmation } from "./gatekeeper-runtime-schema";

describe("Gatekeeper runtime adapter", () => {
  it("maps a canonical admitted result without reading UI copy", () => {
    const result = parseGatekeeperResult({
      gatekeeper_result: {
        submission: { normalized_url: "https://brand.com", normalized_domain: "brand.com" },
        assessment: { provisional_industry: "D2C" },
        decision: {
          outcome: "ADMITTED",
          reason_code: null,
          recovery_actions: ["CONTINUE"],
          manual_review_eligible: false,
        },
        leadId: "lead-1",
      },
    });
    expect(result.outcome).toBe("ADMITTED");
    expect(result.recoveryActions).toEqual(["CONTINUE"]);
    expect(result.provisionalIndustry).toBe("D2C");
  });

  it("maps legacy waitlist transport into canonical unsupported presentation", () => {
    const result = parseGatekeeperResult({
      outcome: "waitlist",
      reason: "UNSUPPORTED_INDUSTRY",
      normalizedUrl: "https://brand.com",
      domain: "brand.com",
      industry: "REAL_ESTATE",
    });
    expect(result.outcome).toBe("UNSUPPORTED");
    expect(result.recoveryActions).toEqual(["JOIN_WAITLIST"]);
  });

  it("requires explicit Surface eligibility from Industry confirmation", () => {
    expect(() =>
      parseIndustryConfirmation({
        decision: { outcome: "ADMITTED", recovery_actions: ["CONTINUE"], manual_review_eligible: false },
        confirmedIndustry: "D2C",
      }),
    ).toThrow(/Surface eligibility/);
  });

  it("preserves supported override disagreement metadata", () => {
    const confirmation = parseIndustryConfirmation({
      decision: { outcome: "ADMITTED", recovery_actions: ["CONTINUE"], manual_review_eligible: false },
      assessment: { provisional_industry: "D2C" },
      leadId: "lead-1",
      confirmedIndustry: "SAAS_AI",
      confirmationSource: "USER_CONFIRMED_OVERRIDE",
      industryDisagreementFlag: true,
      surfaceEligible: true,
    });
    expect(confirmation.surfaceEligible).toBe(true);
    expect(confirmation.industryDisagreementFlag).toBe(true);
    expect(confirmation.confirmationSource).toBe("USER_CONFIRMED_OVERRIDE");
  });
});
