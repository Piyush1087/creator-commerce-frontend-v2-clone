import type {
  GatekeeperFrontendResult,
  GatekeeperJourneyState,
} from "../contracts/gatekeeper.contracts";

export type GatekeeperViewState = {
  state: GatekeeperJourneyState;
  tone: "neutral" | "positive" | "warning" | "error";
  title: string;
  description: string;
  result: GatekeeperFrontendResult;
};

export function mapGatekeeperResultToViewState(
  result: GatekeeperFrontendResult,
): GatekeeperViewState {
  const copy: Record<
    GatekeeperFrontendResult["outcome"],
    Omit<GatekeeperViewState, "state" | "result">
  > = {
    ADMITTED: {
      tone: "positive",
      title: "Brand ready for deeper analysis",
      description: "Review the detected Industry before starting Brand Intelligence.",
    },
    RESUME_AVAILABLE: {
      tone: "positive",
      title: "A recent scan is available",
      description: "You can continue from the most recent reusable scan for this brand.",
    },
    EXISTING_BRAND: {
      tone: "warning",
      title: "This brand already has an account",
      description: "Sign in to continue with the existing brand workspace.",
    },
    ORG_CLAIMED: {
      tone: "warning",
      title: "This organization is already claimed",
      description: "Request access from the existing organization owner or administrator.",
    },
    VERIFICATION_REQUIRED: {
      tone: "warning",
      title: "Domain verification is required",
      description: "Complete the verification step before continuing onboarding.",
    },
    UNSUPPORTED: {
      tone: "warning",
      title: "Automated onboarding is not available for this brand yet",
      description: "Use one of the recovery options made available for this assessment.",
    },
    UNSUPPORTED_LANGUAGE: {
      tone: "warning",
      title: "We need more English website evidence",
      description: "Automated Brand Intelligence currently requires sufficient English evidence.",
    },
    CLASSIFICATION_UNCERTAIN: {
      tone: "warning",
      title: "We need a little more certainty",
      description: "The website evidence was not strong enough for a reliable automated admission decision.",
    },
    HARD_BLOCKED: {
      tone: "error",
      title: "This brand cannot continue through automated onboarding",
      description: "This decision has no ordinary self-service bypass.",
    },
    DOMAIN_UNREACHABLE: {
      tone: "error",
      title: "We couldn’t reach this website",
      description: "Check the website address or retry the connection check.",
    },
    DOMAIN_INVALID: {
      tone: "error",
      title: "This website address can’t be used",
      description: "Edit the website address and try again.",
    },
    TECHNICAL_FAILURE: {
      tone: "error",
      title: "We couldn’t finish this check",
      description: "Your onboarding state is safe. Retry when you’re ready.",
    },
  };

  const mapped = copy[result.outcome];
  return {
    state: result.outcome,
    tone: mapped.tone,
    title: mapped.title,
    description: result.message?.trim() || mapped.description,
    result,
  };
}
