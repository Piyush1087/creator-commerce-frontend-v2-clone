import { useLayoutEffect, useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { completeBrandRegistration } from "../../auth/api/auth-client";
import { ONBOARDING_ROUTES } from "../constants";
import { loadBrandOnboardingSession } from "../session/onboarding-session";

export function PricingView() {
  const navigate = useNavigate();
  const session = loadBrandOnboardingSession();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleStartTrial = async () => {
    setError(null);
    if (!session?.brandProfileId) {
      setError("Onboarding session expired. Start again from the homepage.");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeBrandRegistration({
        brandProfileId: session.brandProfileId,
      });
      navigate(ONBOARDING_ROUTES.socialSync);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bob-landing">
      <main className="bob-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "128px" }}>
        
        {/* Hero Card */}
        <div className="bob-pricing-card">
          <div className="bob-pricing-badge">
            <span>🛡️</span>
            <span>FOUNDING MEMBER ACCESS</span>
          </div>
          
          <h1 className="bob-pricing-title">Founder’s Beta</h1>
          
          <div className="bob-pricing-cost">
            <span className="bob-pricing-cost__amount">$0</span>
            <span className="bob-pricing-cost__period">Today</span>
          </div>
          
          <p className="bob-pricing-subcost">$99/mo after 30 days + 7% commission</p>
          
          <p className="bob-pricing-desc">
            Unlock full platform capabilities during our exclusive preview phase. Shape the future of creator operations with direct access to our founding engineering team.
          </p>

          <div className="bob-pricing-features">
            <div className="bob-pricing-feature-group">
              <h3>DEEP INTEL ENGINE</h3>
              <ul>
                <li><CheckCircle2 size={18} /> Real-time Brand DNA Extraction</li>
                <li><CheckCircle2 size={18} /> 3-Competitor Gap Analysis</li>
                <li><CheckCircle2 size={18} /> 1 Full Monthly Refresh</li>
              </ul>
            </div>
            
            <div className="bob-pricing-feature-group">
              <h3>STRATEGIC EXECUTION</h3>
              <ul>
                <li><CheckCircle2 size={18} /> AI-Generated Creative Briefs</li>
                <li><CheckCircle2 size={18} /> 5 Products & 3 Collections</li>
                <li><CheckCircle2 size={18} /> 3 Managed Locations</li>
              </ul>
            </div>
            
            <div className="bob-pricing-feature-group">
              <h3>CREATOR OPERATIONS</h3>
              <ul>
                <li><CheckCircle2 size={18} /> Unlimited Persona Matching</li>
                <li><CheckCircle2 size={18} /> 100 Automated Outreaches</li>
                <li><CheckCircle2 size={18} /> Secure Escrow Protection</li>
              </ul>
            </div>
          </div>

          {error ? (
            <p role="alert" style={{ color: "var(--color-danger)", fontSize: 14, marginBottom: 12, textAlign: "center" }}>
              {error}
            </p>
          ) : null}

          <button
            type="button"
            className="bob-pricing-cta"
            disabled={isSubmitting}
            onClick={() => void handleStartTrial()}
          >
            {isSubmitting ? "Creating account…" : "Start My Free Trial"} <ArrowRight size={20} />
          </button>
          
          <p className="bob-pricing-note">No credit card required. Instant access to Phase 2.</p>
          
          <div className="bob-pricing-links">
            <a href="#">Founder Terms</a>
            <a href="#">Privacy</a>
            <a href="#">AI Disclaimer</a>
          </div>
        </div>

        {/* Vision Tiers */}
        <div className="bob-pricing-tiers">
          <div className="bob-pricing-tier">
            <div className="bob-pricing-tier__badge">Coming Q3</div>
            <h4>Professional</h4>
            <p>Scalable growth for rising creators.</p>
            <div className="bob-pricing-tier__price">$49 / month</div>
          </div>
          
          <div className="bob-pricing-tier">
            <div className="bob-pricing-tier__badge">Coming Q3</div>
            <h4>Enterprise</h4>
            <p>Custom infrastructure for agencies.</p>
            <div className="bob-pricing-tier__price">Custom Pricing</div>
          </div>
        </div>

      </main>
    </div>
  );
}
