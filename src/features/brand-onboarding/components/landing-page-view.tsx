import { useEffect, useState } from "react";
import {
  BadgeCheck,
  FileCheck,
  Globe,
  Key,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
} from "lucide-react";

import { Button } from "../../../design-system/aurora";
import {
  LANDING_CAPABILITIES,
  LANDING_SECURITY_FEATURES,
  LANDING_SECURITY_MANIFEST,
  LANDING_TRINITY_PILLARS,
  LANDING_TRUST_ITEMS,
} from "./landing-page-content";
import { LandingUrlCapture } from "./landing-url-capture";

const CAPABILITY_AVATARS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCKNk1b7arJUls_PN1x6O-Kndrvp2y4zVr2cLuCY1HCUoW57ywuJY0Q1rhPH5PPO9ElN1HhYOnztLb3SR6a8DTl7FAkvfML-UXVBvLUdpSsRmWrHyu2wVELhoCCQ6V7QXBT31H33_ryvlhNjLYfGvEYYYCtmfOJpxOOIr5oKABNwMxU6GryvH4ICw-fyGZmulxSHXgtT5T8mzZa8yx20DqiGE9f-2GYtTPnSYNJgt-mbCi7xrL01zp13PA6w8GW_eZY_lqSt_CIaUBM",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD5Y6lzHE26NykapC3gTniSfhwsJMr5EwNTydSbiCqLCqawDTk_T_2xe88IhIGQlCBKZOfza0PZV_WsnSS-ZyPrI-R1ZwDdPYVkoorEBpa3fnPGCF2j5dQsZEwmNESlWKXaXO03APPKUbG8faI5dBq5NGelpqwkU5Yr6c3iLt1DDuN61hjVd5Qu2vjEMW5-GQzKpErdbCKwv9IBXRhqJsvXA1PF1Rz512qjXdwx9_Zpy1TU0snbPPpqPRzxpdOulTrK4wscpaPabfEN",
] as const;

const SECURITY_TERMINAL_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC4G1pPRoiROyUWaJyQYYiDWWrJDnp5h_x0VIZagmQLo_j2LiYs9oP2BjcBPuz8-qaxkd_cUPvzSvd9oW7pEnd9w6IZzZDSJzEJkvnOAhps4i2Tuk-feC56W-bACztwRegpGR8UaQhk4j1hK2UVAOGeJUodlS_W9G-moOXIJH2_yO9qoJvW3aE4f8psuszSNEMr1nr75kY6wDWEk0WCutBVho37gYor8DYm78sn-UQfWp-_KndX-tWiJmeP5AL2mipMIQ0HhbgSmQTO";

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
  const [stickyCtaVisible, setStickyCtaVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setStickyCtaVisible(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToHero = () => {
    document.getElementById("landing-hero")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={`bob-landing${stickyCtaVisible ? " bob-landing--sticky-visible" : ""}`}
    >
      <section className="bob-hero bob-container" id="landing-hero">
        <h1>Meet the Creators Who&apos;ll Love Your Brand as Much as You Do</h1>
        <p className="bob-hero__sub">
          Finally, creators who share your vision. We don&apos;t just find
          &quot;influencers.&quot; We deeply analyze your brand&apos;s heartbeat to
          introduce you to champion partners.
        </p>
        <div className="bob-hero__module">
          <LandingUrlCapture />
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
    </div>
  );
}
