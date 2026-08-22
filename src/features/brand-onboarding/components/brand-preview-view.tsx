import {
  BookOpen,
  Compass,
  Globe2,
  MailCheck,
  MessageCircleMore,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Button } from "../../../design-system/aurora";
import type {
  BrandPreviewCompleteness,
  BrandPreviewPayload,
} from "../contracts/brand-preview.contracts";

const INDUSTRY_LABELS = {
  D2C: "D2C",
  SAAS_AI: "AI / SaaS",
  HEALTHCARE: "Healthcare",
  OFFLINE_SERVICES: "Offline Services",
} as const;

const audienceIcons = [Search, Compass, UsersRound] as const;
const opportunityIcons = [Sparkles, BookOpen, MessageCircleMore] as const;
const archetypeIcons = [UserRound, MessageCircleMore, UsersRound, Compass] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

type BrandPreviewViewProps = {
  preview: BrandPreviewPayload;
  completeness: BrandPreviewCompleteness;
  startingVerification: boolean;
  onVerify: () => void;
};

export function BrandPreviewView({
  preview,
  completeness,
  startingVerification,
  onVerify,
}: BrandPreviewViewProps) {
  const { identity } = preview;
  const oneAudience = preview.audiences.length === 1;
  const reducedOpportunities = preview.opportunities.length < 3;

  return (
    <main
      className="bp-preview"
      aria-labelledby="bp-preview-title"
      data-completeness={completeness.toLowerCase()}
    >
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Your Brand Preview is ready.
      </p>
      <header className="bp-preview__header">
        <p className="bp-eyebrow">Your Brand Preview</p>
        <h1 id="bp-preview-title" tabIndex={-1}>Here’s what we see in your brand.</h1>
        <p className="bp-preview__subheadline">
          A first view of who you’re trying to reach, where creators could help, and the creator profiles we’d explore first.
        </p>
      </header>

      <div className="bp-preview__hero-grid">
        <section className="bp-section bp-identity" aria-labelledby="bp-identity-title">
          <h2 id="bp-identity-title">The brand we found</h2>
          <div className="bp-identity__card">
            {identity.brandLogo ? (
              <img
                className="bp-identity__logo"
                src={identity.brandLogo}
                alt={`${identity.brandName} logo`}
              />
            ) : (
              <div
                className="bp-identity__logo bp-identity__logo--fallback"
                role="img"
                aria-label="Brand logo not available"
              >
                {initials(identity.brandName)}
              </div>
            )}
            <div className="bp-identity__content">
              <h3>{identity.brandName}</h3>
              <dl className="bp-identity__metadata">
                <div>
                  <dt>Industry</dt>
                  <dd>{INDUSTRY_LABELS[identity.confirmedIndustry]}</dd>
                </div>
                <div>
                  <dt>Website</dt>
                  <dd>
                    <Globe2 size={14} aria-hidden />
                    {identity.displayDomain}
                  </dd>
                </div>
              </dl>
              {identity.brandDescriptor ? (
                <p className="bp-identity__descriptor">{identity.brandDescriptor}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="bp-section bp-insight" aria-labelledby="bp-insight-title">
          <div className="bp-insight__surface">
            <h2 id="bp-insight-title">How we understand your brand</h2>
            <p className="bp-insight__helper">
              The clearest positioning and customer context we can see from your website.
            </p>
            <p className="bp-insight__narrative">{preview.understanding.narrative}</p>
          </div>
        </section>
      </div>

      <section className="bp-section bp-audiences" aria-labelledby="bp-audiences-title">
        <div className="bp-section__heading">
          <h2 id="bp-audiences-title">Who you need to influence</h2>
          <p>
            The audience groups that appear most relevant to earning attention, trust or action.
          </p>
          {oneAudience ? (
            <p className="bp-section__truth-note">
              We can see one audience clearly enough to start with. We'll deepen this view as we learn more about your brand.
            </p>
          ) : null}
        </div>
        <ul
          className={`bp-audience-list bp-density-${preview.audiences.length}`}
          aria-label="Audience groups"
        >
          {preview.audiences.map((audience, index) => {
            const Icon = audienceIcons[index % audienceIcons.length];
            return (
              <li key={audience.id} className="bp-audience-item">
                <span className="bp-audience-item__icon" aria-hidden>
                  <Icon size={22} />
                </span>
                <div>
                  <h3>{audience.label}</h3>
                  <p>{audience.whyItMatters}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bp-section bp-opportunities" aria-labelledby="bp-opportunities-title">
        <div className="bp-section__heading">
          <h2 id="bp-opportunities-title">Where creators can make the difference</h2>
          <p>The strongest creator-marketing opportunities we can see right now.</p>
          {reducedOpportunities ? (
            <p className="bp-section__truth-note">
              We're showing the opportunities we can support clearly right now rather than filling the list with guesses.
            </p>
          ) : null}
        </div>
        <ul
          className={`bp-opportunity-list bp-density-${preview.opportunities.length}`}
          aria-label="Creator-marketing opportunities"
        >
          {preview.opportunities.map((opportunity, index) => {
            const Icon = opportunityIcons[index % opportunityIcons.length];
            return (
              <li key={`${opportunity.title}-${index}`} className="bp-opportunity-card">
                <div className="bp-opportunity-card__heading">
                  <span aria-hidden><Icon size={21} /></span>
                  <h3>{opportunity.title}</h3>
                </div>
                <p>{opportunity.whyItMatters}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bp-section bp-archetypes" aria-labelledby="bp-archetypes-title">
        <div className="bp-section__heading">
          <h2 id="bp-archetypes-title">Creators we'd start with</h2>
          <p>A few creator profiles that fit the job—not a final Campaign shortlist.</p>
        </div>
        <ul
          className={`bp-archetype-list bp-density-${preview.creatorStartingPoint.archetypes.length}`}
          aria-label="Creator archetypes"
        >
          {preview.creatorStartingPoint.archetypes.map((archetype, index) => {
            const Icon = archetypeIcons[index % archetypeIcons.length];
            return (
              <li key={archetype.archetypeId} className="bp-archetype-card">
                <span className="bp-archetype-card__avatar" aria-hidden>
                  <Icon size={28} />
                </span>
                <h3>{archetype.label}</h3>
                <p>{archetype.rationale}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bp-verification-transition" aria-labelledby="bp-verification-title">
        <span className="bp-verification-transition__icon" aria-hidden>
          <MailCheck size={28} />
        </span>
        <h2 id="bp-verification-title">
          Ready to continue? Verify your work email to confirm you represent this brand and open your Creator Shop workspace.
        </h2>
        <Button
          type="button"
          onClick={onVerify}
          disabled={startingVerification}
          aria-busy={startingVerification}
        >
          Verify & claim this brand
        </Button>
      </section>
    </main>
  );
}
