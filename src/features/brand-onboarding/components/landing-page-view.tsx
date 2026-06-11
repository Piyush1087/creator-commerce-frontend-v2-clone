import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  Lock,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { Button } from "../../../design-system/aurora";

import { postDiscoveryResolve, postDiscoveryValidate } from "../api/discovery-client";
import { isHttpApiError } from "../api/http-api-error";
import type {
  DiscoverValidateBrandActive,
  DiscoverValidateOrgClaimed,
  DiscoverValidateVerificationRequired,
} from "../contracts/discovery.contracts";
import { ONBOARDING_ROUTES } from "../constants";
import type { LandingGateRedirect, LandingGateRedirectState } from "../landing-gate-redirect";
import { saveBrandOnboardingSession } from "../session/onboarding-session";
import { BrandActiveModal } from "./brand-active-modal";
import { RateLimitModal } from "./rate-limit-modal";
import { LandingUrlCapture } from "./landing-url-capture";
import { OrgClaimedModal } from "./org-claimed-modal";
import { ProcessPreviewModal } from "./process-preview-modal";
import { ResumeScanModal } from "./resume-scan-modal";
import { SetupVerificationModal } from "./setup-verification-modal";
import { VerificationRequiredModal } from "./verification-required-modal";

const PROOF_PILLARS = [
  {
    title: "Understand Your Brand",
    body: "Most platforms ask you to fill out 50 fields about your brand. We don't. Just share your website, and our AI learns your personality, your products, and what kind of creative partnership will actually resonate with your audience.",
    Icon: Target,
  },
  {
    title: "Find Your People",
    body: "We don't just throw you a list of everyone with a big follower count. We match you with creators based on what matters: whether their audience overlaps with yours, if their content quality matches your standards, and whether they've delivered for brands like you before.",
    Icon: Users,
  },
  {
    title: "Stay in Sync",
    body: "No more digging through email threads to find that one brief. Everything—contracts, content drafts, feedback, payments—lives in one conversation with each creator. So you can focus on building great campaigns, not managing chaos.",
    Icon: RefreshCw,
  },
] as const;

const CAPABILITIES = [
  {
    title: "Instant Brand Profile",
    body: "We do the heavy lifting by building your profile from your URL.",
    Icon: FileText,
  },
  {
    title: "Campaign Planner",
    body: "Effortlessly map out seasonal stories with AI-guided strategy.",
    Icon: Calendar,
  },
  {
    title: "Creator Deep-Dive",
    body: "Get the full picture of a partner's impact before you reach out.",
    Icon: Eye,
  },
  {
    title: "Growth-Ready Plans",
    body: "Flexible options that grow alongside your brand's success.",
    Icon: TrendingUp,
  },
  {
    title: "Direct Relationships",
    body: "Skip the inbox clutter with a faster, more personal chat UI.",
    Icon: MessageSquare,
  },
  {
    title: "Insightful Intelligence",
    body: "Stay informed on industry trends to keep your strategy fresh.",
    Icon: Zap,
  },
  {
    title: "Performance Reports",
    body: "Clear, actionable data to help you celebrate your ROI.",
    Icon: BarChart3,
  },
  {
    title: "Fair Market Access",
    body: "Save up to 40% by connecting directly with talent who fit your budget.",
    Icon: Zap,
  },
  {
    title: "Secure Escrow",
    body: "Your investment is protected until every deliverable is met.",
    Icon: ShieldCheck,
  },
] as const;

function applyLandingGateRedirect(
  gate: LandingGateRedirect,
  handlers: {
    setRateLimitModal: (value: { message?: string } | null) => void;
    setVerificationRequired: (v: DiscoverValidateVerificationRequired | null) => void;
    setBrandActive: (v: DiscoverValidateBrandActive | null) => void;
    setOrgClaimed: (v: DiscoverValidateOrgClaimed | null) => void;
    setBrandProfileId: (id: string | null) => void;
    setLeadId: (id: string | null) => void;
    setScannedUrl: (url: string) => void;
  },
): void {
  handlers.setRateLimitModal(null);
  handlers.setVerificationRequired(null);
  handlers.setBrandActive(null);
  handlers.setOrgClaimed(null);

  switch (gate.kind) {
    case "rate_limit":
      handlers.setRateLimitModal({ message: gate.message });
      break;
    case "verification_required":
      handlers.setVerificationRequired(gate.payload);
      handlers.setBrandProfileId(gate.payload.brandProfileId);
      if (gate.leadId) {
        handlers.setLeadId(gate.leadId);
      }
      if (gate.normalizedUrl) {
        handlers.setScannedUrl(gate.normalizedUrl);
      }
      break;
    case "brand_active":
      handlers.setBrandActive(gate.payload);
      break;
    case "org_claimed":
      handlers.setOrgClaimed(gate.payload);
      break;
    default:
      break;
  }
}

export function LandingPageView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [modalStep, setModalStep] = useState<"none" | "preview" | "setup">(
    "none",
  );
  const [leadId, setLeadId] = useState<string | null>(null);
  const [brandProfileId, setBrandProfileId] = useState<string | null>(null);
  const [scannedUrl, setScannedUrl] = useState("");
  const [resumeDomain, setResumeDomain] = useState("");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [waitlistNotice, setWaitlistNotice] = useState<string | null>(null);
  const [orgClaimed, setOrgClaimed] = useState<DiscoverValidateOrgClaimed | null>(
    null,
  );
  const [brandActive, setBrandActive] = useState<DiscoverValidateBrandActive | null>(
    null,
  );
  const [verificationRequired, setVerificationRequired] =
    useState<DiscoverValidateVerificationRequired | null>(null);
  const [rateLimitModal, setRateLimitModal] = useState<{ message?: string } | null>(
    null,
  );

  useEffect(() => {
    const state = location.state as LandingGateRedirectState | null;
    const gate = state?.gate;
    if (!gate) {
      return;
    }
    applyLandingGateRedirect(gate, {
      setRateLimitModal,
      setVerificationRequired,
      setBrandActive,
      setOrgClaimed,
      setBrandProfileId,
      setLeadId,
      setScannedUrl,
    });
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const ensureLeadForUrl = async (url: string): Promise<string | null> => {
    const validated = await postDiscoveryValidate({ url });
    if (validated.outcome === "success") {
      return validated.leadId;
    }
    return null;
  };

  const handleSubmitUrl = async (nextUrl: string) => {
    setApiError(null);
    setWaitlistNotice(null);
    setOrgClaimed(null);
    setBrandActive(null);
    setVerificationRequired(null);
    setRateLimitModal(null);
    setShowResumeModal(false);
    setLeadId(null);
    setBrandProfileId(null);
    setIsVerifying(true);
    try {
      const resolved = await postDiscoveryResolve({ url: nextUrl });
      if (resolved.outcome === "blocked") {
        setApiError(resolved.message);
        return;
      }
      if (resolved.outcome === "org_claimed") {
        setOrgClaimed(resolved);
        return;
      }
      if (resolved.outcome === "brand_active") {
        setBrandActive(resolved);
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
        setVerificationRequired(resolved);
        return;
      }
      if (resolved.outcome === "resume") {
        setScannedUrl(resolved.normalizedUrl);
        setLeadId(resolved.leadId);
        setBrandProfileId(resolved.brandProfileId);
        setResumeDomain(resolved.domain);
        saveBrandOnboardingSession({
          leadId: resolved.leadId,
          brandProfileId: resolved.brandProfileId,
          normalizedUrl: resolved.normalizedUrl,
        });
        setShowResumeModal(true);
        return;
      }

      const validated = await postDiscoveryValidate({ url: nextUrl });
      if (validated.outcome === "blocked") {
        setApiError(validated.message);
        return;
      }
      if (validated.outcome === "org_claimed") {
        setOrgClaimed(validated);
        return;
      }
      if (validated.outcome === "brand_active") {
        setBrandActive(validated);
        return;
      }
      if (validated.outcome === "verification_required") {
        setBrandProfileId(validated.brandProfileId);
        setVerificationRequired(validated);
        const lead = await ensureLeadForUrl(nextUrl);
        if (lead) {
          setLeadId(lead);
        }
        setScannedUrl(nextUrl);
        return;
      }
      if (validated.outcome === "waitlist") {
        setWaitlistNotice(
          `Thanks - we have logged interest for ${validated.domain}. We will reach out when this vertical opens up.`,
        );
        return;
      }
      setScannedUrl(validated.normalizedUrl);
      setLeadId(validated.leadId);
      setModalStep("preview");
    } catch (err) {
      if (isHttpApiError(err) && err.isRateLimited) {
        setRateLimitModal({ message: err.message });
        return;
      }
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setApiError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bob-landing">
      <div className="bob-container">
        <section className="bob-hero">
          <h1>Meet the Creators Who&apos;ll Love Your Brand as Much as You Do</h1>
          <p>
            Finally, creators who share your vision. We don&apos;t just find
            influencers. We analyze your brand&apos;s heartbeat to introduce you
            to champion partners.
          </p>
          <LandingUrlCapture
            isBusy={isVerifying}
            remoteError={apiError}
            waitlistNotice={waitlistNotice}
            onSubmitUrl={handleSubmitUrl}
          />
          {isVerifying ? (
            <div className="bob-verifying" aria-live="polite">
              <div className="bob-skeleton bob-skeleton--wide" />
              <div className="bob-skeleton bob-skeleton--narrow" />
              <p>Locating brand servers...</p>
            </div>
          ) : null}
          <p className="bob-muted" style={{ marginTop: 12 }}>
            No credit card. No commitment. Just insights to help you grow.
          </p>
          <div className="bob-trust-row">
            <span>
              <ShieldCheck size={14} color="var(--color-primary)" aria-hidden />
              Meta-verified partnership
            </span>
            <span>
              <Lock size={14} color="var(--color-primary)" aria-hidden />
              256-bit AES Encryption
            </span>
            <span>
              <ShieldCheck size={14} color="var(--color-primary)" aria-hidden />
              SOC2 Type II
            </span>
            <span>
              <CheckCircle2 size={14} color="var(--color-primary)" aria-hidden />
              GDPR &amp; CCPA Compliant
            </span>
          </div>
        </section>

        <section className="bob-section" id="how-it-works">
          <h2 className="bob-section-title">
            Here&apos;s How We Make Influencer Marketing Feel Easy
          </h2>
          <p className="bob-section-sub">
            Three ways we take the guesswork out of creator marketing.
          </p>
          <div className="bob-grid-3">
            {PROOF_PILLARS.map((pillar) => (
              <article key={pillar.title} className="bob-pillar">
                <div className="bob-pillar__icon">
                  <pillar.Icon size={22} color="var(--color-primary)" />
                </div>
                <h2>{pillar.title}</h2>
                <p>{pillar.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bob-section" id="features">
          <h2 className="bob-section-title">Comprehensive Capabilities</h2>
          <p className="bob-section-sub">
            A toolkit designed to make your creative life easier, from initial
            scan to protected escrow.
          </p>
          <div className="bob-grid-cap">
            {CAPABILITIES.map((item) => (
              <article key={item.title} className="bob-cap-card">
                <item.Icon size={20} color="var(--color-primary)" />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="bob-security">
        <div className="bob-container bob-security__inner">
          <div>
            <p
              style={{
                color: "var(--color-primary)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                fontSize: 12,
                marginBottom: 8,
              }}
            >
              Bank-level security
            </p>
            <h2>Your brand&apos;s safety is our highest priority.</h2>
            <p>
              We don&apos;t take your trust lightly. Our systems are built on the
              foundation of compassionate protection, ensuring your accounts and
              data remain entirely yours.
            </p>
            <div className="bob-stack">
              {[
                {
                  title: "Respectful Access",
                  body: "Meta Graph API (v25.0) for secure, read-only/send-only permissions.",
                  Icon: ShieldCheck,
                },
                {
                  title: "Protective Limits",
                  body: "Strict adherence to Meta's safety guidelines to ensure account health.",
                  Icon: Eye,
                },
                {
                  title: "Total Privacy",
                  body: "We never see your passwords. Everything is handled via secure, encrypted handshake.",
                  Icon: Lock,
                },
              ].map((item) => (
                <div className="bob-security-item" key={item.title}>
                  <span>
                    <item.Icon size={20} aria-hidden />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bob-terminal" aria-label="Security overview">
            <div style={{ opacity: 0.85, lineHeight: 1.7 }}>
              <p style={{ margin: 0 }}>
                Production integrations (Meta Graph, escrow, and compliance attestations) are
                wired per environment. This page does not simulate live security handshakes or
                fake audit output.
              </p>
            </div>
            <div className="bob-terminal__lock">
              <Lock size={48} aria-hidden />
            </div>
          </div>
        </div>
      </section>

      <section className="bob-cta bob-container">
        <h2>Ready to meet your perfect creators?</h2>
        <p className="bob-section-sub">
          Join thousands of brands who have replaced cold pitching with
          meaningful partnerships.
        </p>
        <div className="bob-cta-actions">
          <Button type="button" variant="primary">
            Start My Free Brand Scan
          </Button>
          <Button type="button" variant="secondary">
            Talk to an Expert
          </Button>
        </div>
      </section>

      <footer className="bob-footer">
        <div className="bob-container bob-footer-grid">
          <div>
            <h3>The Creator Shop</h3>
            <small>
              From Brand DNA to Meaningful Connections. The world's first
              partner-focused influencer engine. Crafted with care for
              high-growth teams.
            </small>
          </div>
          <div>
            <h3>Platform</h3>
            <ul className="bob-footer-list">
              <li>Brand DNA Scanner</li>
              <li>Competitor Audit</li>
              <li>Archetype Mapping</li>
              <li>Priority Outreach</li>
            </ul>
          </div>
          <div>
            <h3>Security</h3>
            <ul className="bob-footer-list">
              <li>GDPR Compliant</li>
              <li>CCPA Compliant</li>
              <li>SOC2 Type II</li>
              <li>Meta API Integrated</li>
            </ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul className="bob-footer-list">
              <li>About Us</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Support</li>
            </ul>
          </div>
        </div>
        <div className="bob-container bob-footer-bottom">
          <small>© 2026 The Creator Shop. All rights reserved. GDPR &amp; SOC2 Compliant.</small>
          <small>Crafted with care for high-growth teams in San Francisco &amp; London</small>
        </div>
      </footer>

      <RateLimitModal
        open={rateLimitModal !== null}
        message={rateLimitModal?.message}
        onClose={() => setRateLimitModal(null)}
      />
      <OrgClaimedModal
        open={orgClaimed !== null}
        domain={orgClaimed?.domain ?? ""}
        adminEmail={orgClaimed?.adminEmail ?? ""}
        message={orgClaimed?.message ?? ""}
        onClose={() => setOrgClaimed(null)}
      />
      <BrandActiveModal
        open={brandActive !== null}
        domain={brandActive?.domain ?? ""}
        message={brandActive?.message ?? ""}
        onClose={() => setBrandActive(null)}
      />
      <VerificationRequiredModal
        open={verificationRequired !== null}
        domain={verificationRequired?.domain ?? ""}
        reason={verificationRequired?.reason}
        brandProfileId={verificationRequired?.brandProfileId ?? brandProfileId ?? ""}
        leadId={leadId}
        normalizedUrl={scannedUrl}
        onClose={() => setVerificationRequired(null)}
      />
      <ResumeScanModal
        open={showResumeModal}
        domain={resumeDomain}
        onClose={() => setShowResumeModal(false)}
        onContinue={() => {
          setShowResumeModal(false);
          navigate(ONBOARDING_ROUTES.dna);
        }}
      />
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
                setApiError(validated.message);
                return;
              }
              if (validated.outcome === "org_claimed") {
                setOrgClaimed(validated);
                return;
              }
              if (validated.outcome === "brand_active") {
                setBrandActive(validated);
                return;
              }
              if (validated.outcome === "verification_required") {
                setVerificationRequired(validated);
                setBrandProfileId(validated.brandProfileId);
                return;
              }
              if (validated.outcome === "waitlist") {
                setWaitlistNotice(
                  `Thanks - we have logged interest for ${validated.domain}. We will reach out when this vertical opens up.`,
                );
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
              setRateLimitModal({ message: err.message });
              return;
            }
            if (err instanceof Error && err.message.includes("ThrottlerException")) {
              setRateLimitModal({});
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
