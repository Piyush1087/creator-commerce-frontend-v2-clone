import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Edit3,
  Package,
  Share2,
  Shield,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Alert, Badge, Button, Card } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import { OptionalMedia } from "../../creator-campaigns/components/OptionalMedia";
import type { PublicBrandLandingResponse } from "../contracts/public-brand.contracts";
import { brandMarketplacePath, publicBrandPath } from "../utils/brand-page-session";
import { displayValue } from "../utils/display-value";

import "../../creator-campaigns/creator-campaigns.css";
import "../public-brand.css";

const FAQ_ITEMS = [
  {
    question: "How do payments work and how am I protected?",
    answer:
      "Upon contract confirmation, the brand deposits your campaign milestone fee into a secure platform escrow vault. Once your approved deliverables go live, funds release to your creator wallet.",
  },
  {
    question: "Do I get to keep the product samples sent for content production?",
    answer:
      "Yes. Physical SKU items dispatched during onboarding are yours to keep as complimentary product gifting allocations.",
  },
  {
    question: "What are the content usage and licensing distribution parameters?",
    answer:
      "Standard collaborations grant the brand organic digital usage for 60 days following publication. Extended licensing requires separate negotiation.",
  },
] as const;

const JOURNEY_STEPS = [
  {
    step: "01",
    title: "Instant Authentication Handshake",
    body: "Sign in to access this brand's open campaign directory.",
  },
  {
    step: "02",
    title: "Match Matrix Profile Alignment",
    body: "Connect your social channels to evaluate real-time match affinity and browse active briefs.",
  },
  {
    step: "03",
    title: "Lock Escrow Protection & Deploy",
    body: "Confirm campaign configurations, secure milestone funding in escrow, and begin production.",
  },
] as const;

type PublicBrandLandingWorkspaceProps = {
  landing: PublicBrandLandingResponse | null;
  loading?: boolean;
  error?: string | null;
  layout?: "guest" | "creator" | "brand-preview";
};

export function PublicBrandLandingWorkspace({
  landing,
  loading = false,
  error = null,
  layout = "guest",
}: PublicBrandLandingWorkspaceProps) {
  const navigate = useNavigate();
  const gatewayRef = useRef<HTMLDivElement>(null);
  const isCreator = layout === "creator";
  const isBrandPreview = layout === "brand-preview";
  const isGuest = layout === "guest";
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const primary = landing?.theme.primary_color ?? undefined;
  const companyName = displayValue(landing?.company_name);
  const usp1 = landing?.usps[0] ?? "transparent ingredients";
  const usp2 = landing?.usps[1] ?? "sustainable excellence";
  const usp3 = landing?.usps[2] ?? "authentic storytelling";

  const brandSlug = landing?.slug ?? "";
  const brandPagePath = brandSlug ? publicBrandPath(brandSlug) : "/";
  const loginRedirectState = { from: brandPagePath };
  const campaignsHref = brandSlug
    ? brandMarketplacePath(brandSlug, true)
    : AUTH_ROUTES.creatorCampaigns;

  useEffect(() => {
    if (!primary) return;
    document.documentElement.style.setProperty("--pb-theme-accent", primary);
    return () => {
      document.documentElement.style.removeProperty("--pb-theme-accent");
    };
  }, [primary]);

  const handleViewCampaigns = () => {
    if (isCreator) {
      navigate(campaignsHref);
      return;
    }
    navigate(AUTH_ROUTES.login, { state: loginRedirectState });
  };

  const handleCopyBrandPage = async () => {
    if (!landing) return;
    const url = `${window.location.origin}${brandPagePath}`;
    await navigator.clipboard.writeText(url);
    setShareMessage("Brand page link copied — share this with creators.");
  };

  const shellClass =
    isBrandPreview || isCreator
      ? "cc-workspace pb-brand pb-brand--shell"
      : "cc-guest-brand-wrap pb-brand";

  if (loading || !landing) {
    return (
      <div className={isGuest ? "cc-guest-brand-wrap" : "cc-workspace"}>
        <p className="cc-muted">{loading ? "Loading brand page…" : "Loading…"}</p>
      </div>
    );
  }

  const guestAuthButtons = (
    <>
      <Link to={AUTH_ROUTES.login} state={loginRedirectState}>
        <Button variant="outline" size="sm">
          Sign in
        </Button>
      </Link>
      <Link to={AUTH_ROUTES.login} state={loginRedirectState}>
        <Button variant="primary" size="sm">
          Log in
        </Button>
      </Link>
    </>
  );

  return (
    <div
      className={shellClass}
      style={primary ? ({ ["--pb-theme-accent" as string]: primary } as React.CSSProperties) : undefined}
    >
      {error ? (
        <div className="cc-alert-block">
          <Alert tone="error" title="Could not load brand page">
            {error}
          </Alert>
        </div>
      ) : null}

      {shareMessage ? (
        <p className="pb-brand__toast" role="status">
          {shareMessage}
        </p>
      ) : null}

      {isBrandPreview ? (
        <Card className="pb-brand__preview-banner" title="Preview & share" eyebrow="For your team">
          <p className="cc-muted" style={{ marginTop: 0 }}>
            This is the public page creators see when you share your brand page link. Creators browse
            your open campaigns only after they sign in.
          </p>
          <div className="pb-brand__hero-cta">
            <Button variant="primary" size="sm" onClick={() => void handleCopyBrandPage()}>
              <Share2 size={16} style={{ marginRight: 6 }} aria-hidden />
              Copy brand page link
            </Button>
          </div>
        </Card>
      ) : null}

      <header className="pb-brand__intro">
        <div className="pb-brand__intro-main">
          <OptionalMedia
            src={landing.logo_url}
            className="pb-brand__intro-logo"
            placeholderClassName="cc-media-placeholder pb-brand__intro-logo"
          />
          <div>
            <p className="cc-muted" style={{ margin: 0, fontSize: 12 }}>
              Brand collaboration
            </p>
            <h1 className="cc-page-title" style={{ margin: "4px 0 0" }}>
              {companyName}
            </h1>
            <p className="cc-muted" style={{ margin: "8px 0 0" }}>
              {displayValue(landing.tagline)}
            </p>
          </div>
        </div>
        <div className="pb-brand__intro-actions">
          {isGuest ? (
            guestAuthButtons
          ) : isBrandPreview ? null : (
            <Link to={campaignsHref}>
              <Button variant="primary" size="sm">
                View open campaigns
              </Button>
            </Link>
          )}
        </div>
      </header>

      <Card className="pb-brand__hero-card">
        <div className="pb-brand__hero-grid">
          <div>
            <Badge tone="selected">Partnership hub</Badge>
            <h2 className="pb-brand__hero-title">
              {displayValue(landing.tagline) !== "-"
                ? landing.tagline
                : `Collaborate with ${companyName}`}
            </h2>
            <p className="cc-muted">
              {displayValue(landing.brief_description) !== "-"
                ? landing.brief_description
                : `Join ${companyName}'s creator network to sample products, secure escrow-backed payouts, and bring authentic campaigns to your audience.`}
            </p>
            <div className="pb-brand__hero-cta">
              {isGuest ? (
                <Button variant="primary" onClick={handleViewCampaigns}>
                  View open campaigns
                  <ArrowRight size={16} style={{ marginLeft: 8 }} aria-hidden />
                </Button>
              ) : isBrandPreview ? null : (
                <Link to={campaignsHref}>
                  <Button variant="primary">
                    View open campaigns
                    <ArrowRight size={16} style={{ marginLeft: 8 }} aria-hidden />
                  </Button>
                </Link>
              )}
              <span className="cc-muted" style={{ fontSize: 13 }}>
                {isGuest
                  ? "Sign in to browse live briefs"
                  : isBrandPreview
                    ? "Creators sign in to browse live briefs"
                    : landing.open_campaign_count > 0
                      ? `${landing.open_campaign_count} live brief${landing.open_campaign_count === 1 ? "" : "s"}`
                      : "Check Campaigns for new briefs"}
              </span>
            </div>
          </div>
          <OptionalMedia
            src={landing.hero_image_url}
            className="pb-brand__hero-image"
            placeholderClassName="cc-media-placeholder pb-brand__hero-image"
          />
        </div>
      </Card>

      <div id="pb-ethos">
        <Card title="Our ethos & collective mission" eyebrow="Philosophy">
        <p className="cc-muted pb-brand__ethos-copy">
          At {companyName}, we stand for {usp1}, focusing on excellence through {usp2}. We
          design experiences around {usp3} to empower authentic voices worldwide.
        </p>
        <div className="pb-brand__ethos-grid">
          <article className="pb-brand__ethos-item">
            <Shield size={24} aria-hidden />
            <h3>Escrow secured payouts</h3>
            <p className="cc-muted">Milestone fees are protected in escrow before production begins.</p>
          </article>
          <article className="pb-brand__ethos-item">
            <Package size={24} aria-hidden />
            <h3>Frictionless product provisioning</h3>
            <p className="cc-muted">Select flagship SKUs and receive samples through the portal workflow.</p>
          </article>
          <article className="pb-brand__ethos-item">
            <Edit3 size={24} aria-hidden />
            <h3>Creative sovereignty</h3>
            <p className="cc-muted">Brand guardrails without micro-managing your creative voice.</p>
          </article>
        </div>
      </Card>
      </div>

      <Card title="Flagship content focus items" eyebrow="Catalogue">
        {landing.flagship_products.length === 0 ? (
          <p className="cc-muted">-</p>
        ) : (
          <div className="pb-brand__product-grid">
            {landing.flagship_products.map((product) => (
              <article key={product.offering_id} className="pb-brand__product-card">
                <OptionalMedia
                  src={product.image_url}
                  className="pb-brand__product-image"
                  placeholderClassName="cc-media-placeholder pb-brand__product-image"
                />
                <div>
                  <h3>{displayValue(product.name)}</h3>
                  <p className="cc-muted">{displayValue(product.description)}</p>
                  <a
                    href={product.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pb-brand__link"
                  >
                    View product detail ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      {landing.collections.length > 0 ? (
        <Card title="Active product collections" eyebrow="Collections">
          <div className="pb-brand__product-grid">
            {landing.collections.map((collection) => (
              <article key={collection.offering_id} className="pb-brand__product-card">
                <OptionalMedia
                  src={collection.image_url}
                  className="pb-brand__product-image"
                  placeholderClassName="cc-media-placeholder pb-brand__product-image"
                />
                <div>
                  <h3>{displayValue(collection.name)}</h3>
                  <p className="cc-muted">{displayValue(collection.description)}</p>
                </div>
              </article>
            ))}
          </div>
        </Card>
      ) : null}

      <Card title="How to get started" eyebrow="Journey">
        <div className="pb-brand__journey">
          {JOURNEY_STEPS.map((step) => (
            <article key={step.step} className="pb-brand__journey-step">
              <Badge tone="neutral">{step.step}</Badge>
              <h3>{step.title}</h3>
              <p className="cc-muted">{step.body}</p>
            </article>
          ))}
        </div>
      </Card>

      <Card
        title={
          landing.trust_mode === "testimonials" && landing.testimonials.length > 0
            ? "The creator community perspective"
            : "Collaborate with complete confidence"
        }
        eyebrow="Trust"
      >
        {landing.trust_mode === "testimonials" && landing.testimonials.length > 0 ? (
          <div className="pb-brand__testimonials">
            {landing.testimonials.map((item) => (
              <blockquote key={item.creator_handle}>
                <p>&ldquo;{item.quote}&rdquo;</p>
                <footer className="cc-muted">
                  {item.creator_handle} · {item.tier_label}
                </footer>
              </blockquote>
            ))}
          </div>
        ) : (
          <p className="cc-muted" style={{ margin: 0 }}>
            Every campaign uses automated milestone escrow protection so your creative work is
            funded and verified before you begin production.
          </p>
        )}
      </Card>

      <div id="pb-faq">
        <Card title="Frequently asked collaboration questions" eyebrow="FAQ">
        <div className="pb-brand__faq">
          {FAQ_ITEMS.map((item, index) => {
            const open = openFaq === index;
            return (
              <div key={item.question} className="pb-brand__faq-item">
                <button
                  type="button"
                  className="pb-brand__faq-trigger"
                  onClick={() => setOpenFaq(open ? null : index)}
                  aria-expanded={open}
                >
                  {item.question}
                  {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {open ? <p className="cc-muted pb-brand__faq-body">{item.answer}</p> : null}
              </div>
            );
          })}
        </div>
      </Card>
      </div>

      {!isBrandPreview ? (
        <div ref={gatewayRef} id="pb-gateway">
          <Card
            title={`Join the ${companyName} creator community`}
            eyebrow={isCreator ? "Next step" : "Get started"}
          >
          {isCreator ? (
            <div className="pb-brand__gateway-shell">
              <p className="cc-muted">
                You&apos;re signed in. Continue to your Campaigns workspace.
              </p>
              <div className="pb-brand__hero-cta">
                <Link to={campaignsHref}>
                  <Button variant="primary">Open Campaigns</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="pb-brand__gateway-shell">
              <p className="cc-muted">
                Sign in to view {companyName}&apos;s open campaigns and apply to live briefs.
              </p>
              <div className="pb-brand__hero-cta">{guestAuthButtons}</div>
            </div>
          )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
