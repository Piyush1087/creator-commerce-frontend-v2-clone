import { env } from "../../../shared/config/env";
import {
  parseGatekeeperResult,
  type GatekeeperAdmissionEnvelope,
  type GatekeeperRecoveryAction,
  type GatekeeperResult,
} from "../gatekeeper/gatekeeper-runtime";

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }
  if (!response.ok) {
    const message =
      body && typeof body === "object" && typeof (body as { message?: unknown }).message === "string"
        ? String((body as { message: string }).message)
        : "The request could not be completed. Please try again.";
    throw new Error(message);
  }
  return body;
}

function stringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : undefined;
}

function result(
  outcome: GatekeeperResult["decision"]["outcome"],
  reasonCode: string | null,
  actions: GatekeeperRecoveryAction[],
  provisionalIndustry?: string | null,
): GatekeeperResult {
  return {
    version: "gatekeeper_v1",
    assessment: { provisional_industry: provisionalIndustry ?? null },
    decision: {
      outcome,
      reason_code: reasonCode,
      recovery_actions: actions,
      manual_review_eligible: actions.includes("REQUEST_CLASSIFICATION_REVIEW"),
    },
    handoff: {
      gatekeeper_completed: outcome === "ADMITTED",
      confirmed_industry_required: outcome === "ADMITTED",
    },
  };
}

function adaptLegacy(value: unknown): GatekeeperAdmissionEnvelope | "PROCEED" | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const outcome = body.outcome;
  const leadId = typeof body.leadId === "string" ? body.leadId : undefined;
  const normalizedUrl = typeof body.normalizedUrl === "string" ? body.normalizedUrl : undefined;
  const domain = typeof body.domain === "string" ? body.domain : undefined;
  const brandProfileId = typeof body.brandProfileId === "string" ? body.brandProfileId : undefined;
  const industry = typeof body.industry === "string" ? body.industry : null;

  if (outcome === "proceed") return "PROCEED";
  if (outcome === "success") {
    return { result: result("ADMITTED", null, ["CONTINUE"], industry), leadId, normalizedUrl, domain };
  }
  if (outcome === "resume") {
    return { result: result("RESUME_AVAILABLE", "RECENT_RESUMABLE_SCAN", ["RESUME"], industry), leadId, normalizedUrl, domain, brandProfileId };
  }
  if (outcome === "org_claimed") {
    return { result: result("ORG_CLAIMED", "ORGANIZATION_ALREADY_CLAIMED", ["REQUEST_ORG_ACCESS"]), domain };
  }
  if (outcome === "brand_active") {
    return { result: result("EXISTING_BRAND", "EXISTING_VERIFIED_BRAND", ["SIGN_IN"]), domain };
  }
  if (outcome === "verification_required") {
    return { result: result("VERIFICATION_REQUIRED", "DOMAIN_VERIFICATION_REQUIRED", ["VERIFY_DOMAIN"]), domain, brandProfileId };
  }
  if (outcome === "infrastructure_error") {
    return { result: result("DOMAIN_UNREACHABLE", "DNS_OR_TIMEOUT", ["RETRY"]), leadId, normalizedUrl, domain };
  }
  if (outcome === "waitlist") {
    const reason = body.reason === "FOREIGN_LANGUAGE" ? "INSUFFICIENT_ENGLISH_EVIDENCE" : "UNSUPPORTED_INDUSTRY";
    const canonicalOutcome = body.reason === "FOREIGN_LANGUAGE" ? "UNSUPPORTED_LANGUAGE" : "UNSUPPORTED";
    return { result: result(canonicalOutcome, reason, ["JOIN_WAITLIST"], industry), leadId, normalizedUrl, domain };
  }
  if (outcome === "blocked") {
    const code = typeof body.code === "string" ? body.code : "PROHIBITED_URL";
    if (code === "INVALID_URL") {
      return { result: result("DOMAIN_INVALID", "INVALID_URL", []) };
    }
    return { result: result("HARD_BLOCKED", code, []) };
  }
  return null;
}

async function post(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readJson(response);
}

export async function postGatekeeperAdmission(input: {
  url: string;
  ownershipAttested: true;
  legalAccepted: true;
}): Promise<GatekeeperAdmissionEnvelope> {
  const payload = {
    url: input.url,
    brandOwnershipOrAuthorizationAttestation: input.ownershipAttested,
    termsAcceptance: input.legalAccepted,
    privacyPolicyAcceptance: input.legalAccepted,
  };

  const resolvedRaw = await post("/api/v1/discovery/resolve", payload);
  const canonicalResolve = parseGatekeeperResult(resolvedRaw);
  if (canonicalResolve) {
    return {
      result: canonicalResolve,
      leadId: stringField(resolvedRaw, "leadId"),
      normalizedUrl: stringField(resolvedRaw, "normalizedUrl"),
      domain: stringField(resolvedRaw, "domain"),
      brandProfileId: stringField(resolvedRaw, "brandProfileId"),
    };
  }
  const resolvedLegacy = adaptLegacy(resolvedRaw);
  if (resolvedLegacy && resolvedLegacy !== "PROCEED") return resolvedLegacy;

  const validatedRaw = await post("/api/v1/discovery/validate", payload);
  const canonicalValidate = parseGatekeeperResult(validatedRaw);
  if (canonicalValidate) {
    return {
      result: canonicalValidate,
      leadId: stringField(validatedRaw, "leadId"),
      normalizedUrl: stringField(validatedRaw, "normalizedUrl"),
      domain: stringField(validatedRaw, "domain"),
      brandProfileId: stringField(validatedRaw, "brandProfileId"),
    };
  }
  const validatedLegacy = adaptLegacy(validatedRaw);
  if (!validatedLegacy || validatedLegacy === "PROCEED") {
    throw new Error("Unexpected Gatekeeper response.");
  }
  return validatedLegacy;
}

export type IndustryConfirmationEnvelope = {
  result: GatekeeperResult;
  surfaceEligible: boolean;
  confirmedIndustry?: string;
  confirmationSource?: string;
  industryDisagreementFlag?: boolean;
};

export async function postGatekeeperIndustryConfirmation(
  leadId: string,
  selectedIndustry: string,
): Promise<IndustryConfirmationEnvelope> {
  const raw = await post(`/api/v1/discovery/${encodeURIComponent(leadId)}/confirm-industry`, {
    selectedIndustry,
    explicitConfirmation: true,
  });
  const canonical = parseGatekeeperResult(raw);
  if (!canonical) {
    throw new Error("Unexpected Industry confirmation response.");
  }
  const record = raw as Record<string, unknown>;
  const surfaceEligible =
    record.surfaceEligible === true || record.surface_eligible === true;
  return {
    result: canonical,
    surfaceEligible,
    confirmedIndustry:
      stringField(raw, "confirmedIndustry") ?? stringField(raw, "confirmed_industry"),
    confirmationSource:
      stringField(raw, "confirmationSource") ?? stringField(raw, "confirmation_source"),
    industryDisagreementFlag:
      record.industryDisagreementFlag === true || record.industry_disagreement_flag === true,
  };
}

export async function postGatekeeperWaitlist(input: {
  email: string;
  envelope: GatekeeperAdmissionEnvelope;
}): Promise<void> {
  await post("/api/v1/discovery/waitlist", {
    email: input.email,
    industry: input.envelope.result.assessment?.provisional_industry ?? "UNKNOWN",
    domain: input.envelope.domain,
    discoveryLeadId: input.envelope.leadId,
    sourceUrl: input.envelope.normalizedUrl,
  });
}
