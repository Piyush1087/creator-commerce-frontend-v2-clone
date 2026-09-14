import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Alert, Badge, Button, Card } from "../../../design-system/aurora";
import type { CreatorAudienceCohort } from "../contracts/creator-audience.schema";
import { useCreatorAudience } from "../hooks/use-creator-audience";
import { CreatorInsightsNav } from "../../creator-content/components/creator-insights-nav";

const DIMENSION_LABELS = {
  AGE: "Age",
  GENDER: "Gender",
  COUNTRY: "Country",
  CITY: "City",
} as const;

function friendly(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function CohortView({ cohort }: { cohort: CreatorAudienceCohort }) {
  return (
    <Card
      className="creator-audience-cohort"
      title={`${friendly(cohort.id)} audience`}
    >
      {cohort.size !== null && (
        <p className="creator-audience-size">
          <strong>{cohort.size.toLocaleString()}</strong>
          <span>Audience size</span>
        </p>
      )}
      <div className="creator-audience-dimensions">
        {cohort.dimensions.map((dimension) => (
          <section
            className="creator-audience-dimension"
            key={dimension.id}
            aria-labelledby={`dimension-${dimension.id.toLowerCase()}`}
          >
            <div className="creator-audience-dimension__heading">
              <h3 id={`dimension-${dimension.id.toLowerCase()}`}>
                {DIMENSION_LABELS[dimension.id]}
              </h3>
              <Badge
                tone={
                  dimension.state === "AVAILABLE"
                    ? "success"
                    : dimension.state === "PROVIDER_FAILURE"
                      ? "error"
                      : "neutral"
                }
              >
                {friendly(dimension.state)}
              </Badge>
            </div>
            {dimension.state === "AVAILABLE" && dimension.buckets.length > 0 ? (
              <ul className="creator-audience-buckets">
                {dimension.buckets.map((bucket) => (
                  <li key={bucket.key}>
                    <span>{bucket.key}</span>
                    <strong>
                      {bucket.count.toLocaleString()}
                      {bucket.percentage === null
                        ? ""
                        : ` · ${bucket.percentage}%`}
                    </strong>
                    {bucket.percentage !== null && (
                      <span className="creator-audience-bar" aria-hidden="true">
                        <span style={{ width: `${bucket.percentage}%` }} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="creator-audience-empty">
                {dimension.state === "PROVIDER_FAILURE"
                  ? "This dimension could not be loaded."
                  : "This dimension is unavailable; it is not zero."}
              </p>
            )}
          </section>
        ))}
      </div>
    </Card>
  );
}

export function CreatorAudienceWorkspace() {
  const { data, loading, error, preservingLastGood, retry } =
    useCreatorAudience();
  const [selected, setSelected] = useState<"FOLLOWERS" | "ENGAGED" | null>(
    null,
  );
  const usable = useMemo(
    () =>
      data?.cohorts.filter((cohort) => cohort.availability !== "UNAVAILABLE") ??
      [],
    [data],
  );
  useEffect(() => {
    if (!data) return;
    if (!selected || !usable.some((cohort) => cohort.id === selected))
      setSelected(data.defaultCohort);
  }, [data, selected, usable]);

  if (loading && !data)
    return (
      <section
        className="creator-audience"
        aria-label="Audience"
        aria-busy="true"
      >
        <div className="creator-audience-skeleton" />
        <div className="creator-audience-skeleton" />
      </section>
    );
  if (!data)
    return (
      <section className="creator-audience" aria-labelledby="audience-title">
        <h1 id="audience-title">Audience</h1>
        <Alert title="Audience is unavailable" tone="error">
          {error ?? "Try again shortly."}
        </Alert>
        <Button onClick={() => void retry()}>Try again</Button>
      </section>
    );
  const cohort =
    usable.find((item) => item.id === selected) ?? usable[0] ?? null;
  const recovery = data.sourceStatus !== "CONNECTED";
  const chooseCohort = (next: "FOLLOWERS" | "ENGAGED", focus = false) => {
    setSelected(next);
    if (focus) {
      window.setTimeout(
        () =>
          document
            .getElementById(`audience-tab-${next.toLowerCase()}`)
            ?.focus(),
        0,
      );
    }
  };
  const handleCohortKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    chooseCohort(
      event.key === "ArrowLeft" || event.key === "Home"
        ? "FOLLOWERS"
        : "ENGAGED",
      true,
    );
  };

  return (
    <section className="creator-audience" aria-labelledby="audience-title">
      <CreatorInsightsNav current="audience" />
      <header className="creator-audience-header">
        <div>
          <p className="creator-audience-eyebrow">Creator Insights</p>
          <h1 id="audience-title">Audience</h1>
          <p>
            Factual Instagram audience demographics from the current-month
            provider snapshot.
          </p>
        </div>
        <div
          className="creator-audience-source"
          aria-label="Audience source and freshness"
        >
          <Badge tone={recovery ? "pending" : "success"}>
            Instagram · {friendly(data.sourceStatus)}
          </Badge>
          <span>
            {data.snapshotBasis.capturedAt
              ? `Captured ${new Date(data.snapshotBasis.capturedAt).toLocaleString()}`
              : "No captured snapshot yet"}
          </span>
          <span>{friendly(data.freshness.state)}</span>
        </div>
      </header>
      {(preservingLastGood ||
        data.currentPreserved ||
        data.freshness.state === "STALE") && (
        <Alert title="Showing the last good Audience snapshot" tone="warning">
          {error ??
            "The visible facts are preserved while source freshness or processing recovers."}
        </Alert>
      )}
      {data.highlights.length > 0 && (
        <Card
          title="Audience Highlights"
          className="creator-audience-highlights"
        >
          <ul>
            {data.highlights.map((highlight) => (
              <li key={highlight.id}>{highlight.text}</li>
            ))}
          </ul>
        </Card>
      )}
      {usable.length === 2 && (
        <div
          className="creator-audience-tabs"
          role="tablist"
          aria-label="Audience cohort"
        >
          <button
            type="button"
            role="tab"
            id="audience-tab-followers"
            aria-controls="audience-cohort-panel"
            aria-selected={selected === "FOLLOWERS"}
            className={
              selected === "FOLLOWERS"
                ? "aurora-tab aurora-tab--active"
                : "aurora-tab"
            }
            tabIndex={selected === "FOLLOWERS" ? 0 : -1}
            onClick={() => chooseCohort("FOLLOWERS")}
            onKeyDown={handleCohortKeyDown}
          >
            Followers
          </button>
          <button
            type="button"
            role="tab"
            id="audience-tab-engaged"
            aria-controls="audience-cohort-panel"
            aria-selected={selected === "ENGAGED"}
            className={
              selected === "ENGAGED"
                ? "aurora-tab aurora-tab--active"
                : "aurora-tab"
            }
            tabIndex={selected === "ENGAGED" ? 0 : -1}
            onClick={() => chooseCohort("ENGAGED")}
            onKeyDown={handleCohortKeyDown}
          >
            Engaged
          </button>
        </div>
      )}
      {cohort ? (
        <div
          id="audience-cohort-panel"
          role={usable.length === 2 ? "tabpanel" : undefined}
          aria-labelledby={
            usable.length === 2
              ? `audience-tab-${cohort.id.toLowerCase()}`
              : undefined
          }
        >
          <CohortView cohort={cohort} />
        </div>
      ) : (
        <Card title="Audience data">
          <p className="creator-audience-empty">
            No demographic cohort is currently usable. Missing or suppressed
            data is not shown as zero.
          </p>
          {recovery && (
            <Link
              className="creator-audience-settings-link"
              to={data.settingsRecoveryRoute}
            >
              Review Instagram settings
            </Link>
          )}
        </Card>
      )}
      <Card
        title="Data status & limitations"
        className="creator-audience-status"
      >
        <dl>
          <div>
            <dt>Snapshot</dt>
            <dd>Lifetime metric · this month</dd>
          </div>
          <div>
            <dt>Processing</dt>
            <dd>{friendly(data.processingState)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{friendly(data.status)}</dd>
          </div>
        </dl>
        {data.limitations.length > 0 ? (
          <ul>
            {data.limitations.map((item) => (
              <li key={item}>{friendly(item)}</li>
            ))}
          </ul>
        ) : (
          <p>No known limitations in this snapshot.</p>
        )}
        {recovery && (
          <Link
            className="creator-audience-settings-link"
            to={data.settingsRecoveryRoute}
          >
            Review Instagram settings
          </Link>
        )}
      </Card>
    </section>
  );
}
