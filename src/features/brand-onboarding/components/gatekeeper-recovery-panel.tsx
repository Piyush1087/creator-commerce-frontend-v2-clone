import type { GatekeeperAdmissionEnvelope, GatekeeperRecoveryAction } from "../gatekeeper/gatekeeper-runtime";

const COPY: Record<string, { title: string; body: string }> = {
  DOMAIN_INVALID: { title: "Check the website address", body: "We couldn't use this website address. Update it and try again." },
  DOMAIN_UNREACHABLE: { title: "We couldn't reach this website", body: "The site may be temporarily unavailable. You can retry without re-entering the details above." },
  EXISTING_BRAND: { title: "This brand already has an account", body: "Sign in to continue with the existing Creator Shop brand." },
  ORG_CLAIMED: { title: "This brand is already claimed", body: "Request access from the existing organization if you're part of this brand team." },
  RESUME_AVAILABLE: { title: "A recent scan is available", body: "Continue from the existing brand scan rather than starting over." },
  VERIFICATION_REQUIRED: { title: "Domain verification is required", body: "Complete the verification step before continuing." },
  UNSUPPORTED_LANGUAGE: { title: "Automated onboarding isn't available for this site yet", body: "We need sufficient English brand evidence for the current automated experience." },
  UNSUPPORTED: { title: "This brand isn't supported for automated onboarding yet", body: "You can use any recovery options available below." },
  CLASSIFICATION_UNCERTAIN: { title: "We need a little more certainty", body: "The available evidence wasn't strong enough for an automatic admission decision." },
  HARD_BLOCKED: { title: "We can't onboard this website", body: "This website doesn't meet the current admission requirements." },
  TECHNICAL_FAILURE: { title: "Something interrupted the check", body: "Your details are still here. Retry the Gatekeeper check when you're ready." },
};

const ACTION_LABELS: Record<GatekeeperRecoveryAction, string> = {
  CONTINUE: "Continue",
  RESUME: "Resume scan",
  SIGN_IN: "Sign in",
  REQUEST_ORG_ACCESS: "Request access",
  VERIFY_DOMAIN: "Verify domain",
  JOIN_WAITLIST: "Join waitlist",
  REQUEST_CLASSIFICATION_REVIEW: "Request review",
  RETRY: "Retry",
  CONTACT_SUPPORT: "Contact support",
};

export function GatekeeperRecoveryPanel({
  envelope,
  onAction,
  emailMode,
  email,
  emailStatus,
  onEmailChange,
  onEmailSubmit,
}: {
  envelope: GatekeeperAdmissionEnvelope;
  onAction: (action: GatekeeperRecoveryAction) => void;
  emailMode: boolean;
  email: string;
  emailStatus: string | null;
  onEmailChange: (value: string) => void;
  onEmailSubmit: () => void;
}) {
  const outcome = envelope.result.decision.outcome;
  const copy = COPY[outcome] ?? COPY.TECHNICAL_FAILURE;
  return (
    <div className="gk-recovery" role="status" aria-live="polite">
      <div className="gk-recovery__badge">{outcome.replace(/_/g, " ")}</div>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      <div className="gk-recovery__actions">
        {envelope.result.decision.recovery_actions.map((action, index) => (
          <button
            key={action}
            type="button"
            className={index === 0 ? "gk-button gk-button--primary" : "gk-button gk-button--secondary"}
            onClick={() => onAction(action)}
          >
            {ACTION_LABELS[action]}
          </button>
        ))}
      </div>
      {emailMode ? (
        <div className="gk-recovery__email">
          <label htmlFor="gk-waitlist-email">Work email</label>
          <div className="gk-recovery__email-row">
            <input
              id="gk-waitlist-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="you@brand.com"
            />
            <button type="button" className="gk-button gk-button--primary" onClick={onEmailSubmit}>
              Submit
            </button>
          </div>
          {emailStatus ? <p className="gk-recovery__email-status" role="status">{emailStatus}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
