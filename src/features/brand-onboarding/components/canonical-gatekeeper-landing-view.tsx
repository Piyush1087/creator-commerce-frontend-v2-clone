import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LandingPageView } from "./landing-page-view";
import { GatekeeperConfirmationModal } from "./gatekeeper-confirmation-modal";
import { GatekeeperRecoveryPanel } from "./gatekeeper-recovery-panel";
import { gatekeeperEntrySchema } from "../gatekeeper/gatekeeper-entry-schema";
import {
  mapGatekeeperResultToViewState,
  type GatekeeperAdmissionEnvelope,
  type GatekeeperRecoveryAction,
} from "../gatekeeper/gatekeeper-runtime";
import {
  postGatekeeperAdmission,
  postGatekeeperIndustryConfirmation,
  postGatekeeperWaitlist,
} from "../api/gatekeeper-client";
import { ONBOARDING_ROUTES } from "../constants";
import "../gatekeeper-reconciliation.css";

export function CanonicalGatekeeperLandingView() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [ownershipAttested, setOwnershipAttested] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"IDLE" | "SUBMITTING" | "RESOLVING" | "RECOVERY" | "PRE_SCAN_CONFIRMATION" | "STARTING_SURFACE_SCAN">("IDLE");
  const [envelope, setEnvelope] = useState<GatekeeperAdmissionEnvelope | null>(null);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const busy = phase === "SUBMITTING" || phase === "RESOLVING" || phase === "STARTING_SURFACE_SCAN";

  const submit = async () => {
    const parsed = gatekeeperEntrySchema.safeParse({
      url,
      ownershipAttested,
      legalAccepted,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0] ?? "form")] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setActionNotice(null);
    setEmailMode(false);
    setEmailStatus(null);
    setPhase("SUBMITTING");
    try {
      setPhase("RESOLVING");
      const nextEnvelope = await postGatekeeperAdmission({
        url: parsed.data.url,
        ownershipAttested: true,
        legalAccepted: true,
      });
      setEnvelope(nextEnvelope);
      const state = mapGatekeeperResultToViewState(nextEnvelope.result);
      setPhase(state.kind === "PRE_SCAN_CONFIRMATION" ? "PRE_SCAN_CONFIRMATION" : "RECOVERY");
    } catch (error) {
      setEnvelope({
        result: {
          version: "gatekeeper_v1",
          decision: {
            outcome: "TECHNICAL_FAILURE",
            reason_code: "PROVIDER_CHAIN_EXHAUSTED",
            recovery_actions: ["RETRY"],
            manual_review_eligible: false,
          },
        },
      });
      setActionNotice(error instanceof Error ? error.message : "Something interrupted the check.");
      setPhase("RECOVERY");
    }
  };

  const onRecoveryAction = (action: GatekeeperRecoveryAction) => {
    if (action === "RETRY") {
      void submit();
      return;
    }
    if (action === "SIGN_IN") {
      navigate("/login");
      return;
    }
    if (action === "VERIFY_DOMAIN") {
      navigate(ONBOARDING_ROUTES.verification);
      return;
    }
    if (action === "RESUME" && envelope?.brandProfileId) {
      navigate(ONBOARDING_ROUTES.dna, {
        state: {
          url: envelope.normalizedUrl ?? url,
          leadId: envelope.leadId ?? "",
          brandProfileId: envelope.brandProfileId,
          scanMode: "cached" as const,
        },
      });
      return;
    }
    if (action === "JOIN_WAITLIST") {
      setEmailMode(true);
      setEmailStatus(null);
      return;
    }
    if (action === "CONTACT_SUPPORT") {
      window.location.href = "mailto:hello@thecreatorshop.com?subject=Gatekeeper%20support";
      return;
    }
    setActionNotice("This recovery option is available for this brand, but its production destination still needs to be connected in the application shell.");
  };

  const submitWaitlist = async () => {
    if (!envelope) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailStatus("Enter a valid email address.");
      return;
    }
    try {
      setEmailStatus("Submitting…");
      await postGatekeeperWaitlist({ email: email.trim(), envelope });
      setEmailStatus("You're on the waitlist.");
    } catch (error) {
      setEmailStatus(error instanceof Error ? error.message : "Could not submit the waitlist request.");
    }
  };

  const confirmIndustry = async (selectedIndustry: string) => {
    if (!envelope?.leadId) {
      setActionNotice("The Gatekeeper session is missing. Please run the website check again.");
      return;
    }
    setPhase("STARTING_SURFACE_SCAN");
    try {
      const confirmed = await postGatekeeperIndustryConfirmation(envelope.leadId, selectedIndustry);
      setEnvelope({ ...envelope, result: confirmed.result });
      if (confirmed.result.decision.outcome === "UNSUPPORTED" || !confirmed.surfaceEligible) {
        setPhase("RECOVERY");
        return;
      }
      navigate(ONBOARDING_ROUTES.scan, {
        state: {
          url: envelope.normalizedUrl ?? url,
          leadId: envelope.leadId,
          confirmedIndustry: confirmed.confirmedIndustry ?? selectedIndustry,
        },
      });
    } catch (error) {
      setActionNotice(error instanceof Error ? error.message : "Could not start the Brand Intelligence scan.");
      setPhase("PRE_SCAN_CONFIRMATION");
    }
  };

  const assessedIndustry = envelope?.result.assessment?.provisional_industry ?? "D2C";
  const domain = envelope?.domain ?? envelope?.result.submission?.normalized_domain ?? url.replace(/^https?:\/\//i, "").split("/")[0];

  return (
    <div className="gk-reconciled-homepage">
      <section className="gk-entry" id="landing-hero" aria-labelledby="gk-entry-title">
        <div className="gk-entry__copy">
          <p className="gk-entry__eyebrow">Brand Intelligence starts here</p>
          <h1 id="gk-entry-title">Meet the creators who fit your brand, starting with a clearer picture of your business.</h1>
          <p>Share your website and we'll first check whether Creator Shop can safely begin automated onboarding.</p>
        </div>
        <form className="gk-entry__card" onSubmit={(event) => { event.preventDefault(); void submit(); }} noValidate>
          <label className="gk-field" htmlFor="gk-url">
            <span>Website URL</span>
            <input id="gk-url" inputMode="url" autoComplete="url" value={url} disabled={busy} onChange={(event) => { setUrl(event.target.value); setErrors((current) => ({ ...current, url: "" })); }} placeholder="yourbrand.com" aria-invalid={Boolean(errors.url)} aria-describedby={errors.url ? "gk-url-error" : undefined} />
          </label>
          {errors.url ? <p id="gk-url-error" className="gk-field-error" role="alert">{errors.url}</p> : null}
          <label className="gk-check-row">
            <input type="checkbox" checked={ownershipAttested} disabled={busy} onChange={(event) => { setOwnershipAttested(event.target.checked); setErrors((current) => ({ ...current, ownershipAttested: "" })); }} />
            <span>I confirm I own or am authorized to represent this brand.</span>
          </label>
          {errors.ownershipAttested ? <p className="gk-field-error" role="alert">{errors.ownershipAttested}</p> : null}
          <label className="gk-check-row">
            <input type="checkbox" checked={legalAccepted} disabled={busy} onChange={(event) => { setLegalAccepted(event.target.checked); setErrors((current) => ({ ...current, legalAccepted: "" })); }} />
            <span>I agree to the <a href="#terms" onClick={(event) => event.stopPropagation()}>Terms of Service</a> and <a href="#privacy" onClick={(event) => event.stopPropagation()}>Privacy Policy</a>.</span>
          </label>
          {errors.legalAccepted ? <p className="gk-field-error" role="alert">{errors.legalAccepted}</p> : null}
          <button type="submit" className="gk-button gk-button--primary gk-entry__submit" disabled={busy}>{busy ? "Checking your brand…" : "Analyze My Brand"}</button>
          {phase === "SUBMITTING" || phase === "RESOLVING" ? (
            <div className="gk-activity" aria-live="polite"><span aria-hidden />Checking your website and brand eligibility…</div>
          ) : null}
          {phase === "RECOVERY" && envelope ? (
            <GatekeeperRecoveryPanel envelope={envelope} onAction={onRecoveryAction} emailMode={emailMode} email={email} emailStatus={emailStatus} onEmailChange={setEmail} onEmailSubmit={() => void submitWaitlist()} />
          ) : null}
          {actionNotice ? <p className="gk-action-notice" role="status">{actionNotice}</p> : null}
        </form>
      </section>
      <GatekeeperConfirmationModal open={phase === "PRE_SCAN_CONFIRMATION" || phase === "STARTING_SURFACE_SCAN"} domain={domain} assessedIndustry={assessedIndustry} busy={phase === "STARTING_SURFACE_SCAN"} onClose={() => { if (phase !== "STARTING_SURFACE_SCAN") setPhase("IDLE"); }} onConfirm={(industry) => void confirmIndustry(industry)} />
      <div className="gk-legacy-homepage" aria-hidden={false}>
        <LandingPageView />
      </div>
    </div>
  );
}
