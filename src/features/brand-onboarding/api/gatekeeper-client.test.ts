import { afterEach, describe, expect, it, vi } from "vitest";

import {
  confirmGatekeeperIndustry,
  fetchGatekeeperSupportDestination,
  GATEKEEPER_PRIVACY_VERSION,
  GATEKEEPER_TERMS_VERSION,
  requestGatekeeperClassificationReview,
  requestGatekeeperOrganizationAccess,
  runGatekeeperAdmission,
} from "./gatekeeper-client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
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

  it("posts the exact organization-access endpoint and body", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse(
        {
          request: {
            id: "request-1",
            type: "REQUEST_ORG_ACCESS",
            status: "RECEIVED",
            discoveryLeadId: "lead/1",
            normalizedDomain: "brand.com",
            submittedAt: "2026-08-21T12:00:00.000Z",
          },
        },
        201,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await requestGatekeeperOrganizationAccess({
      leadId: "lead/1",
      requesterEmail: "requester@example.com",
      authorizedRepresentativeAttested: true,
    });

    expect(response.request).toMatchObject({
      type: "REQUEST_ORG_ACCESS",
      status: "RECEIVED",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/discovery/lead%2F1/request-org-access",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterEmail: "requester@example.com",
          authorizedRepresentativeAttested: true,
        }),
      },
    );
  });

  it("posts the exact classification-review endpoint and body", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse(
        {
          request: {
            id: "request-2",
            type: "REQUEST_CLASSIFICATION_REVIEW",
            status: "RECEIVED",
            discoveryLeadId: "lead-2",
            normalizedDomain: "brand.com",
            submittedAt: "2026-08-21T12:00:00.000Z",
          },
        },
        201,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestGatekeeperClassificationReview({
      leadId: "lead-2",
      requesterEmail: "requester@example.com",
      authorizedRepresentativeAttested: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/discovery/lead-2/request-classification-review",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterEmail: "requester@example.com",
          authorizedRepresentativeAttested: true,
        }),
      },
    );
  });

  it("fetches the canonical support destination with GET", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        support: {
          type: "URL",
          href: "https://support.example.com/gatekeeper",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchGatekeeperSupportDestination()).resolves.toEqual({
      type: "URL",
      href: "https://support.example.com/gatekeeper",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/discovery/support", {
      method: "GET",
    });
  });

  it.each([
    {},
    { support: { type: "EMAIL", href: "mailto:help@example.com" } },
    { support: { type: "URL", href: "javascript:alert(1)" } },
  ])("fails safely for a malformed support response", async (body) => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse(body)),
    );

    await expect(fetchGatekeeperSupportDestination()).rejects.toThrow(
      "The support destination could not be verified.",
    );
  });

  it("surfaces the backend's honest support configuration failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValueOnce(
        jsonResponse(
          {
            code: "GATEKEEPER_SUPPORT_NOT_CONFIGURED",
            message: "The Gatekeeper support destination is unavailable.",
          },
          503,
        ),
      ),
    );

    await expect(fetchGatekeeperSupportDestination()).rejects.toMatchObject({
      status: 503,
      message: "The Gatekeeper support destination is unavailable.",
    });
  });

  it("rejects a malformed recovery receipt", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValueOnce(
        jsonResponse(
          {
            request: {
              id: "request-1",
              type: "REQUEST_ORG_ACCESS",
              status: "CREATED",
            },
          },
          201,
        ),
      ),
    );

    await expect(
      requestGatekeeperOrganizationAccess({
        leadId: "lead-1",
        requesterEmail: "requester@example.com",
        authorizedRepresentativeAttested: true,
      }),
    ).rejects.toThrow("invalid recovery request receipt");
  });
});
