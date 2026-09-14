import { Link } from "react-router-dom";
import { Alert, Badge, Button, Card } from "../../../design-system/aurora";
import { useCreatorContent } from "../hooks/use-creator-content";
import { CreatorInsightsNav } from "./creator-insights-nav";

const friendly = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
const percent = (value: number) => `${Math.round(value * 100)}%`;

export function CreatorContentWorkspace() {
  const { data, loading, error, preservingLastGood, retry } =
    useCreatorContent();
  if (loading && !data)
    return (
      <section
        className="creator-content"
        aria-label="Content"
        aria-busy="true"
      >
        <CreatorInsightsNav current="content" />
        <div className="creator-content-skeleton" />
        <div className="creator-content-skeleton" />
      </section>
    );
  if (!data)
    return (
      <section className="creator-content" aria-labelledby="content-title">
        <CreatorInsightsNav current="content" />
        <h1 id="content-title">Content</h1>
        <Alert title="Content insights are unavailable" tone="error">
          {error ?? "Try again shortly."}
        </Alert>
        <Button onClick={() => void retry()}>Try again</Button>
      </section>
    );
  const recovery = data.sourceStatus !== "CONNECTED";
  return (
    <section className="creator-content" aria-labelledby="content-title">
      <CreatorInsightsNav current="content" />
      <header className="creator-content-header">
        <div>
          <p className="creator-content-eyebrow">Creator Insights</p>
          <h1 id="content-title">Content</h1>
          <p>
            Factual patterns from up to 24 recent Instagram posts in the last 90
            days.
          </p>
        </div>
        <div
          className="creator-content-source"
          aria-label="Content source and freshness"
        >
          <Badge tone={recovery ? "pending" : "success"}>
            Instagram · {friendly(data.sourceStatus)}
          </Badge>
          <span>
            {data.freshness.capturedAt
              ? `Captured ${new Date(data.freshness.capturedAt).toLocaleString()}`
              : "No captured snapshot yet"}
          </span>
          <span>{friendly(data.freshness.state)}</span>
        </div>
      </header>
      {(preservingLastGood ||
        data.currentPreserved ||
        data.freshness.state === "STALE") && (
        <Alert title="Showing the last good Content snapshot" tone="warning">
          {error ??
            "The visible facts are preserved while source freshness or processing recovers."}
        </Alert>
      )}
      <Card title="Content Snapshot">
        <dl className="creator-content-stats">
          <div>
            <dt>Eligible posts</dt>
            <dd>{data.snapshot.eligibleCount}</dd>
          </div>
          <div>
            <dt>Window</dt>
            <dd>{data.snapshot.windowDays} days</dd>
          </div>
          <div>
            <dt>Coverage</dt>
            <dd>{percent(data.snapshot.coverage)}</dd>
          </div>
        </dl>
      </Card>
      <Card title="Content Highlights">
        {data.highlights.length ? (
          <ul className="creator-content-list">
            {data.highlights.map((item) => (
              <li key={item.id}>
                <span>{item.text}</span>
                <Badge tone="neutral">{friendly(item.confidence)}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="creator-content-empty">
            No supported highlight is available yet.
          </p>
        )}
      </Card>
      <Card title="What You Create">
        <div className="creator-content-columns">
          <section aria-labelledby="content-themes">
            <h3 id="content-themes">Themes</h3>
            {data.whatYouCreate.themes.length ? (
              <ul>
                {data.whatYouCreate.themes.map((item) => (
                  <li key={item.value}>
                    {item.value} <strong>{item.postCount}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="creator-content-empty">
                Theme evidence is unavailable.
              </p>
            )}
          </section>
          <section aria-labelledby="content-formats">
            <h3 id="content-formats">Formats</h3>
            {data.whatYouCreate.formats.length ? (
              <ul>
                {data.whatYouCreate.formats.map((item) => (
                  <li key={item.value}>
                    {friendly(item.value)} <strong>{item.postCount}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="creator-content-empty">No posts are available.</p>
            )}
          </section>
        </div>
      </Card>
      <Card title="Content Performance">
        {data.performance.claims.length ? (
          <ul className="creator-content-list">
            {data.performance.claims.map((claim) => (
              <li key={claim.id}>
                <span>
                  <strong>{claim.cohort}</strong> was{" "}
                  {claim.direction.toLowerCase()} on {friendly(claim.metric)}{" "}
                  across {claim.cohortSample} posts versus{" "}
                  {claim.complementSample} others.
                </span>
                <Badge tone="neutral">{friendly(claim.confidence)}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="creator-content-empty">
            No comparison meets the sample, coverage, and materiality gates.
          </p>
        )}
      </Card>
      <Card title="Representative Content">
        {data.representatives.length ? (
          <ul className="creator-content-representatives">
            {data.representatives.map((item) => (
              <li key={item.providerMediaId}>
                <div>
                  <strong>
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </strong>
                  <p>{item.reason}</p>
                </div>
                {item.permalink && (
                  <a href={item.permalink} target="_blank" rel="noreferrer">
                    View on Instagram
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="creator-content-empty">
            No representative post is available.
          </p>
        )}
      </Card>
      <Card title="Data Status & Limitations">
        <dl className="creator-content-stats">
          <div>
            <dt>Processing</dt>
            <dd>{friendly(data.processingState)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{friendly(data.status)}</dd>
          </div>
          <div>
            <dt>Rows returned</dt>
            <dd>{data.snapshot.providerRowsReturned}</dd>
          </div>
        </dl>
        {data.limitations.length ? (
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
            className="creator-content-settings-link"
            to={data.settingsRecoveryRoute}
          >
            Review Instagram settings
          </Link>
        )}
      </Card>
    </section>
  );
}
