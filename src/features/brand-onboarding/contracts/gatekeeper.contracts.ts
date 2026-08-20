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

export type GatekeeperOutcome = (typeof GATEKEEPER_OUTCOMES)[number];

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

export type GatekeeperRecoveryAction =
  (typeof GATEKEEPER_RECOVERY_ACTIONS)[number];

export const GATEKEEPER_RECOVERY_REQUEST_TYPES = [
  "REQUEST_ORG_ACCESS",
  "REQUEST_CLASSIFICATION_REVIEW",
] as const;

export type GatekeeperRecoveryRequestType =
  (typeof GATEKEEPER_RECOVERY_REQUEST_TYPES)[number];

export type GatekeeperRecoveryRequestInput = {
  leadId: string;
  requesterEmail: string;
  authorizedRepresentativeAttested: true;
  requesterName?: string;
  requesterNote?: string;
};

export type GatekeeperRecoveryRequestReceipt = {
  id: string;
  type: GatekeeperRecoveryRequestType;
  status: "RECEIVED";
  discoveryLeadId: string;
  normalizedDomain: string;
  submittedAt: string;
};

export type GatekeeperRecoveryRequestResponse = {
  request: GatekeeperRecoveryRequestReceipt;
};

export type GatekeeperSupportDestination = {
  type: "URL";
  href: string;
};

export const SUPPORTED_GATEKEEPER_INDUSTRIES = [
  "D2C",
  "SAAS_AI",
  "HEALTHCARE",
  "OFFLINE_SERVICES",
] as const;

export type SupportedGatekeeperIndustry =
  (typeof SUPPORTED_GATEKEEPER_INDUSTRIES)[number];

export const SUPPORTED_GATEKEEPER_INDUSTRY_LABELS: Record<
  SupportedGatekeeperIndustry,
  string
> = {
  D2C: "D2C",
  SAAS_AI: "AI / SaaS",
  HEALTHCARE: "Healthcare",
  OFFLINE_SERVICES: "Offline Services",
};

export type GatekeeperFrontendResult = {
  outcome: GatekeeperOutcome;
  reasonCode: string | null;
  recoveryActions: GatekeeperRecoveryAction[];
  manualReviewEligible: boolean;
  normalizedUrl: string | null;
  normalizedDomain: string | null;
  leadId: string | null;
  brandProfileId: string | null;
  provisionalIndustry: string | null;
  message: string | null;
};

export type GatekeeperIndustryConfirmation = {
  gatekeeper: GatekeeperFrontendResult;
  confirmedIndustry: string | null;
  confirmationSource:
    | "AI_ASSESSED_ACCEPTED"
    | "USER_CONFIRMED_OVERRIDE"
    | "USER_CONFIRMED_UNSUPPORTED"
    | string
    | null;
  industryDisagreementFlag: boolean;
  surfaceEligible: boolean;
};

export type GatekeeperJourneyState =
  | "IDLE"
  | "CLIENT_VALIDATION_ERROR"
  | "SUBMITTING"
  | "RESOLVING"
  | GatekeeperOutcome
  | "PRE_SCAN_CONFIRMATION"
  | "STARTING_SURFACE_SCAN";
