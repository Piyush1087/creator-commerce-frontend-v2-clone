import { z } from "zod";

import {
  GATEKEEPER_OUTCOMES,
  GATEKEEPER_RECOVERY_ACTIONS,
  type GatekeeperFrontendResult,
  type GatekeeperIndustryConfirmation,
  type GatekeeperOutcome,
  type GatekeeperRecoveryAction,
} from "../contracts/gatekeeper.contracts";

const OutcomeSchema = z.enum(GATEKEEPER_OUTCOMES);
const RecoveryActionSchema = z.enum(GATEKEEPER_RECOVERY_ACTIONS);

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function booleanValue(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") return value;
  }
  return null;
}

function parseActions(value: unknown): GatekeeperRecoveryAction[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = RecoveryActionSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

function canonicalCandidate(value: unknown): Record<string, unknown> | null {
  const root = record(value);
  if (!root) return null;
  return (
    record(root.gatekeeper_result) ??
    record(root.gatekeeperResult) ??
    record(root.result) ??
    root
  );
}

function canonicalOutcome(value: unknown): GatekeeperOutcome | null {
  const candidate = canonicalCandidate(value);
  if (!candidate) return null;
  const decision = record(candidate.decision);
  const parsed = OutcomeSchema.safeParse(decision?.outcome ?? candidate.outcome);
  return parsed.success ? parsed.data : null;
}

export function parseGatekeeperResult(value: unknown): GatekeeperFrontendResult {
  const root = record(value);
  const candidate = canonicalCandidate(value);
  if (!root || !candidate) {
    throw new Error("Unexpected Gatekeeper response.");
  }

  const decision = record(candidate.decision);
  const submission = record(candidate.submission);
  const assessment = record(candidate.assessment);
  const handoff = record(candidate.handoff);
  const outcome = canonicalOutcome(value);

  if (outcome) {
    return {
      outcome,
      reasonCode: stringValue(
        decision?.reason_code,
        decision?.reasonCode,
        candidate.reason_code,
        candidate.reasonCode,
      ),
      recoveryActions: parseActions(
        decision?.recovery_actions ??
          decision?.recoveryActions ??
          candidate.recovery_actions ??
          candidate.recoveryActions,
      ),
      manualReviewEligible:
        booleanValue(
          decision?.manual_review_eligible,
          decision?.manualReviewEligible,
          candidate.manual_review_eligible,
          candidate.manualReviewEligible,
        ) ?? false,
      normalizedUrl: stringValue(
        submission?.normalized_url,
        submission?.normalizedUrl,
        candidate.normalized_url,
        candidate.normalizedUrl,
      ),
      normalizedDomain: stringValue(
        submission?.normalized_domain,
        submission?.normalizedDomain,
        candidate.normalized_domain,
        candidate.normalizedDomain,
        candidate.domain,
      ),
      leadId: stringValue(
        candidate.lead_id,
        candidate.leadId,
        handoff?.lead_id,
        handoff?.leadId,
        root.leadId,
      ),
      brandProfileId: stringValue(
        candidate.brand_profile_id,
        candidate.brandProfileId,
        handoff?.brand_profile_id,
        handoff?.brandProfileId,
        root.brandProfileId,
      ),
      provisionalIndustry: stringValue(
        assessment?.provisional_industry,
        assessment?.provisionalIndustry,
        candidate.provisional_industry,
        candidate.provisionalIndustry,
        candidate.industry,
      ),
      message: stringValue(candidate.message, decision?.message, root.message),
    };
  }

  // Temporary compatibility layer for the pre-canonical resolve/validate transport.
  // These actions are derived only because the legacy transport does not carry the
  // canonical recovery_actions array. Remove this branch once the canonical result
  // is the only deployed response shape.
  const legacyOutcome = stringValue(root.outcome);
  const normalizedUrl = stringValue(root.normalizedUrl, root.url);
  const domain = stringValue(root.domain);
  const leadId = stringValue(root.leadId);
  const brandProfileId = stringValue(root.brandProfileId);
  const industry = stringValue(root.industry);
  const message = stringValue(root.message);

  const legacyMap: Record<string, GatekeeperFrontendResult> = {
    blocked: {
      outcome:
        stringValue(root.code) === "BLOCKED_INDUSTRY"
          ? "HARD_BLOCKED"
          : "DOMAIN_INVALID",
      reasonCode: stringValue(root.code, root.reason),
      recoveryActions:
        stringValue(root.code) === "BLOCKED_INDUSTRY" ? [] : ["RETRY"],
      manualReviewEligible: false,
      normalizedUrl,
      normalizedDomain: domain,
      leadId,
      brandProfileId,
      provisionalIndustry: industry,
      message,
    },
    org_claimed: {
      outcome: "ORG_CLAIMED",
      reasonCode: "ORGANIZATION_ALREADY_CLAIMED",
      recoveryActions: ["REQUEST_ORG_ACCESS"],
      manualReviewEligible: false,
      normalizedUrl,
      normalizedDomain: domain,
      leadId,
      brandProfileId,
      provisionalIndustry: industry,
      message,
    },
    brand_active: {
      outcome: "EXISTING_BRAND",
      reasonCode: "EXISTING_VERIFIED_BRAND",
      recoveryActions: ["SIGN_IN"],
      manualReviewEligible: false,
      normalizedUrl,
      normalizedDomain: domain,
      leadId,
      brandProfileId,
      provisionalIndustry: industry,
      message,
    },
    verification_required: {
      outcome: "VERIFICATION_REQUIRED",
      reasonCode: "DOMAIN_VERIFICATION_REQUIRED",
      recoveryActions: ["VERIFY_DOMAIN"],
      manualReviewEligible: false,
      normalizedUrl,
      normalizedDomain: domain,
      leadId,
      brandProfileId,
      provisionalIndustry: industry,
      message,
    },
    resume: {
      outcome: "RESUME_AVAILABLE",
      reasonCode: "RECENT_RESUMABLE_SCAN",
      recoveryActions: ["RESUME"],
      manualReviewEligible: false,
      normalizedUrl,
      normalizedDomain: domain,
      leadId,
      brandProfileId,
      provisionalIndustry: industry,
      message,
    },
    infrastructure_error: {
      outcome: "DOMAIN_UNREACHABLE",
      reasonCode: stringValue(root.reason) ?? "DNS_OR_TIMEOUT",
      recoveryActions: ["RETRY"],
      manualReviewEligible: false,
      normalizedUrl,
      normalizedDomain: domain,
      leadId,
      brandProfileId,
      provisionalIndustry: industry,
      message,
    },
    waitlist: {
      outcome:
        stringValue(root.reason) === "FOREIGN_LANGUAGE"
          ? "UNSUPPORTED_LANGUAGE"
          : "UNSUPPORTED",
      reasonCode: stringValue(root.reason),
      recoveryActions: ["JOIN_WAITLIST"],
      manualReviewEligible: false,
      normalizedUrl,
      normalizedDomain: domain,
      leadId,
      brandProfileId,
      provisionalIndustry: industry,
      message,
    },
    success: {
      outcome: "ADMITTED",
      reasonCode: null,
      recoveryActions: ["CONTINUE"],
      manualReviewEligible: false,
      normalizedUrl,
      normalizedDomain: domain,
      leadId,
      brandProfileId,
      provisionalIndustry: industry,
      message,
    },
  };

  const mapped = legacyOutcome ? legacyMap[legacyOutcome] : undefined;
  if (!mapped) throw new Error("Unexpected Gatekeeper response.");
  return mapped;
}

export function parseIndustryConfirmation(
  value: unknown,
): GatekeeperIndustryConfirmation {
  const root = record(value);
  const candidate = canonicalCandidate(value);
  if (!root || !candidate) {
    throw new Error("Unexpected Industry confirmation response.");
  }

  const gatekeeper = parseGatekeeperResult(value);
  const handoff = record(candidate.handoff);
  const confirmation =
    record(candidate.confirmation) ??
    record(candidate.industry_confirmation) ??
    record(candidate.industryConfirmation) ??
    record(root.industryConfirmation);
  const surfaceHandoff =
    record(root.surface_handoff) ?? record(root.surfaceHandoff);

  const surfaceEligible = booleanValue(
    confirmation?.surface_eligible,
    confirmation?.surfaceEligible,
    candidate.surface_eligible,
    candidate.surfaceEligible,
    handoff?.surface_eligible,
    handoff?.surfaceEligible,
    root.surfaceEligible,
  );

  if (surfaceEligible === null) {
    throw new Error("Industry confirmation response is missing Surface eligibility.");
  }
  if (surfaceEligible && !surfaceHandoff) {
    throw new Error("Industry confirmation response is missing the Surface handoff.");
  }

  return {
    gatekeeper,
    confirmedIndustry: stringValue(
      confirmation?.confirmed_industry,
      confirmation?.confirmedIndustry,
      candidate.confirmed_industry,
      candidate.confirmedIndustry,
      surfaceHandoff?.confirmed_industry,
      surfaceHandoff?.confirmedIndustry,
      handoff?.confirmed_industry,
      handoff?.confirmedIndustry,
    ),
    confirmationSource: stringValue(
      confirmation?.confirmation_source,
      confirmation?.confirmationSource,
      candidate.confirmation_source,
      candidate.confirmationSource,
    ),
    industryDisagreementFlag:
      booleanValue(
        confirmation?.industry_disagreement_flag,
        confirmation?.industryDisagreementFlag,
        candidate.industry_disagreement_flag,
        candidate.industryDisagreementFlag,
      ) ?? false,
    surfaceEligible,
  };
}

export function isResolveProceed(value: unknown): boolean {
  return record(value)?.outcome === "proceed";
}
