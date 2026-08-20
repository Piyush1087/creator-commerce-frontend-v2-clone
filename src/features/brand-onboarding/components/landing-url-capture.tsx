import { useMemo, useRef, useState } from "react";
import { AlertCircle, CircleAlert, Info, Link2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import { postDiscoveryWaitlist } from "../api/discovery-client";
import {
  confirmGatekeeperIndustry,
  runGatekeeperAdmission,
} from "../api/gatekeeper-client";
import { ONBOARDING_ROUTES } from "../constants";
import {
  INDUSTRY_VERTICALS,
  type IndustryVertical,
  type WaitlistReasonCode,
} from "../contracts/discovery.contracts";
import {
  SUPPORTED_GATEKEEPER_INDUSTRIES,
  type GatekeeperFrontendResult,
  type GatekeeperJourneyState,
  type GatekeeperRecoveryAction,
  type SupportedGatekeeperIndustry,
} from "../contracts/gatekeeper.contracts";
import { mapGatekeeperResultToViewState } from "../mappers/map-gatekeeper-result";
import { urlSchema } from "../schemas/url-schema";
import { saveBrandOnboardingSession } from "../session/onboarding-session";
import { GatekeeperConfirmationModal } from "./gatekeeper-confirmation-modal";
import "./gatekeeper-reconciliation.css";

type ClientErrors = {
  url?: string;
  ownership?: string;
  legal?: string;
};

type RecoveryExpansion = "waitlist" | "review" | "org";

const actionLabels: Record<GatekeeperRecoveryAction, string> = {
  CONTINUE: "Continue",
  RESUME: "Resume",
  SIGN_IN: "Sign in",
  REQUEST_ORG_ACCESS: "Request access",
  VERIFY_DOMAIN: "Verify domain",
  JOIN_WAITLIST: "Join waitlist",
  REQUEST_CLASSIFICATION_REVIEW: "Request review",
  RETRY: "Try again",
  CONTACT_SUPPORT: "Contact support",
};

function asIndustryVertical(value: string | null): IndustryVertical | null {
  return value && INDUSTRY_VERTICALS.includes(value as IndustryVertical)
    ? (value as IndustryVertical)
    : null;
}

function waitlistReason(result: GatekeeperFrontendResult): WaitlistReasonCode {
  if (result.outcome === "UNSUPPORTED_LANGUAGE") return "FOREIGN_LANGUAGE";
  if (result.reasonCode === "PARKED_DOMAIN") return "PARKED_DOMAIN";
  if (result.reasonCode === "CONTENT_UNREADABLE") return "CONTENT_UNREADABLE";
  return "UNSUPPORTED_INDUSTRY";
}

function localTechnicalFailure(
  message: string,
  normalizedUrl: string,
): GatekeeperFrontendResult {
  return {
    outcome: "TECHNICAL_FAILURE",
    reasonCode: null,
    recoveryActions: ["RETRY"],
    manualReviewEligible: false,
    normalizedUrl,
    normalizedDomain: null,
    leadId: null,
    brandProfileId: null,
    provisionalIndustry: null,
    message,
  };
}

export function LandingUrlCapture() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [ownershipAccepted, setOwnershipAccepted] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [errors, setErrors] = useState<ClientErrors>({});
  const [journeyState, setJourneyState] =
    useState<GatekeeperJourneyState>("IDLE");
  const [result, setResult] = useState<GatekeeperFrontendResult | null>(null);
  const [recoveryIndustry, setRecoveryIndustry] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [startError, setStartError] = useState<string | null>(null);
  const [emailExpansion, setEmailExpansion] =
    useState<RecoveryExpansion | null>(null);
  const [email, setEmail] = useState("");
  const [recoveryAuthorized, setRecoveryAuthorized] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);
  const modalReturnFocusRef = useRef<HTMLElement | null>(null);

  const busy =
    journeyState === "SUBMITTING" ||
    journeyState === "RESOLVING" ||
    journeyState === "STARTING_SURFACE_SCAN";

  const viewState = useMemo(
    () => (result ? mapGatekeeperResultToViewState(result) : null),
    [result],
  );

  const visibleRecoveryActions = useMemo(() => {
    if (!result) return [];
    return result.recoveryActions.filter(
      (action) =>
        action !== "REQUEST_CLASSIFICATION_REVIEW" ||
        result.manualReviewEligible,
    );
  }, [result]);

  const validate = (): string | null => {
    const nextErrors: ClientErrors = {};
    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) {
      nextErrors.url =
        parsed.error.issues[0]?.message ?? "Enter a valid website URL.";
    }
    if (!ownershipAccepted) {
      nextErrors.ownership =
        "Confirm that you own or are authorized to represent this brand.";
    }
    if (!legalAccepted) {
      nextErrors.legal =
        "Accept the Terms of Service and Privacy Policy to continue.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setJourneyState("CLIENT_VALIDATION_ERROR");
      return null;
    }
    return parsed.success ? parsed.data : null;
  };

  const resetRecoveryInteraction = () => {
    setEmailExpansion(null);
    setEmail("");
    setRecoveryAuthorized(false);
    setEmailFeedback(null);
  };

  const updateLegalAcceptance = (accepted: boolean) => {
    setLegalAccepted(accepted);
    setErrors((current) => ({ ...current, legal: undefined }));
  };

  const beginAdmission = async () => {
    const normalizedInput = validate();
    if (!normalizedInput) return;

    modalReturnFocusRef.current = document.activeElement as HTMLElement | null;
    setResult(null);
    setRecoveryIndustry(null);
    resetRecoveryInteraction();
    setStartError(null);
    setJourneyState("SUBMITTING");

    try {
      setJourneyState("RESOLVING");
      const next = await runGatekeeperAdmission({
        url: normalizedInput,
        brandOwnershipOrAuthorizationAttestation: true,
        termsAcceptance: true,
        privacyPolicyAcceptance: true,
      });
      setResult(next);
      setRecoveryIndustry(next.provisionalIndustry);

      if (next.outcome === "ADMITTED") {
        const detected = next.provisionalIndustry as SupportedGatekeeperIndustry | null;
        if (!detected || !SUPPORTED_GATEKEEPER_INDUSTRIES.includes(detected)) {
          const failure = localTechnicalFailure(
            "The admission response is missing a supported Industry confirmation value.",
            next.normalizedUrl ?? normalizedInput,
          );
          setResult(failure);
          setJourneyState("TECHNICAL_FAILURE");
          return;
        }
        setSelectedIndustry(detected);
        setJourneyState("PRE_SCAN_CONFIRMATION");
        setModalOpen(true);
        return;
      }

      setJourneyState(next.outcome);
    } catch (error) {
      const failure = localTechnicalFailure(
        error instanceof Error ? error.message : "We couldn’t finish this check.",
        normalizedInput,
      );
      setResult(failure);
      setJourneyState("TECHNICAL_FAILURE");
    }
  };

  const handleRecoveryAction = async (action: GatekeeperRecoveryAction) => {
    if (!result) return;

    switch (action) {
      case "RETRY":
        await beginAdmission();
        return;
      case "SIGN_IN":
        navigate(AUTH_ROUTES.login);
        return;
      case "VERIFY_DOMAIN":
        navigate(ONBOARDING_ROUTES.verification, {
          state: {
            url: result.normalizedUrl,
            leadId: result.leadId,
            brandProfileId: result.brandProfileId,
          },
        });
        return;
      case "RESUME":
        if (!result.leadId || !result.brandProfileId) {
          setEmailFeedback(
            "This resumable scan is missing session context. Retry the website check.",
          );
          return;
        }
        saveBrandOnboardingSession({
          leadId: result.leadId,
          brandProfileId: result.brandProfileId,
          normalizedUrl: result.normalizedUrl ?? url,
        });
        navigate(ONBOARDING_ROUTES.dna, {
          state: {
            url: result.normalizedUrl ?? url,
            leadId: result.leadId,
            brandProfileId: result.brandProfileId,
            scanMode: "cached" as const,
          },
        });
        return;
      case "JOIN_WAITLIST":
        setEmailExpansion("waitlist");
        setRecoveryAuthorized(false);
        setEmailFeedback(null);
        return;
      case "REQUEST_CLASSIFICATION_REVIEW":
        if (!result.manualReviewEligible) return;
        setEmailExpansion("review");
        setRecoveryAuthorized(false);
        setEmailFeedback(null);
        return;
      case "REQUEST_ORG_ACCESS":
        setEmailExpansion("org");
        setRecoveryAuthorized(false);
        setEmailFeedback(null);
        return;
      case "CONTACT_SUPPORT":
        setEmailFeedback(
          "The support destination is not configured for this Gatekeeper build yet.",
        );
        return;
      case "CONTINUE":
        return;
    }
  };

  const submitEmailRecovery = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailFeedback("Enter a valid email address.");
      return;
    }
    if (!result || !emailExpansion) return;

    if (emailExpansion !== "waitlist" && !recoveryAuthorized) {
      setEmailFeedback("Confirm that you are authorized to make this request.");
      return;
    }

    if (emailExpansion === "waitlist") {
      const industry = asIndustryVertical(recoveryIndustry);
      if (!industry) {
        setEmailFeedback(
          "Industry context is unavailable for this waitlist request. Retry the website check.",
        );
        return;
      }
      try {
        await postDiscoveryWaitlist({
          email: trimmed,
          industry,
          reason: waitlistReason(result),
          domain:
            result.normalizedDomain ??
            new URL(result.normalizedUrl ?? url).hostname,
          discoveryLeadId: result.leadId ?? undefined,
          sourceUrl: result.normalizedUrl ?? url,
        });
        setEmailFeedback("Thanks — your waitlist request was submitted.");
      } catch (error) {
        setEmailFeedback(
          error instanceof Error
            ? error.message
            : "Could not submit the waitlist request.",
        );
      }
      return;
    }

    // These recovery actions are canonical, but this frontend repository does
    // not yet expose the corresponding transport clients. Do not invent an API
    // path or claim a successful request.
    setEmailFeedback(
      emailExpansion === "review"
        ? "Classification-review request transport is not wired in this environment yet."
        : "Organization-access request transport is not wired in this environment yet.",
    );
  };

  const confirmIndustry = async () => {
    if (!result?.leadId) {
      setStartError("Missing Gatekeeper session. Retry the website check.");
      return;
    }

    setStartError(null);
    setJourneyState("STARTING_SURFACE_SCAN");

    try {
      const confirmation = await confirmGatekeeperIndustry({
        leadId: result.leadId,
        selectedIndustry,
      });
      setResult(confirmation.gatekeeper);
      setRecoveryIndustry(
        confirmation.confirmedIndustry ?? selectedIndustry,
      );

      if (confirmation.gatekeeper.outcome !== "ADMITTED") {
        setModalOpen(false);
        setJourneyState(confirmation.gatekeeper.outcome);
        return;
      }

      if (!confirmation.surfaceEligible || !confirmation.confirmedIndustry) {
        throw new Error(
          "Industry confirmation did not authorize Surface Intelligence.",
        );
      }

      const normalizedUrl =
        confirmation.gatekeeper.normalizedUrl ?? result.normalizedUrl ?? url;
      const brandProfileId =
        confirmation.gatekeeper.brandProfileId ?? result.brandProfileId;

      if (brandProfileId) {
        saveBrandOnboardingSession({
          leadId: result.leadId,
          brandProfileId,
          normalizedUrl,
        });
      }

      navigate(ONBOARDING_ROUTES.scan, {
        state: {
          url: normalizedUrl,
          leadId: result.leadId,
        },
      });
    } catch (error) {
      setJourneyState("PRE_SCAN_CONFIRMATION");
      setStartError(
        error instanceof Error
          ? error.message
          : "Could not start Brand Intelligence.",
      );
    }
  };

  const detectedIndustry = result?.provisionalIndustry as
    | SupportedGatekeeperIndustry
    | undefined;

  return (
    <div className="gk-entry">
      <form
        className="gk-entry__form"
        onSubmit={(event) => {
          event.preventDefault();
          void beginAdmission();
        }}
        noValidate
      >
        <div className="gk-entry__input-row">
          <div className="bob-url-glass__input-wrap">
            <Link2 size={21} aria-hidden className="bob-url-glass__icon" />
            <input
              className="gk-entry__input"
              name="brandUrl"
              inputMode="url"
              autoComplete="url"
              placeholder="Your website URL"
              value={url}
              disabled={busy}
              aria-invalid={errors.url ? true : undefined}
              aria-describedby={errors.url ? "gk-url-error" : undefined}
              onChange={(event) => {
                setUrl(event.target.value);
                setErrors((current) => ({ ...current, url: undefined }));
                if (journeyState === "CLIENT_VALIDATION_ERROR") {
                  setJourneyState("IDLE");
                }
              }}
            />
          </div>
          <Button type="submit" variant="primary" disabled={busy}>
            {journeyState === "SUBMITTING" || journeyState === "RESOLVING"
              ? "Checking…"
              : "Analyze My Brand"}
          </Button>
        </div>

        {errors.url ? (
          <p id="gk-url-error" className="gk-form-error" role="alert">
            {errors.url}
          </p>
        ) : null}

        <div className="gk-entry__consents">
          <label className="gk-check">
            <input
              type="checkbox"
              checked={ownershipAccepted}
              disabled={busy}
              aria-invalid={errors.ownership ? true : undefined}
              aria-describedby={errors.ownership ? "gk-ownership-error" : undefined}
              onChange={(event) => {
                setOwnershipAccepted(event.target.checked);
                setErrors((current) => ({ ...current, ownership: undefined }));
              }}
            />
            <span>I confirm I own or am authorized to represent this brand.</span>
          </label>
          {errors.ownership ? (
            <p id="gk-ownership-error" className="gk-form-error" role="alert">
              {errors.ownership}
            </p>
          ) : null}

          <div
            className="gk-check gk-check--legal"
            onClick={(event) => {
              const target = event.target as HTMLElement;
              if (!target.closest("a, input")) {
                updateLegalAcceptance(!legalAccepted);
              }
            }}
          >
            <input
              type="checkbox"
              aria-label="I agree to the Terms of Service and Privacy Policy"
              checked={legalAccepted}
              disabled={busy}
              aria-invalid={errors.legal ? true : undefined}
              aria-describedby={errors.legal ? "gk-legal-error" : undefined}
              onChange={(event) => updateLegalAcceptance(event.target.checked)}
            />
            <span>
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noreferrer"
              >
                Privacy Policy
              </a>
              .
            </span>
          </div>
          {errors.legal ? (
            <p id="gk-legal-error" className="gk-form-error" role="alert">
              {errors.legal}
            </p>
          ) : null}
        </div>
      </form>

      {journeyState === "SUBMITTING" || journeyState === "RESOLVING" ? (
        <div className="gk-activity" role="status" aria-live="polite">
          <span className="gk-activity__dot" aria-hidden />
          <span>Checking your brand and website…</span>
        </div>
      ) : null}

      {viewState && result?.outcome !== "ADMITTED" ? (
        <section
          className={`gk-recovery gk-recovery--${viewState.tone}`}
          aria-live="polite"
        >
          <div className="gk-recovery__status">
            {viewState.tone === "error" ? (
              <CircleAlert size={20} aria-hidden />
            ) : viewState.tone === "warning" ? (
              <AlertCircle size={20} aria-hidden />
            ) : (
              <Info size={20} aria-hidden />
            )}
            <div>
              <h3>{viewState.title}</h3>
              <p>{viewState.description}</p>
            </div>
          </div>

          {visibleRecoveryActions.length > 0 ? (
            <div className="gk-recovery__actions">
              {visibleRecoveryActions.map((action, index) => (
                <Button
                  key={action}
                  type="button"
                  variant={index === 0 ? "primary" : "secondary"}
                  onClick={() => void handleRecoveryAction(action)}
                >
                  {action === "RETRY" ? (
                    <RefreshCw size={16} aria-hidden />
                  ) : null}
                  {actionLabels[action]}
                </Button>
              ))}
            </div>
          ) : null}

          {!emailExpansion && emailFeedback ? (
            <p role="status" aria-live="polite">
              {emailFeedback}
            </p>
          ) : null}

          {emailExpansion ? (
            <div className="gk-recovery__expansion">
              <strong>
                {emailExpansion === "waitlist"
                  ? "Join the waitlist"
                  : emailExpansion === "review"
                    ? "Request classification review"
                    : "Request organization access"}
              </strong>
              <input
                type="email"
                autoComplete="email"
                aria-label="Work email address"
                placeholder="Work email address"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailFeedback(null);
                }}
              />

              {emailExpansion !== "waitlist" ? (
                <label className="gk-check">
                  <input
                    type="checkbox"
                    checked={recoveryAuthorized}
                    onChange={(event) => {
                      setRecoveryAuthorized(event.target.checked);
                      setEmailFeedback(null);
                    }}
                  />
                  <span>I confirm I am authorized to make this request.</span>
                </label>
              ) : null}

              <div className="gk-recovery__actions">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => void submitEmailRecovery()}
                >
                  Submit request
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => resetRecoveryInteraction()}
                >
                  Cancel
                </Button>
              </div>

              {emailFeedback ? (
                <p role="status" aria-live="polite">
                  {emailFeedback}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {detectedIndustry && result ? (
        <GatekeeperConfirmationModal
          open={modalOpen}
          domain={
            result.normalizedDomain ??
            result.normalizedUrl ??
            url
          }
          detectedIndustry={detectedIndustry}
          selectedIndustry={selectedIndustry}
          isStarting={journeyState === "STARTING_SURFACE_SCAN"}
          error={startError}
          returnFocusTarget={modalReturnFocusRef.current}
          onSelectIndustry={setSelectedIndustry}
          onResetIndustry={() => setSelectedIndustry(detectedIndustry)}
          onConfirmSupported={confirmIndustry}
          onConfirmUnsupported={confirmIndustry}
          onClose={() => {
            if (journeyState !== "STARTING_SURFACE_SCAN") {
              setModalOpen(false);
              setJourneyState("ADMITTED");
            }
          }}
        />
      ) : null}
    </div>
  );
}
