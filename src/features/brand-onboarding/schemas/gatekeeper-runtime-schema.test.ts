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

  it("does not invent recovery actions for canonical results", () => {
    const result = parseGatekeeperResult({
      decision: {
        outcome: "DOMAIN_UNREACHABLE",
        reason_code: "DOMAIN_UNREACHABLE",
        recovery_actions: [],
        manual_review_eligible: false,
      },
    });
    expect(result.recoveryActions).toEqual([]);
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
      leadId: "lead-1",
      gatekeeper_result: {
        decision: { outcome: "ADMITTED", recovery_actions: ["CONTINUE"], manual_review_eligible: false },
        assessment: { provisional_industry: "D2C" },
        confirmation: {
          confirmed_industry: "SAAS_AI",
          confirmation_source: "USER_CONFIRMED_OVERRIDE",
          industry_disagreement_flag: true,
          surface_eligible: true,
        },
      },
      surface_handoff: {
        normalized_url: "https://brand.com",
        normalized_domain: "brand.com",
        confirmed_industry: "SAAS_AI",
        gatekeeper_completed: true,
      },
    });
    expect(confirmation.surfaceEligible).toBe(true);
    expect(confirmation.industryDisagreementFlag).toBe(true);
    expect(confirmation.confirmationSource).toBe("USER_CONFIRMED_OVERRIDE");
  });

  it("parses the exact unsupported confirmation shape without requiring a handoff", () => {
    const confirmation = parseIndustryConfirmation({
      leadId: "lead-1",
      gatekeeper_result: {
        decision: {
          outcome: "UNSUPPORTED",
          reason_code: "UNSUPPORTED_INDUSTRY",
          recovery_actions: ["JOIN_WAITLIST", "REQUEST_CLASSIFICATION_REVIEW"],
          manual_review_eligible: true,
        },
        assessment: { provisional_industry: "D2C" },
        confirmation: {
          confirmed_industry: "MEDIA",
          confirmation_source: "USER_CONFIRMED_UNSUPPORTED",
          industry_disagreement_flag: false,
          surface_eligible: false,
        },
      },
      surface_handoff: null,
    });

    expect(confirmation.gatekeeper.outcome).toBe("UNSUPPORTED");
    expect(confirmation.confirmedIndustry).toBe("MEDIA");
    expect(confirmation.surfaceEligible).toBe(false);
  });

  it("rejects an admitted confirmation that omits the required Surface handoff", () => {
    expect(() =>
      parseIndustryConfirmation({
        leadId: "lead-1",
        gatekeeper_result: {
          decision: {
            outcome: "ADMITTED",
            recovery_actions: ["CONTINUE"],
            manual_review_eligible: false,
          },
          confirmation: {
            confirmed_industry: "D2C",
            confirmation_source: "AI_ASSESSED_ACCEPTED",
            industry_disagreement_flag: false,
            surface_eligible: true,
          },
        },
        surface_handoff: null,
      }),
    ).toThrow(/Surface handoff/);
  });

  it("maps legacy resolve URL rejection to DOMAIN_INVALID with retry", () => {
    const result = parseGatekeeperResult({
      outcome: "blocked",
      code: "PRIVATE_OR_LOCAL_HOST",
      message: "Private hosts cannot be scanned.",
    });

    expect(result.outcome).toBe("DOMAIN_INVALID");
    expect(result.recoveryActions).toEqual(["RETRY"]);
  });
});
