import { Link } from "react-router-dom";

import { Badge, Button, Card } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import {
  MOCK_ACTION_REQUIRED,
  MOCK_ACTIVE_CAMPAIGNS,
  MOCK_CREATOR_PROFILE,
  MOCK_HERO_OPPORTUNITY,
  MOCK_HOME_SNAPSHOT,
  MOCK_PRIORITY_TASKS,
} from "../mock-data/centre-mock";

import "../creator-centre.css";

/**
 * Home / Daily Briefing — content column only.
 * Desktop assistant + mobile FAB live in CreatorCentreShell / page layout.
 * Source: Stitch AI Assistant Integrated + Master Spec.
 */
export function HomeBriefingWorkspace() {
  const profile = MOCK_CREATOR_PROFILE;
  const hero = MOCK_HERO_OPPORTUNITY;

  return (
    <div className="cctr-workspace cctr-home cctr-canvas">
      <p className="cctr-demo-chip">Stitch · AI Assistant Integrated</p>

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
        {MOCK_HOME_SNAPSHOT.map((card) => (
          <Card key={card.id} className="cctr-snapshot-card">
            <p className="cctr-snapshot-card__title">
              <span aria-hidden="true">{card.emoji}</span> {card.title}
            </p>
            <div className="cctr-snapshot-card__value-row">
              <p className="cctr-kpi__value">{card.value}</p>
              {"badge" in card && card.badge ? (
                <Badge tone="success">{card.badge}</Badge>
              ) : null}
            </div>
            {card.detail ? (
              <p className="cctr-snapshot-card__detail">{card.detail}</p>
            ) : (
              <div className="cctr-snapshot-card__spacer" />
            )}
            {card.actionStyle === "button" ? (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="cctr-snapshot-card__btn"
              >
                {card.action}
              </Button>
            ) : (
              <button type="button" className="cctr-text-link" disabled>
                {card.action}
              </button>
            )}
          </Card>
        ))}
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
          <Link to={AUTH_ROUTES.creatorAnalytics} className="cctr-text-link">
            {hero.secondaryCta}
          </Link>
        </div>
      </Card>

      <section className="cctr-home__actions">
        <h2 className="cctr-home__section-title">
          <span aria-hidden="true">⚡</span> Action Required
        </h2>
        <ul className="cctr-action-list">
          {MOCK_ACTION_REQUIRED.map((item) => (
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
            <Link to={AUTH_ROUTES.creatorCampaigns} className="cctr-text-link">
              View All
            </Link>
          </div>
          <ul className="cctr-campaign-list">
            {MOCK_ACTIVE_CAMPAIGNS.map((campaign) => (
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
                  to={AUTH_ROUTES.creatorCampaigns}
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
            {MOCK_PRIORITY_TASKS.map((task) => (
              <li key={task.id} className="cctr-task-list__item">
                <label className="cctr-task-list__label">
                  <span
                    className={`cctr-task-list__check${task.urgent ? " cctr-task-list__check--accent" : ""}`}
                    aria-hidden="true"
                  />
                  <span>{task.label}</span>
                </label>
                <Badge tone={task.urgent ? "error" : "neutral"}>{task.due}</Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
