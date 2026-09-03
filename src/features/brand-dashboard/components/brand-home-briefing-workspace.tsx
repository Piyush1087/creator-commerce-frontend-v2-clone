import { Link } from "react-router-dom";

import { Alert, Badge, Button } from "../../../design-system/aurora";
import { resolveBrandDestinationNavigation } from "../../auth/navigation/brand-destination-navigation";
import {
  BRAND_HOME_SECTION_IDS,
  type BrandHomeItem,
  type BrandHomeNavigation,
  type BrandHomeResponse,
} from "../contracts/brand-home.schemas";
import { useBrandHome } from "../hooks/use-brand-home";

import "../../creator-centre/creator-centre.css";

const SECTION_LABELS: Record<(typeof BRAND_HOME_SECTION_IDS)[number], string> = {
  NEEDS_ATTENTION: "Needs Attention",
  CREATOR_SHOP_HAS_LEARNED: "Creator Shop Has Learned",
  OPPORTUNITIES_NEXT_ACTIONS: "Opportunities / Next Actions",
  CURRENT_MOMENTUM: "Current Momentum",
};

const EMPTY_COPY: Record<(typeof BRAND_HOME_SECTION_IDS)[number], string> = {
  NEEDS_ATTENTION: "Nothing needs your attention right now.",
  CREATOR_SHOP_HAS_LEARNED: "No new grounded learning is available right now.",
  OPPORTUNITIES_NEXT_ACTIONS: "No grounded next action is available right now.",
  CURRENT_MOMENTUM: "No current momentum is available to show right now.",
};

const DESTINATION_LABELS: Record<
  BrandHomeNavigation["destinationId"],
  string
> = {
  HOME: "Open Home",
  BRAND_CENTRE: "Open Brand Centre",
  OFFERINGS: "Open Offerings",
  CAMPAIGNS: "Open Campaigns",
  COLLABORATIONS: "Open Collaborations",
  SETTINGS: "Open Settings",
  SETTINGS_INTEGRATIONS: "Open Integrations",
  SETTINGS_BILLING: "Open Billing",
};

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function displayEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function displayDate(value: string): string {
  return DATE_FORMATTER.format(new Date(value));
}

function FreshnessBadge({ item }: { item: BrandHomeItem }) {
  if (item.freshness.state === "STALE") {
    return <Badge tone="pending">Stale</Badge>;
  }
  if (item.freshness.state === "UNKNOWN") {
    return <Badge tone="neutral">Freshness unknown</Badge>;
  }
  return <Badge tone="success">Current</Badge>;
}

function SectionStateBadge({
  state,
}: {
  state: BrandHomeResponse["sections"][number]["state"];
}) {
  const tone =
    state === "READY"
      ? "success"
      : state === "UNAVAILABLE"
        ? "error"
        : state === "PARTIAL"
          ? "pending"
          : "neutral";
  return <Badge tone={tone}>{displayEnum(state)}</Badge>;
}

function safeNavigationPath(navigation: BrandHomeNavigation): string | null {
  try {
    return resolveBrandDestinationNavigation(navigation);
  } catch {
    return null;
  }
}

function BrandHomeItemView({ item }: { item: BrandHomeItem }) {
  const path = safeNavigationPath(item.navigation);

  return (
    <li className="brand-home-item">
      <article aria-labelledby={`brand-home-item-${item.id}`}>
        <div className="brand-home-item__heading">
          <div>
            <p className="brand-home-item__priority">
              {displayEnum(item.priorityTier)}
            </p>
            <h3 id={`brand-home-item-${item.id}`}>{item.title}</h3>
          </div>
          <FreshnessBadge item={item} />
        </div>

        <p className="brand-home-item__summary">{item.summary}</p>

        <dl className="brand-home-item__metadata">
          <div>
            <dt>Observed</dt>
            <dd>
              <time dateTime={item.freshness.observedAt}>
                {displayDate(item.freshness.observedAt)}
              </time>
            </dd>
          </div>
          {item.freshness.changedAt ? (
            <div>
              <dt>Changed</dt>
              <dd>
                <time dateTime={item.freshness.changedAt}>
                  {displayDate(item.freshness.changedAt)}
                </time>
              </dd>
            </div>
          ) : null}
          {item.freshness.dueAt ? (
            <div>
              <dt>Due</dt>
              <dd>
                <time dateTime={item.freshness.dueAt}>
                  {displayDate(item.freshness.dueAt)}
                </time>
              </dd>
            </div>
          ) : null}
        </dl>

        {item.recommendation ? (
          <div className="brand-home-item__recommendation">
            <strong>Suggested next step</strong>
            <p>{item.recommendation.text}</p>
          </div>
        ) : null}

        {item.limitations.length > 0 ? (
          <div className="brand-home-disclosure">
            <strong>Limitations</strong>
            <ul>
              {item.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="brand-home-item__footer">
          <span className="brand-home-item__sources">
            Sources: {item.sourceDomains.map(displayEnum).join(", ")}
          </span>
          {path ? (
            <Link className="brand-home-action" to={path}>
              {DESTINATION_LABELS[item.navigation.destinationId]}
              <span aria-hidden="true"> →</span>
            </Link>
          ) : (
            <span className="brand-home-action brand-home-action--unavailable">
              Destination unavailable
            </span>
          )}
        </div>
      </article>
    </li>
  );
}

function SourceDisclosures({ data }: { data: BrandHomeResponse }) {
  const materialSources = data.sourceStates.filter(
    (source) =>
      source.state !== "READY" ||
      source.freshness !== "CURRENT" ||
      source.truncated ||
      source.limitations.length > 0,
  );

  if (materialSources.length === 0) return null;

  return (
    <details className="brand-home-sources">
      <summary>Source status and limitations ({materialSources.length})</summary>
      <ul>
        {materialSources.map((source) => (
          <li key={source.sourceDomain}>
            <div className="brand-home-sources__heading">
              <strong>{displayEnum(source.sourceDomain)}</strong>
              <span>
                <Badge
                  tone={
                    source.state === "UNAVAILABLE"
                      ? "error"
                      : source.state === "PARTIAL"
                        ? "pending"
                        : "success"
                  }
                >
                  {displayEnum(source.state)}
                </Badge>
                {source.freshness !== "CURRENT" ? (
                  <Badge tone="pending">
                    {source.freshness === "STALE"
                      ? "Stale"
                      : "Freshness unknown"}
                  </Badge>
                ) : null}
                {source.truncated ? (
                  <Badge tone="neutral">Limited result set</Badge>
                ) : null}
              </span>
            </div>
            <p>
              Observed {displayDate(source.observedAt)}
              {source.limitations.length > 0
                ? ` — ${source.limitations.join(" ")}`
                : ""}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}

function HomeSection({
  section,
}: {
  section: BrandHomeResponse["sections"][number];
}) {
  const headingId = `brand-home-section-${section.id}`;
  const showItems = section.state === "READY" || section.state === "PARTIAL";

  return (
    <section
      className="aurora-card brand-home-section"
      aria-labelledby={headingId}
      data-section-id={section.id}
    >
      <header className="brand-home-section__heading">
        <h2 id={headingId}>{SECTION_LABELS[section.id]}</h2>
        <SectionStateBadge state={section.state} />
      </header>

      {section.state === "EMPTY" ? (
        <p className="brand-home-section__state-copy">{EMPTY_COPY[section.id]}</p>
      ) : null}
      {section.state === "PARTIAL" ? (
        <p className="brand-home-section__state-copy" role="status">
          Some source information is limited. Available grounded items remain
          visible.
        </p>
      ) : null}
      {section.state === "UNAVAILABLE" ? (
        <p className="brand-home-section__state-copy" role="status">
          This section is temporarily unavailable.
        </p>
      ) : null}

      {showItems && section.items.length > 0 ? (
        <ul className="brand-home-section__items">
          {section.items.map((item) => (
            <BrandHomeItemView key={item.id} item={item} />
          ))}
        </ul>
      ) : null}
      {showItems && section.items.length === 0 ? (
        <p className="brand-home-section__state-copy">
          No grounded items are available in this section right now.
        </p>
      ) : null}
    </section>
  );
}

function LoadingSections() {
  return (
    <div className="brand-home-sections" aria-hidden="true">
      {BRAND_HOME_SECTION_IDS.map((sectionId) => (
        <section
          className="aurora-card brand-home-section brand-home-section--loading"
          key={sectionId}
        >
          <h2>{SECTION_LABELS[sectionId]}</h2>
          <span className="brand-home-loading-line" />
          <span className="brand-home-loading-line brand-home-loading-line--short" />
        </section>
      ))}
    </div>
  );
}

function FailedSections() {
  return (
    <div className="brand-home-sections">
      {BRAND_HOME_SECTION_IDS.map((sectionId) => (
        <section
          className="aurora-card brand-home-section"
          aria-labelledby={`failed-${sectionId}`}
          key={sectionId}
        >
          <header className="brand-home-section__heading">
            <h2 id={`failed-${sectionId}`}>{SECTION_LABELS[sectionId]}</h2>
            <Badge tone="error">Unavailable</Badge>
          </header>
          <p className="brand-home-section__state-copy">
            This section could not be loaded.
          </p>
        </section>
      ))}
    </div>
  );
}

/** Brand Home: the permanent Home 1.0 aggregator consumer. */
export function BrandHomeBriefingWorkspace() {
  const { data, isLoading, error, refresh } = useBrandHome();

  return (
    <div className="cctr-workspace cctr-home cctr-canvas brand-home">
      <header className="brand-home__welcome">
        <div>
          <p className="brand-home__eyebrow">Daily briefing</p>
          <h1>Brand Home</h1>
          <p className="brand-home__subtitle">
            {data
              ? `Grounded priorities and momentum for ${data.brand.displayName}.`
              : "Grounded priorities, learning, next actions, and momentum."}
          </p>
        </div>
        {data ? (
          <span className="brand-home__updated">
            Updated{" "}
            <time dateTime={data.generatedAt}>{displayDate(data.generatedAt)}</time>
          </span>
        ) : null}
      </header>

      {isLoading ? (
        <div className="brand-home-request-state">
          <p role="status" aria-live="polite">
            Loading Brand Home…
          </p>
          <LoadingSections />
        </div>
      ) : null}

      {error ? (
        <div className="brand-home-request-state">
          <div role="alert">
            <Alert title="Could not load Brand Home" tone="error">
              {error}
            </Alert>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            Try again
          </Button>
          <FailedSections />
        </div>
      ) : null}

      {data ? (
        <>
          {data.status === "PARTIAL" ? (
            <div role="status">
              <Alert title="Some Home information is limited" tone="warning">
                Available grounded sections remain visible below.
              </Alert>
            </div>
          ) : null}
          {data.status === "UNAVAILABLE" ? (
            <div role="alert">
              <Alert title="Brand Home information is unavailable" tone="error">
                The available section status is shown below. Ask Creator Shop
                remains available independently.
              </Alert>
            </div>
          ) : null}
          {data.truncated ? (
            <div role="status">
              <Alert title="This is a bounded briefing" tone="warning">
                Additional grounded items may exist beyond this result set.
              </Alert>
            </div>
          ) : null}
          {data.limitations.length > 0 ? (
            <div className="brand-home-disclosure brand-home-disclosure--global">
              <strong>Briefing limitations</strong>
              <ul>
                {data.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <SourceDisclosures data={data} />
          <div className="brand-home-sections">
            {data.sections.map((section) => (
              <HomeSection key={section.id} section={section} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
