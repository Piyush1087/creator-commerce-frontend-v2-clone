import { afterEach, describe, expect, it, vi } from "vitest";

import {
  confirmGatekeeperIndustry,
  GATEKEEPER_PRIVACY_VERSION,
  GATEKEEPER_TERMS_VERSION,
  runGatekeeperAdmission,
} from "./gatekeeper-client";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Gatekeeper runtime client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses resolve first and submits the canonical validation controls", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          outcome: "proceed",
          normalizedUrl: "https://brand.com/",
          domain: "brand.com",
          industry: "D2C",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          leadId: "lead-1",
          gatekeeper_result: {
            submission: {
              normalized_url: "https://brand.com/",
              normalized_domain: "brand.com",
            },
            assessment: { provisional_industry: "D2C" },
            decision: {
              outcome: "ADMITTED",
              reason_code: null,
              recovery_actions: ["CONTINUE"],
              manual_review_eligible: false,
            },
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await runGatekeeperAdmission({
      url: "https://brand.com",
      brandOwnershipOrAuthorizationAttestation: true,
      termsAcceptance: true,
      privacyPolicyAcceptance: true,
    });

    expect(result).toMatchObject({
      outcome: "ADMITTED",
      leadId: "lead-1",
      provisionalIndustry: "D2C",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/v1/discovery/resolve",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ url: "https://brand.com" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/discovery/validate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          url: "https://brand.com",
          ownershipAuthorizationAttested: true,
          termsAccepted: true,
          privacyPolicyAccepted: true,
          termsVersion: GATEKEEPER_TERMS_VERSION,
          privacyPolicyVersion: GATEKEEPER_PRIVACY_VERSION,
        }),
      }),
    );
  });

  it("parses the authoritative confirmation and Surface handoff response", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        leadId: "lead/1",
        gatekeeper_result: {
          submission: {
            normalized_url: "https://brand.com/",
            normalized_domain: "brand.com",
          },
          assessment: { provisional_industry: "D2C" },
          decision: {
            outcome: "ADMITTED",
            reason_code: null,
            recovery_actions: ["CONTINUE"],
            manual_review_eligible: false,
          },
          confirmation: {
            assessed_industry: "D2C",
            confirmed_industry: "SAAS_AI",
            confirmation_source: "USER_CONFIRMED_OVERRIDE",
            industry_disagreement_flag: true,
            surface_eligible: true,
          },
        },
        surface_handoff: {
          normalized_url: "https://brand.com/",
          normalized_domain: "brand.com",
          confirmed_industry: "SAAS_AI",
          gatekeeper_completed: true,
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await confirmGatekeeperIndustry({
      leadId: "lead/1",
      selectedIndustry: "SAAS_AI",
    });

    expect(result).toMatchObject({
      confirmedIndustry: "SAAS_AI",
      confirmationSource: "USER_CONFIRMED_OVERRIDE",
      industryDisagreementFlag: true,
      surfaceEligible: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/discovery/lead%2F1/confirm-industry",
      expect.objectContaining({
        body: JSON.stringify({
          selectedIndustry: "SAAS_AI",
          explicitConfirmation: true,
        }),
      }),
    );
  });
});
