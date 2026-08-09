import { Link } from "react-router-dom";

import { Button, Card } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import {
  MOCK_BRAND_ACTION_REQUIRED,
  MOCK_BRAND_ACTIVE_CAMPAIGNS,
  MOCK_BRAND_HERO,
  MOCK_BRAND_HOME_SNAPSHOT,
  MOCK_BRAND_PRIORITY_TASKS,
  MOCK_BRAND_PROFILE,
} from "../mock-data/brand-home-mock";

import "../../creator-centre/creator-centre.css";

const SNAPSHOT_HREF: Record<string, string> = {
  spend: AUTH_ROUTES.brandUceCampaigns,
  dna: AUTH_ROUTES.brandCentre,
  escrow: AUTH_ROUTES.brandPayouts,
  creators: AUTH_ROUTES.brandCollaborations,
};

/**
 * Brand Home / Daily Briefing — static left column.
 * Visual parity with Creator Home (AI Assistant Integrated).
 */
export function BrandHomeBriefingWorkspace() {
  const profile = MOCK_BRAND_PROFILE;
  const hero = MOCK_BRAND_HERO;

  return (
    <div className="cctr-workspace cctr-home cctr-canvas">
      <header className="cctr-home__welcome">
        <div className="cctr-home__welcome-row">
          <h1 className="cctr-greeting">
            <span aria-hidden="true">👋 </span>
            Good morning, {profile.firstName}
          </h1>
          <span className="cctr-home__updated">{profile.lastUpdated}</span>
        </div>
        <p className="cctr-home__subtitle">{profile.subtitle}</p>
      </header>

      <div className="cctr-bento cctr-bento--snapshot">
        {MOCK_BRAND_HOME_SNAPSHOT.map((card) => {
          const href = SNAPSHOT_HREF[card.id];
          return (
            <Card key={card.id} className="cctr-snapshot-card">
              <p className="cctr-snapshot-card__title">
                <span aria-hidden="true">{card.emoji}</span> {card.title}
              </p>
              <div className="cctr-snapshot-card__value-row">
                <p className="cctr-kpi__value">{card.value}</p>
                {"badge" in card && card.badge ? (
                  <span className="cctr-snapshot-card__badge">{card.badge}</span>
                ) : null}
              </div>
              {card.detail ? (
                <p className="cctr-snapshot-card__detail">{card.detail}</p>
              ) : (
                <div className="cctr-snapshot-card__spacer" />
              )}
              {card.actionStyle === "button" ? (
                <Link to={href} className="cctr-snapshot-card__outline-btn">
                  {card.action}
                </Link>
              ) : (
                <Link to={href} className="cctr-text-link cctr-snapshot-card__link">
                  {card.action}
                </Link>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="cctr-hero-insight">
        <p className="cctr-hero-insight__eyebrow">
          <span aria-hidden="true">{hero.emoji}</span> {hero.title}
        </p>
        <p className="cctr-hero-insight__body">
          {hero.bodyBefore}
          <strong>{hero.bodyHighlight}</strong>
          {hero.bodyAfter}
        </p>
        <p className="cctr-hero-insight__rec">{hero.recommendation}</p>
        <div className="cctr-hero-insight__actions">
          <Button variant="primary" size="sm" disabled>
            {hero.primaryCta}
          </Button>
          <Link to={AUTH_ROUTES.brandCentre} className="cctr-text-link">
            {hero.secondaryCta}
          </Link>
        </div>
      </Card>

      <section className="cctr-home__actions">
        <h2 className="cctr-home__section-title">
          <span aria-hidden="true">⚡</span> Action Required
        </h2>
        <ul className="cctr-action-list">
          {MOCK_BRAND_ACTION_REQUIRED.map((item) => (
            <li key={item.id} className="cctr-action-list__item">
              <div className="cctr-action-list__main">
                <span className="cctr-action-list__emoji" aria-hidden="true">
                  {item.emoji}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span className="cctr-home__meta">{item.meta}</span>
                </div>
              </div>
              <Button variant="primary" size="sm" disabled>
                {item.cta}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <div className="cctr-home__grid">
        <section>
          <div className="cctr-section-head cctr-section-head--row">
            <h2>Active Campaigns</h2>
            <Link to={AUTH_ROUTES.brandUceCampaigns} className="cctr-text-link">
              View All
            </Link>
          </div>
          <ul className="cctr-campaign-list">
            {MOCK_BRAND_ACTIVE_CAMPAIGNS.map((campaign) => (
              <li key={campaign.id} className="cctr-campaign-card">
                <span
                  className={`cctr-campaign-card__thumb cctr-campaign-card__thumb--${campaign.thumbTone}`}
                  aria-hidden="true"
                >
                  {campaign.thumbInitials}
                </span>
                <div className="cctr-campaign-card__body">
                  <strong>{campaign.title}</strong>
                  <span>{campaign.meta}</span>
                </div>
                <Link
                  to={AUTH_ROUTES.brandUceCampaigns}
                  className="cctr-campaign-card__more"
                  aria-label={`Open ${campaign.title}`}
                >
                  ⋮
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="cctr-section-head cctr-section-head--row">
            <h2>Priority Tasks</h2>
          </div>
          <ul className="cctr-task-list">
            {MOCK_BRAND_PRIORITY_TASKS.map((task) => (
              <li key={task.id} className="cctr-task-list__item">
                <label className="cctr-task-list__label">
                  <span
                    className={`cctr-task-list__check${task.urgent ? " cctr-task-list__check--accent" : ""}`}
                    aria-hidden="true"
                  />
                  <span>{task.label}</span>
                </label>
                <span
                  className={`cctr-task-list__due${task.urgent ? " cctr-task-list__due--urgent" : ""}`}
                >
                  {task.due}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
