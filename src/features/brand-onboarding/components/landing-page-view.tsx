import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  FileCheck,
  Globe,
  Info,
  Key,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
} from "lucide-react";

import { Button } from "../../../design-system/aurora";

import { postDiscoveryResolve, postDiscoveryValidate, postDiscoveryWaitlist } from "../api/discovery-client";
import { isHttpApiError } from "../api/http-api-error";
import type { IndustryVertical, WaitlistReasonCode } from "../contracts/discovery.contracts";
import { waitlistReasonMessage } from "../contracts/discovery.contracts";
import { ONBOARDING_ROUTES } from "../constants";
import type { LandingGateRedirect, LandingGateRedirectState } from "../landing-gate-redirect";
import {
  loadBrandOnboardingSession,
  saveBrandOnboardingSession,
} from "../session/onboarding-session";
import {
  LANDING_CAPABILITIES,
  LANDING_SECURITY_FEATURES,
  LANDING_SECURITY_MANIFEST,
  LANDING_TRINITY_PILLARS,
  LANDING_TRUST_ITEMS,
} from "./landing-page-content";
import { LandingUrlCapture, type LandingUrlCaptureMode } from "./landing-url-capture";
import { ProcessPreviewModal } from "./process-preview-modal";
import { SetupVerificationModal } from "./setup-verification-modal";

const CAPABILITY_AVATARS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCKNk1b7arJUls_PN1x6O-Kndrvp2y4zVr2cLuCY1HCUoW57ywuJY0Q1rhPH5PPO9ElN1HhYOnztLb3SR6a8DTl7FAkvfML-UXVBvLUdpSsRmWrHyu2wVELhoCCQ6V7QXBT31H33_ryvlhNjLYfGvEYYYCtmfOJpxOOIr5oKABNwMxU6GryvH4ICw-fyGZmulxSHXgtT5T8mzZa8yx20DqiGE9f-2GYtTPnSYNJgt-mbCi7xrL01zp13PA6w8GW_eZY_lqSt_CIaUBM",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD5Y6lzHE26NykapC3gTniSfhwsJMr5EwNTydSbiCqLCqawDTk_T_2xe88IhIGQlCBKZOfza0PZV_WsnSS-ZyPrI-R1ZwDdPYVkoorEBpa3fnPGCF2j5dQsZEwmNESlWKXaXO03APPKUbG8faI5dBq5NGelpqwkU5Yr6c3iLt1DDuN61hjVd5Qu2vjEMW5-GQzKpErdbCKwv9IBXRhqJsvXA1PF1Rz512qjXdwx9_Zpy1TU0snbPPpqPRzxpdOulTrK4wscpaPabfEN",
] as const;

const SECURITY_TERMINAL_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC4G1pPRoiROyUWaJyQYYiDWWrJDnp5h_x0VIZagmQLo_j2LiYs9oP2BjcBPuz8-qaxkd_cUPvzSvd9oW7pEnd9w6IZzZDSJzEJkvnOAhps4i2Tuk-feC56W-bACztwRegpGR8UaQhk4j1hK2UVAOGeJUodlS_W9G-moOXIJH2_yO9qoJvW3aE4f8psuszSNEMr1nr75kY6wDWEk0WCutBVho37gYor8DYm78sn-UQfWp-_KndX-tWiJmeP5AL2mipMIQ0HhbgSmQTO";

function formatIndustry(industry: string): string {
  return industry.replace(/_/g, " ");
}

function waitlistCtaLabel(industry: string): string {
  const label = formatIndustry(industry);
  return `Notify me when ${label} launches`;
}

function applyLandingGateRedirect(
  gate: LandingGateRedirect,
  handlers: {
    setBrandProfileId: (id: string | null) => void;
    setLeadId: (id: string | null) => void;
    setScannedUrl: (url: string) => void;
  },
): void {
  if (gate.kind === "verification_required") {
    handlers.setBrandProfileId(gate.payload.brandProfileId);
    if (gate.leadId) {
      handlers.setLeadId(gate.leadId);
    }
    if (gate.normalizedUrl) {
      handlers.setScannedUrl(gate.normalizedUrl);
    }
  }
}

function trustIcon(icon: (typeof LANDING_TRUST_ITEMS)[number]["icon"]) {
  switch (icon) {
    case "verified":
      return BadgeCheck;
    case "lock":
      return Lock;
    case "shield":
      return Shield;
    case "policy":
      return FileCheck;
    default:
      return ShieldCheck;
  }
}

function securityFeatureIcon(index: number) {
  if (index === 0) {
    return ShieldCheck;
  }
  if (index === 1) {
    return Shield;
  }
  return Key;
}

export function LandingPageView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [gateBanner, setGateBanner] = useState<
    | null
    | { tone: "error" | "warning" | "success"; message: string; mode?: "shake" | "locked" }
  >(null);
  const [lockedUrl, setLockedUrl] = useState<string | null>(null);
  const [primaryLabel, setPrimaryLabel] = useState("Analyze My Brand");
  const [primaryDisabled, setPrimaryDisabled] = useState(false);
  const [emailCapture, setEmailCapture] = useState<
    | null
    | {
        kind: "waitlist" | "org_claimed";
        body: string;
        domain: string;
        industry?: IndustryVertical;
        reason?: WaitlistReasonCode;
        leadId?: string;
        marketIntelligenceLogId?: string;
        sourceUrl?: string;
      }
  >(null);
  const [capturedEmail, setCapturedEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailCapturedSuccess, setEmailCapturedSuccess] = useState<string | null>(
    null,
  );
  const [modalStep, setModalStep] = useState<"none" | "preview" | "setup">("none");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [brandProfileId, setBrandProfileId] = useState<string | null>(null);
  const [scannedUrl, setScannedUrl] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [stickyCtaVisible, setStickyCtaVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setStickyCtaVisible(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const state = location.state as LandingGateRedirectState | null;
    const gate = state?.gate;
    if (!gate) {
      return;
    }
    applyLandingGateRedirect(gate, {
      setBrandProfileId,
      setLeadId,
      setScannedUrl,
    });
    if (gate.kind === "infrastructure_error") {
      // Landing Page State F: input keeps the failing domain, marked with the
      // status-error token, and the CTA becomes "Retry Connection Check".
      setGateBanner({ tone: "error", message: gate.message });
      setLockedUrl(gate.url ?? scannedUrl ?? "");
      setPrimaryLabel("Retry Connection Check");
    }
    if (gate.kind === "rate_limit") {
      setGateBanner({
        tone: "warning",
        message: gate.message?.trim() || "Too many requests. Please try again shortly.",
      });
      setLockedUrl(scannedUrl || "");
      setPrimaryLabel("Retry Connection Check");
    }
    if (gate.kind === "org_claimed") {
      setGateBanner({ tone: "warning", message: gate.payload.message, mode: "locked" });
      setLockedUrl(gate.payload.domain);
      setPrimaryLabel("Domain Claimed");
      setPrimaryDisabled(true);
      setEmailCapture({
        kind: "org_claimed",
        body: "Enter your professional email address to request a team invite.",
        domain: gate.payload.domain,
      });
    }
    if (gate.kind === "brand_active") {
      setGateBanner({ tone: "warning", message: gate.payload.message, mode: "locked" });
      setLockedUrl(gate.payload.domain);
      setPrimaryLabel("Sign in");
      setPrimaryDisabled(false);
    }
    if (gate.kind === "verification_required") {
      setGateBanner({ tone: "warning", message: gate.payload.message, mode: "locked" });
      setPrimaryLabel("Verify Domain Ownership");
    }
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate, scannedUrl]);

  const ensureLeadForUrl = async (url: string): Promise<string | null> => {
    const validated = await postDiscoveryValidate({ url });
    if (validated.outcome === "success") {
      return validated.leadId;
    }
    return null;
  };

  const handleResumeScan = () => {
    const session = loadBrandOnboardingSession();
    const nextBrandProfileId = brandProfileId ?? session?.brandProfileId ?? "";
    const nextLeadId = leadId ?? session?.leadId ?? "";
    const nextUrl = scannedUrl || session?.normalizedUrl || "";
    if (!nextBrandProfileId) {
      setApiError("Could not resume this scan. Submit the brand URL again to continue.");
      return;
    }
    navigate(ONBOARDING_ROUTES.dna, {
      state: {
        url: nextUrl,
        leadId: nextLeadId,
        brandProfileId: nextBrandProfileId,
        scanMode: "cached" as const,
      },
    });
  };

  const handleSubmitUrl = async (nextUrl: string) => {
    setGateBanner(null);
    setLockedUrl(null);
    setPrimaryLabel("Analyze My Brand");
    setPrimaryDisabled(false);
    setEmailCapture(null);
    setCapturedEmail("");
    setEmailError(null);
    setEmailCapturedSuccess(null);
    setApiError(null);
    setLeadId(null);
    setBrandProfileId(null);
    setIsVerifying(true);
    try {
      const resolved = await postDiscoveryResolve({ url: nextUrl });
      if (resolved.outcome === "blocked") {
        setGateBanner({ tone: "error", message: resolved.message, mode: "locked" });
        setLockedUrl(nextUrl);
        setPrimaryLabel("Scan Restricted");
        setPrimaryDisabled(true);
        return;
      }
      if (resolved.outcome === "org_claimed") {
        setGateBanner({ tone: "warning", message: resolved.message, mode: "locked" });
        setLockedUrl(nextUrl);
        setPrimaryLabel("Domain Claimed");
        setPrimaryDisabled(true);
        setEmailCapture({
          kind: "org_claimed",
          body: "Enter your professional email address to request a team invite.",
          domain: resolved.domain,
        });
        return;
      }
      if (resolved.outcome === "brand_active") {
        setGateBanner({ tone: "warning", message: resolved.message, mode: "locked" });
        setLockedUrl(nextUrl);
        setPrimaryLabel("Sign in");
        setPrimaryDisabled(false);
        return;
      }
      if (resolved.outcome === "verification_required") {
        setBrandProfileId(resolved.brandProfileId);
        const validated = await postDiscoveryValidate({ url: nextUrl });
        if (validated.outcome === "success") {
          setScannedUrl(validated.normalizedUrl);
          setLeadId(validated.leadId);
        } else {
          setScannedUrl(nextUrl);
        }
        setGateBanner({ tone: "warning", message: resolved.message, mode: "locked" });
        setLockedUrl(nextUrl);
        setPrimaryLabel("Verify Domain Ownership");
        return;
      }
      if (resolved.outcome === "resume") {
        setScannedUrl(resolved.normalizedUrl);
        setLeadId(resolved.leadId);
        setBrandProfileId(resolved.brandProfileId);
        saveBrandOnboardingSession({
          leadId: resolved.leadId,
          brandProfileId: resolved.brandProfileId,
          normalizedUrl: resolved.normalizedUrl,
        });
        setGateBanner({
          tone: "success",
          message: `We located a recent scan within the last 7 days. Reloading existing data for ${resolved.domain}.`,
          mode: "locked",
        });
        setLockedUrl(resolved.normalizedUrl);
        setPrimaryLabel("Resume Previous Scan Results");
        return;
      }

      const validated = await postDiscoveryValidate({ url: nextUrl });
      if (validated.outcome === "blocked") {
        setGateBanner({ tone: "error", message: validated.message, mode: "locked" });
        setLockedUrl(nextUrl);
        setPrimaryLabel("Scan Restricted");
        setPrimaryDisabled(true);
        return;
      }
      if (validated.outcome === "org_claimed") {
        setGateBanner({ tone: "warning", message: validated.message, mode: "locked" });
        setLockedUrl(nextUrl);
        setPrimaryLabel("Domain Claimed");
        setPrimaryDisabled(true);
        setEmailCapture({
          kind: "org_claimed",
          body: "Enter your professional email address to request a team invite.",
          domain: validated.domain,
        });
        return;
      }
      if (validated.outcome === "brand_active") {
        setGateBanner({ tone: "warning", message: validated.message, mode: "locked" });
        setLockedUrl(nextUrl);
        setPrimaryLabel("Sign in");
        return;
      }
      if (validated.outcome === "verification_required") {
        setBrandProfileId(validated.brandProfileId);
        setGateBanner({ tone: "warning", message: validated.message, mode: "locked" });
        setLockedUrl(nextUrl);
        setPrimaryLabel("Verify Domain Ownership");
        const lead = await ensureLeadForUrl(nextUrl);
        if (lead) {
          setLeadId(lead);
        }
        setScannedUrl(nextUrl);
        return;
      }
      if (validated.outcome === "infrastructure_error") {
        setGateBanner({ tone: "error", message: validated.message });
        setLockedUrl(validated.normalizedUrl);
        setPrimaryLabel("Retry Connection Check");
        setPrimaryDisabled(false);
        setEmailCapture(null);
        return;
      }
      if (validated.outcome === "waitlist") {
        const industryLabel = formatIndustry(validated.industry);
        setGateBanner({
          tone: "warning",
          message:
            validated.message ??
            waitlistReasonMessage(
              validated.reason,
              industryLabel,
              validated.domain,
            ),
        });
        setLockedUrl(validated.normalizedUrl);
        setPrimaryLabel(
          validated.reason === "FOREIGN_LANGUAGE"
            ? "Notify me for localization"
            : validated.reason === "PARKED_DOMAIN" ||
                validated.reason === "CONTENT_UNREADABLE"
              ? "Notify me when scanning improves"
              : waitlistCtaLabel(validated.industry),
        );
        setPrimaryDisabled(true);
        setEmailCapture({
          kind: "waitlist",
          body:
            validated.reason === "FOREIGN_LANGUAGE"
              ? "Leave your email for early-bird access when we support your language."
              : validated.reason === "PARKED_DOMAIN" ||
                  validated.reason === "CONTENT_UNREADABLE"
                ? "Leave your email and we'll follow up when we can evaluate this storefront."
                : "We're training our AI on your niche. Leave your email for early-bird access.",
          domain: validated.domain,
          industry: validated.industry,
          reason: validated.reason ?? "UNSUPPORTED_INDUSTRY",
          leadId: validated.leadId,
          marketIntelligenceLogId: validated.logId,
          sourceUrl: validated.normalizedUrl,
        });
        return;
      }
      setScannedUrl(validated.normalizedUrl);
      setLeadId(validated.leadId);
      setModalStep("preview");
    } catch (err) {
      if (isHttpApiError(err) && err.isRateLimited) {
        setGateBanner({ tone: "warning", message: err.message });
        setLockedUrl(nextUrl);
        setPrimaryLabel("Retry Connection Check");
        return;
      }
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setGateBanner({ tone: "warning", message });
      setLockedUrl(nextUrl);
      setPrimaryLabel("Retry Connection Check");
    } finally {
      setIsVerifying(false);
    }
  };

  const captureMode = useMemo((): LandingUrlCaptureMode => {
    if (emailCapture?.kind === "waitlist") {
      return "waitlist";
    }
    if (emailCapture?.kind === "org_claimed" || primaryLabel === "Domain Claimed") {
      return "org_claimed";
    }
    if (primaryLabel === "Sign in") {
      return "brand_active";
    }
    if (primaryLabel === "Verify Domain Ownership") {
      return "verification_required";
    }
    if (primaryLabel === "Resume Previous Scan Results") {
      return "resume";
    }
    if (primaryLabel === "Scan Restricted") {
      return "blocked_locked";
    }
    if (primaryLabel === "Retry Connection Check") {
      return "infra_retry";
    }
    if (gateBanner?.mode === "shake") {
      return "syntax_error";
    }
    return "default";
  }, [emailCapture, gateBanner?.mode, primaryLabel]);

  const bannerForCapture = useMemo(() => {
    if (!gateBanner) {
      return null;
    }
    if (emailCapture?.kind === "waitlist") {
      return null;
    }
    if (primaryLabel === "Resume Previous Scan Results") {
      return null;
    }
    if (gateBanner.tone === "error") {
      return { tone: "error" as const, message: gateBanner.message };
    }
    if (gateBanner.tone === "success") {
      return { tone: "success" as const, message: gateBanner.message };
    }
    return { tone: "warning" as const, message: gateBanner.message };
  }, [emailCapture?.kind, gateBanner, primaryLabel]);

  const captureHelperText = useMemo(() => {
    if (primaryLabel === "Resume Previous Scan Results" && gateBanner?.tone === "success") {
      return gateBanner.message;
    }
    return null;
  }, [gateBanner, primaryLabel]);

  const submitEmailCapture = async () => {
    const trimmed = capturedEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a valid work email address.");
      return;
    }
    if (emailCapture?.kind === "waitlist") {
      if (!emailCapture.industry) {
        setEmailError("Missing industry context. Submit the URL again.");
        return;
      }
      setIsSubmittingEmail(true);
      setEmailError(null);
      try {
        await postDiscoveryWaitlist({
          email: trimmed,
          industry: emailCapture.industry,
          reason: emailCapture.reason,
          domain: emailCapture.domain,
          discoveryLeadId: emailCapture.leadId,
          marketIntelligenceLogId: emailCapture.marketIntelligenceLogId,
          sourceUrl: emailCapture.sourceUrl ?? lockedUrl ?? undefined,
        });
        setEmailCapturedSuccess("Thanks — you're on the waitlist.");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not join the waitlist. Please try again.";
        setEmailError(message);
        setEmailCapturedSuccess(null);
      } finally {
        setIsSubmittingEmail(false);
      }
      return;
    }
    setEmailError(null);
    setEmailCapturedSuccess("Thanks — we've captured your email.");
    console.log("landing_email_capture", {
      context: emailCapture?.kind,
      email: trimmed,
      domain: emailCapture?.domain,
      industry: emailCapture?.industry,
      lockedUrl,
    });
  };

  const scrollToHero = () => {
    document.getElementById("landing-hero")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={`bob-landing${
        stickyCtaVisible ? " bob-landing--sticky-visible" : ""
      }`}
    >
      <section className="bob-hero bob-container" id="landing-hero">
        <h1>Meet the Creators Who&apos;ll Love Your Brand as Much as You Do</h1>
        <p className="bob-hero__sub">
          Finally, creators who share your vision. We don&apos;t just find
          &quot;influencers.&quot; We deeply analyze your brand&apos;s heartbeat to
          introduce you to champion partners.
        </p>
        <div className="bob-hero__module">
          <LandingUrlCapture
            isBusy={isVerifying}
            mode={captureMode}
            lockedUrl={lockedUrl ?? undefined}
            primaryLabel={primaryLabel}
            primaryDisabled={primaryDisabled}
            feedback={bannerForCapture}
            helperText={captureHelperText}
            onPrimaryAction={async (url) => {
              if (primaryLabel === "Sign in") {
                navigate("/login");
                return;
              }
              if (primaryLabel === "Verify Domain Ownership") {
                navigate(ONBOARDING_ROUTES.verification);
                return;
              }
              if (primaryLabel === "Resume Previous Scan Results") {
                handleResumeScan();
                return;
              }
              await handleSubmitUrl(url);
            }}
          />
          {emailCapture ? (
            <div
              className={`bob-email-capture${
                emailCapture.kind === "waitlist"
                  ? " bob-email-capture--waitlist"
                  : " bob-email-capture--org-claimed"
              }`}
            >
              {emailCapture.kind === "waitlist" && emailCapture.industry ? (
                <div className="bob-email-capture__alert">
                  <Info size={18} aria-hidden />
                  <p>
                    We&apos;ve identified <strong>{emailCapture.domain}</strong> as{" "}
                    {formatIndustry(emailCapture.industry)}. Creator&apos;s Shop is
                    currently optimized for D2C, SaaS, Healthcare, and Offline
                    Services.
                  </p>
                </div>
              ) : null}
              <div
                className={`bob-email-capture__panel${
                  emailCapture.kind === "org_claimed"
                    ? " bob-email-capture__panel--claimed"
                    : ""
                }`}
              >
                <p>{emailCapture.body}</p>
                <div className="bob-email-capture__row">
                  <input
                    className="bob-email-capture__input"
                    type="email"
                    autoComplete="email"
                    placeholder={
                      emailCapture.kind === "org_claimed"
                        ? "email@yourdomain.com"
                        : "email@address.com"
                    }
                    value={capturedEmail}
                    onChange={(event) => {
                      setCapturedEmail(event.target.value);
                      setEmailError(null);
                      setEmailCapturedSuccess(null);
                    }}
                    aria-invalid={emailError ? true : undefined}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    disabled={isSubmittingEmail}
                    onClick={() => void submitEmailCapture()}
                  >
                    {emailCapture.kind === "org_claimed"
                      ? "Request Access"
                      : "Join Waitlist"}
                  </Button>
                </div>
                {emailError ? (
                  <p className="bob-email-capture__error" role="alert">
                    {emailError}
                  </p>
                ) : null}
                {emailCapturedSuccess ? (
                  <p className="bob-email-capture__success">{emailCapturedSuccess}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <p className="bob-hero__disclaimer">
          No credit card. No commitment. Just insights to help you grow.
        </p>
      </section>

      <section className="bob-trust-bar" aria-label="Trust and compliance">
        <div className="bob-container bob-trust-bar__inner">
          {LANDING_TRUST_ITEMS.map((item) => {
            const Icon = trustIcon(item.icon);
            return (
              <span className="bob-trust-bar__item" key={item.label}>
                <Icon size={18} color="var(--bob-primary)" aria-hidden />
                {item.label}
              </span>
            );
          })}
        </div>
      </section>

      <section className="bob-section bob-section--trinity bob-container" id="how-it-works">
        <h2 className="bob-section-title">The Trinity of Partnership</h2>
        <p className="bob-section-sub">
          A supportive, human-centric approach that turns cold outreach into lasting
          connections.
        </p>
        <div className="bob-grid-3">
          {LANDING_TRINITY_PILLARS.map((pillar) => (
            <article key={pillar.title} className="bob-pillar">
              <div className={`bob-pillar__icon bob-pillar__icon--${pillar.tone}`}>
                <pillar.Icon size={28} aria-hidden />
              </div>
              <h2>{pillar.title}</h2>
              <p>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bob-section bob-section--capabilities" id="features">
        <div className="bob-container">
          <div className="bob-capabilities-header">
            <div>
              <h2 className="bob-section-title">Comprehensive Capabilities</h2>
              <p className="bob-section-sub">
                A toolkit designed to make your creative life easier, from initial scan
                to protected escrow.
              </p>
            </div>
            <div className="bob-capabilities-avatars" aria-hidden>
              {CAPABILITY_AVATARS.map((src) => (
                <img key={src} src={src} alt="" loading="lazy" />
              ))}
            </div>
          </div>
          <div className="bob-grid-cap">
            {LANDING_CAPABILITIES.map((item) => (
              <article key={item.title} className="bob-cap-card">
                <item.Icon size={24} color="var(--bob-primary)" aria-hidden />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bob-security">
        <div className="bob-container bob-security__inner">
          <div>
            <div className="bob-security-badge">Bank-level security</div>
            <h2>Your brand&apos;s safety is our highest priority.</h2>
            <p>
              We don&apos;t take your trust lightly. Our systems are built on the
              foundation of compassionate protection, ensuring your accounts and data
              remain entirely yours.
            </p>
            <div className="bob-stack">
              {LANDING_SECURITY_FEATURES.map((item, index) => {
                const Icon = securityFeatureIcon(index);
                return (
                  <div className="bob-security-item" key={item.title}>
                    <span>
                      <Icon size={20} aria-hidden />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bob-terminal-wrap">
            <div className="bob-terminal" aria-label="Security manifest">
              <div className="bob-terminal__chrome">
                <div className="bob-terminal__dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="bob-terminal__label">SECURITY_MANIFEST.LOG</span>
              </div>
              <div className="bob-terminal__lines">
                {LANDING_SECURITY_MANIFEST.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <img
                className="bob-terminal__image"
                src={SECURITY_TERMINAL_IMAGE}
                alt="High-tech secure server infrastructure"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bob-cta">
        <div className="bob-cta__inner">
          <h2>Ready to Meet Your Perfect Creators?</h2>
          <p className="bob-section-sub">
            Join thousands of brands who have replaced cold pitching with meaningful
            partnerships.
          </p>
          <div className="bob-cta-actions">
            <Button type="button" variant="primary" onClick={scrollToHero}>
              Start Your Free Trial
            </Button>
            <Button type="button" variant="secondary">
              Talk to an Expert
            </Button>
          </div>
          <p className="bob-cta-footnote">
            No credit card required. Certified Meta Partner.
          </p>
        </div>
      </section>

      <footer className="bob-footer">
        <div className="bob-container bob-footer-grid">
          <div className="bob-footer-brand">
            <h3>The Creator Shop</h3>
            <p>
              From Brand DNA to Meaningful Connections. The world&apos;s first
              partner-focused influencer engine. Crafted with care for high-growth
              teams.
            </p>
            <div className="bob-footer-social">
              <a href="https://thecreatorshop.com" aria-label="Website">
                <Globe size={20} aria-hidden />
              </a>
              <a href="mailto:hello@thecreatorshop.com" aria-label="Email us">
                <Mail size={20} aria-hidden />
              </a>
            </div>
          </div>
          <div>
            <h5>Platform</h5>
            <ul className="bob-footer-list">
              <li><a href="#features">Brand DNA Scanner</a></li>
              <li><a href="#features">Competitor Audit</a></li>
              <li><a href="#features">Archetype Mapping</a></li>
              <li><a href="#features">Priority Outreach</a></li>
            </ul>
          </div>
          <div>
            <h5>Security</h5>
            <ul className="bob-footer-list">
              <li><a href="#features">GDPR Compliant</a></li>
              <li><a href="#features">CCPA Compliant</a></li>
              <li><a href="#features">SOC2 Type II</a></li>
              <li><a href="#features">Meta API Integrated</a></li>
            </ul>
          </div>
          <div>
            <h5>Company</h5>
            <ul className="bob-footer-list">
              <li><a href="#landing-hero">About Us</a></li>
              <li><a href="#landing-hero">Privacy Policy</a></li>
              <li><a href="#landing-hero">Terms of Service</a></li>
              <li><a href="#landing-hero">Support</a></li>
            </ul>
          </div>
        </div>
        <div className="bob-footer-bottom-wrap">
          <div className="bob-container bob-footer-bottom">
            <small>© 2026 The Creator Shop. All rights reserved. GDPR &amp; SOC2 Compliant.</small>
            <small>Crafted with care for high-growth teams in San Francisco &amp; London</small>
          </div>
        </div>
      </footer>

      <div
        className={`bob-sticky-cta${stickyCtaVisible ? " bob-sticky-cta--visible" : ""}`}
      >
        <p>Ready to Meet Your Perfect Creators?</p>
        <Button type="button" variant="primary" onClick={scrollToHero}>
          Start Free →
        </Button>
      </div>

      {apiError ? (
        <p className="bob-api-error" role="alert">
          {apiError}
        </p>
      ) : null}

      <ProcessPreviewModal
        open={modalStep === "preview"}
        onClose={() => setModalStep("none")}
        onContinue={() => setModalStep("setup")}
      />
      <SetupVerificationModal
        open={modalStep === "setup"}
        onClose={() => setModalStep("none")}
        onBack={() => setModalStep("preview")}
        onConfirm={async () => {
          setModalStep("none");
          setIsVerifying(true);
          setApiError(null);
          try {
            let nextLeadId = leadId;
            if (!nextLeadId) {
              const validated = await postDiscoveryValidate({ url: scannedUrl });
              if (validated.outcome === "blocked") {
                setGateBanner({ tone: "error", message: validated.message, mode: "locked" });
                setLockedUrl(scannedUrl);
                setPrimaryLabel("Scan Restricted");
                setPrimaryDisabled(true);
                return;
              }
              if (validated.outcome === "org_claimed") {
                setGateBanner({ tone: "warning", message: validated.message, mode: "locked" });
                setLockedUrl(scannedUrl);
                setPrimaryLabel("Domain Claimed");
                setPrimaryDisabled(true);
                setEmailCapture({
                  kind: "org_claimed",
                  body: "Enter your professional email address to request a team invite.",
                  domain: validated.domain,
                });
                return;
              }
              if (validated.outcome === "brand_active") {
                setGateBanner({ tone: "warning", message: validated.message, mode: "locked" });
                setLockedUrl(scannedUrl);
                setPrimaryLabel("Sign in");
                setPrimaryDisabled(false);
                return;
              }
              if (validated.outcome === "verification_required") {
                setGateBanner({ tone: "warning", message: validated.message, mode: "locked" });
                setLockedUrl(scannedUrl);
                setPrimaryLabel("Verify Domain Ownership");
                setBrandProfileId(validated.brandProfileId);
                return;
              }
              if (validated.outcome === "infrastructure_error") {
                setGateBanner({ tone: "error", message: validated.message });
                setLockedUrl(validated.normalizedUrl);
                setPrimaryLabel("Retry Connection Check");
                setPrimaryDisabled(false);
                setEmailCapture(null);
                setModalStep("none");
                return;
              }
              if (validated.outcome === "waitlist") {
                const industryLabel = formatIndustry(validated.industry);
                setGateBanner({
                  tone: "warning",
                  message:
                    validated.message ??
                    waitlistReasonMessage(
                      validated.reason,
                      industryLabel,
                      validated.domain,
                    ),
                });
                setLockedUrl(validated.normalizedUrl);
                setPrimaryLabel(
                  validated.reason === "FOREIGN_LANGUAGE"
                    ? "Notify me for localization"
                    : validated.reason === "PARKED_DOMAIN" ||
                        validated.reason === "CONTENT_UNREADABLE"
                      ? "Notify me when scanning improves"
                      : waitlistCtaLabel(validated.industry),
                );
                setPrimaryDisabled(true);
                setEmailCapture({
                  kind: "waitlist",
                  body:
                    validated.reason === "FOREIGN_LANGUAGE"
                      ? "Leave your email for early-bird access when we support your language."
                      : validated.reason === "PARKED_DOMAIN" ||
                          validated.reason === "CONTENT_UNREADABLE"
                        ? "Leave your email and we'll follow up when we can evaluate this storefront."
                        : "We're training our AI on your niche. Leave your email for early-bird access.",
                  domain: validated.domain,
                  industry: validated.industry,
                  reason: validated.reason ?? "UNSUPPORTED_INDUSTRY",
                  leadId: validated.leadId,
                  marketIntelligenceLogId: validated.logId,
                  sourceUrl: validated.normalizedUrl,
                });
                setModalStep("none");
                return;
              }
              if (validated.outcome === "success") {
                nextLeadId = validated.leadId;
                setLeadId(validated.leadId);
              }
            }
            if (!nextLeadId) {
              setApiError("Could not start a scan session. Please try your URL again.");
              return;
            }
            navigate(ONBOARDING_ROUTES.scan, {
              state: { url: scannedUrl, leadId: nextLeadId },
            });
          } catch (err) {
            if (isHttpApiError(err) && err.isRateLimited) {
              setGateBanner({ tone: "warning", message: err.message });
              setLockedUrl(scannedUrl);
              setPrimaryLabel("Retry Connection Check");
              return;
            }
            if (err instanceof Error && err.message.includes("ThrottlerException")) {
              setGateBanner({
                tone: "warning",
                message: "Too many requests. Please try again shortly.",
              });
              setLockedUrl(scannedUrl);
              setPrimaryLabel("Retry Connection Check");
              return;
            }
            const message =
              err instanceof Error
                ? err.message
                : "Something went wrong. Please try again.";
            setApiError(message);
          } finally {
            setIsVerifying(false);
          }
        }}
      />
    </div>
  );
}
