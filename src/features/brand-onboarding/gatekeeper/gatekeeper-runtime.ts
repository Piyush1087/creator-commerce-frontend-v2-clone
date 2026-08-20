import { z } from "zod";

export const GATEKEEPER_OUTCOMES = [
  "ADMITTED",
  "RESUME_AVAILABLE",
  "EXISTING_BRAND",
  "ORG_CLAIMED",
  "VERIFICATION_REQUIRED",
  "UNSUPPORTED",
  "UNSUPPORTED_LANGUAGE",
  "CLASSIFICATION_UNCERTAIN",
  "HARD_BLOCKED",
  "DOMAIN_UNREACHABLE",
  "DOMAIN_INVALID",
  "TECHNICAL_FAILURE",
] as const;

export const GATEKEEPER_RECOVERY_ACTIONS = [
  "CONTINUE",
  "RESUME",
  "SIGN_IN",
  "REQUEST_ORG_ACCESS",
  "VERIFY_DOMAIN",
  "JOIN_WAITLIST",
  "REQUEST_CLASSIFICATION_REVIEW",
  "RETRY",
  "CONTACT_SUPPORT",
] as const;

export const SUPPORTED_GATEKEEPER_INDUSTRIES = [
  "D2C",
  "SAAS_AI",
  "HEALTHCARE",
  "OFFLINE_SERVICES",
] as const;

export type GatekeeperOutcome = (typeof GATEKEEPER_OUTCOMES)[number];
export type GatekeeperRecoveryAction = (typeof GATEKEEPER_RECOVERY_ACTIONS)[number];
export type SupportedGatekeeperIndustry =
  (typeof SUPPORTED_GATEKEEPER_INDUSTRIES)[number];

const decisionSchema = z.object({
  outcome: z.enum(GATEKEEPER_OUTCOMES),
  reason_code: z.string().nullable().optional(),
  recovery_actions: z.array(z.enum(GATEKEEPER_RECOVERY_ACTIONS)).default([]),
  manual_review_eligible: z.boolean().default(false),
});

const gatekeeperResultSchema = z
  .object({
    version: z.literal("gatekeeper_v1").optional(),
    submission: z
      .object({
        normalized_url: z.string().optional(),
        normalized_domain: z.string().optional(),
      })
      .partial()
      .optional(),
    assessment: z
      .object({
        provisional_industry: z.string().nullable().optional(),
      })
      .partial()
      .optional(),
    decision: decisionSchema,
    handoff: z
      .object({
        gatekeeper_completed: z.boolean().optional(),
        confirmed_industry_required: z.boolean().optional(),
      })
      .partial()
      .optional(),
  })
  .passthrough();

export type GatekeeperResult = z.infer<typeof gatekeeperResultSchema>;

export type GatekeeperAdmissionEnvelope = {
  result: GatekeeperResult;
  leadId?: string;
  brandProfileId?: string;
  normalizedUrl?: string;
  domain?: string;
};

export function parseGatekeeperResult(value: unknown): GatekeeperResult | null {
  const direct = gatekeeperResultSchema.safeParse(value);
  if (direct.success) {
    return direct.data;
  }
  if (value && typeof value === "object") {
    const nested = (value as { gatekeeper_result?: unknown }).gatekeeper_result;
    const parsed = gatekeeperResultSchema.safeParse(nested);
    if (parsed.success) {
      return parsed.data;
    }
  }
  return null;
}

export function isSupportedGatekeeperIndustry(
  value: string,
): value is SupportedGatekeeperIndustry {
  return (SUPPORTED_GATEKEEPER_INDUSTRIES as readonly string[]).includes(value);
}

export const GATEKEEPER_INDUSTRY_LABELS: Record<SupportedGatekeeperIndustry, string> = {
  D2C: "D2C",
  SAAS_AI: "AI / SaaS",
  HEALTHCARE: "Healthcare",
  OFFLINE_SERVICES: "Offline Services",
};

export type GatekeeperViewState =
  | { kind: "IDLE" }
  | { kind: "CLIENT_VALIDATION_ERROR" }
  | { kind: "SUBMITTING" }
  | { kind: "RESOLVING" }
  | { kind: "PRE_SCAN_CONFIRMATION"; result: GatekeeperResult }
  | { kind: "STARTING_SURFACE_SCAN"; result: GatekeeperResult }
  | {
      kind: Exclude<GatekeeperOutcome, "ADMITTED">;
      result: GatekeeperResult;
    };

export function mapGatekeeperResultToViewState(
  result: GatekeeperResult,
): GatekeeperViewState {
  if (result.decision.outcome === "ADMITTED") {
    return { kind: "PRE_SCAN_CONFIRMATION", result };
  }
  return { kind: result.decision.outcome, result };
}
