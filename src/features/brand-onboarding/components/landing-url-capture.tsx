import { useEffect, useMemo, useState } from "react";
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
import type {
  GatekeeperFrontendResult,
  GatekeeperJourneyState,
  GatekeeperRecoveryAction,
  SupportedGatekeeperIndustry,
} from "../contracts/gatekeeper.contracts";
import {
  SUPPORTED_GATEKEEPER_INDUSTRIES,
} from "../contracts/gatekeeper.contracts";
import { mapGatekeeperResultToViewState } from "../mappers/map-gatekeeper-result";
import { saveBrandOnboardingSession } from "../session/onboarding-session";
import { urlSchema } from "../schemas/url-schema";
import { GatekeeperConfirmationModal } from "./gatekeeper-confirmation-modal";
import "./gatekeeper-reconciliation.css";

export type LandingUrlCaptureMode =
  | "default"
  | "syntax_error"
  | "infra_retry"
  | "blocked_locked"
  | "resume"
  | "verification_required"
  | "org_claimed"
  | "brand_active"
  | "waitlist";

type LandingUrlCaptureProps = {
  isBusy: boolean;
  mode?: LandingUrlCaptureMode;
  lockedUrl?: string;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  feedback?: { tone: "error" | "warning" | "success"; message: string } | null;
  helperText?: string | null;
  onPrimaryAction: (url: string) => void | Promise<void>;
};

type ClientErrors = {
  url?: string;
  ownership?: string;
  legal?: string;
};

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

export function LandingUrlCapture(props: LandingUrlCaptureProps) {
  const navigate = useNavigate();
  const [url, setUrl] = useState(props.lockedUrl ?? "");
  const [ownershipAccepted, setOwnershipAccepted] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [errors, setErrors] = useState<ClientErrors>({});
  const [journeyState, setJourneyState] = useState<GatekeeperJourneyState>("IDLE");
  const [result, setResult] = useState<GatekeeperFrontendResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [startError, setStartError] = useState<string | null>(null);
  const [emailExpansion, setEmailExpansion] = useState<"waitlist" | "review" | "org" | null>(null);
  const [email, setEmail] = useState("");
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (props.lockedUrl && journeyState === "IDLE") setUrl(props.lockedUrl);
  }, [journeyState, props.lockedUrl]);

  const busy = journeyState === "SUBMITTING" || journeyState === "RESOLVING" || journeyState === "STARTING_SURFACE_SCAN";
  const viewState = useMemo(
    () => (result ? mapGatekeeperResultToViewState(result) : null),
    [result],
  );

  const validate = (): string | null => {
    const nextErrors: ClientErrors = {};
    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) nextErrors.url = parsed.error.issues[0]?.message ?? "Enter a valid website URL.";
    if (!ownershipAccepted) nextErrors.ownership = "Confirm that you own or are authorized to represent this brand.";
    if (!legalAccepted) nextErrors.legal = "Accept the Terms of Service and Privacy Policy to continue.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setJourneyState("CLIENT_VALIDATION_ERROR");
      return null;
    }
    return parsed.success ? parsed.data : null;
  };

  const beginAdmission = async () => {
    const normalizedInput = validate();
    if (!normalizedInput) return;
    setResult(null);
    setEmailExpansion(null);
    setEmailFeedback(null);
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
      if (next.outcome === "ADMITTED") {
        const detected = next.provisionalIndustry as SupportedGatekeeperIndustry | null;
        if (!detected || !SUPPORTED_GATEKEEPER_INDUSTRIES.includes(detected)) {
          setResult({
            ...next,
            outcome: "TECHNICAL_FAILURE",
            recoveryActions: ["RETRY"],
            message: "The admission response is missing a supported Industry confirmation value.",
          });
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
      setResult({
        outcome: "TECHNICAL_FAILURE",
        reasonCode: null,
        recoveryActions: ["RETRY"],
        manualReviewEligible: false,
        normalizedUrl: normalizedInput,
        normalizedDomain: null,
        leadId: null,
        brandProfileId: null,
        provisionalIndustry: null,
        message: error instanceof Error ? error.message : "We couldn’t finish this check.",
      });
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
          state: { url: result.normalizedUrl, leadId: result.leadId, brandProfileId: result.brandProfileId },
        });
        return;
      case "RESUME":
        if (!result.leadId || !result.brandProfileId) {
          setEmailFeedback("This resumable scan is missing session context. Retry the website check.");
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
        setEmailFeedback(null);
        return;
      case "REQUEST_CLASSIFICATION_REVIEW":
        setEmailExpansion("review");
        setEmailFeedback(null);
        return;
      case "REQUEST_ORG_ACCESS":
        setEmailExpansion("org");
        setEmailFeedback(null);
        return;
      case "CONTACT_SUPPORT":
        setEmailFeedback("Support contact is not configured in this frontend build yet.");
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

    if (emailExpansion === "waitlist") {
      const industry = result.provisionalIndustry;
      if (!industry) {
        setEmailFeedback("Industry context is unavailable. Retry the website check.");
        return;
      }
      try {
        await postDiscoveryWaitlist({
          email: trimmed,
          industry: industry as never,
          reason: "UNSUPPORTED_INDUSTRY",
          domain: result.normalizedDomain ?? new URL(result.normalizedUrl ?? url).hostname,
          discoveryLeadId: result.leadId ?? undefined,
          sourceUrl: result.normalizedUrl ?? url,
        });
        setEmailFeedback("Thanks — your waitlist request was submitted.");
      } catch (error) {
        setEmailFeedback(error instanceof Error ? error.message : "Could not submit the waitlist request.");
      }
      return;
    }

    setEmailFeedback(
      emailExpansion === "review"
        ? "The classification-review request capability is not exposed by the current frontend API client yet."
        : "The organization-access request capability is not exposed by the current frontend API client yet.",
    );
  };

  const confirmIndustry = async (unsupported: boolean) => {
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
      if (unsupported || confirmation.gatekeeper.outcome === "UNSUPPORTED") {
        setModalOpen(false);
        setJourneyState(confirmation.gatekeeper.outcome);
        return;
      }
      if (
        confirmation.gatekeeper.outcome !== "ADMITTED" ||
        !confirmation.surfaceEligible ||
        !confirmation.confirmedIndustry
      ) {
        throw new Error("Industry confirmation did not authorize Surface Intelligence.");
      }
      saveBrandOnboardingSession({
        leadId: result.leadId,
        brandProfileId: confirmation.gatekeeper.brandProfileId ?? result.brandProfileId ?? "",
        normalizedUrl: confirmation.gatekeeper.normalizedUrl ?? result.normalizedUrl ?? url,
      });
      navigate(ONBOARDING_ROUTES.scan, {
        state: {
          url: confirmation.gatekeeper.normalizedUrl ?? result.normalizedUrl ?? url,
          leadId: result.leadId,
        },
      });
    } catch (error) {
      setJourneyState("PRE_SCAN_CONFIRMATION");
      setStartError(error instanceof Error ? error.message : "Could not start Brand Intelligence.");
    }
  };

  const detectedIndustry = result?.provisionalIndustry as SupportedGatekeeperIndustry | undefined;

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
                if (journeyState === "CLIENT_VALIDATION_ERROR") setJourneyState("IDLE");
              }}
            />
          </div>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy && journeyState !== "STARTING_SURFACE_SCAN" ? "Checking…" : "Analyze My Brand"}
          </Button>
        </div>
        {errors.url ? <p id="gk-url-error" className="gk-form-error" role="alert">{errors.url}</p> : null}

        <div className="gk-entry__consents">
          <label className="gk-check">
            <input
              type="checkbox"
              checked={ownershipAccepted}
              disabled={busy}
              onChange={(event) => {
                setOwnershipAccepted(event.target.checked);
                setErrors((current) => ({ ...current, ownership: undefined }));
              }}
            />
            <span>I confirm I own or am authorized to represent this brand.</span>
          </label>
          {errors.ownership ? <p className="gk-form-error" role="alert">{errors.ownership}</p> : null}

          <label className="gk-check">
            <input
              type="checkbox"
              checked={legalAccepted}
              disabled={busy}
              onChange={(event) => {
                setLegalAccepted(event.target.checked);
                setErrors((current) => ({ ...current, legal: undefined }));
              }}
            />
            <span>
              I agree to the <a href="/terms" onClick={(event) => event.stopPropagation()}>Terms of Service</a> and <a href="/privacy" onClick={(event) => event.stopPropagation()}>Privacy Policy</a>.
            </span>
          </label>
          {errors.legal ? <p className="gk-form-error" role="alert">{errors.legal}</p> : null}
        </div>
      </form>

      {journeyState === "SUBMITTING" || journeyState === "RESOLVING" ? (
        <div className="gk-activity" role="status" aria-live="polite">
          <span className="gk-activity__dot" aria-hidden />
          <span>Checking your brand and website…</span>
        </div>
      ) : null}

      {viewState && result?.outcome !== "ADMITTED" ? (
        <section className={`gk-recovery gk-recovery--${viewState.tone}`} aria-live="polite">
          <div className="gk-recovery__status">
            {viewState.tone === "error" ? <CircleAlert size={20} aria-hidden /> : viewState.tone === "warning" ? <AlertCircle size={20} aria-hidden /> : <Info size={20} aria-hidden />}
            <div>
              <h3>{viewState.title}</h3>
              <p>{viewState.description}</p>
            </div>
          </div>
          <div className="gk-recovery__actions">
            {result.recoveryActions.map((action, index) => (
              <Button
                key={action}
                type="button"
                variant={index === 0 ? "primary" : "secondary"}
                onClick={() => void handleRecoveryAction(action)}
              >
                {action === "RETRY" ? <RefreshCw size={16} aria-hidden /> : null}
                {actionLabels[action]}
              </Button>
            ))}
          </div>

          {emailExpansion ? (
            <div className="gk-recovery__expansion">
              <strong>
                {emailExpansion === "waitlist" ? "Join the waitlist" : emailExpansion === "review" ? "Request classification review" : "Request organization access"}
              </strong>
              <input
                type="email"
                placeholder="Work email address"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailFeedback(null);
                }}
              />
              {emailExpansion !== "waitlist" ? (
                <>
                  <label className="gk-check"><input type="checkbox" /> <span>I confirm I am authorized to make this request for the brand.</span></label>
                  <label className="gk-check"><input type="checkbox" /> <span>I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</span></label>
                </>
              ) : null}
              <div className="gk-recovery__actions">
                <Button type="button" variant="primary" onClick={() => void submitEmailRecovery()}>Submit request</Button>
                <Button type="button" variant="secondary" onClick={() => { setEmailExpansion(null); setEmailFeedback(null); }}>Cancel</Button>
              </div>
              {emailFeedback ? <p className="gk-form-error" role="status">{emailFeedback}</p> : null}
            </div>
          ) : emailFeedback ? <p className="gk-form-error" role="status">{emailFeedback}</p> : null}
        </section>
      ) : null}

      {detectedIndustry && SUPPORTED_GATEKEEPER_INDUSTRIES.includes(detectedIndustry) ? (
        <GatekeeperConfirmationModal
          open={modalOpen}
          domain={result?.normalizedDomain ?? result?.normalizedUrl ?? url}
          detectedIndustry={detectedIndustry}
          selectedIndustry={selectedIndustry}
          isStarting={journeyState === "STARTING_SURFACE_SCAN"}
          error={startError}
          onSelectIndustry={setSelectedIndustry}
          onResetIndustry={() => setSelectedIndustry(detectedIndustry)}
          onConfirmSupported={() => confirmIndustry(false)}
          onConfirmUnsupported={() => confirmIndustry(true)}
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
