import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { Badge, Button } from "../../../design-system/aurora";
import type {
  InstagramB4Response,
  InstagramIntelligenceObject,
  InstagramSourceValue,
} from "../contracts/instagram-b4.schemas";

type Props = {
  data: InstagramB4Response;
  isRefreshing: boolean;
  announcement: string;
  cooldownEndsAt: string | null;
  onRefresh: () => Promise<void>;
  onOpenMediaDetail: (mediaId: string) => void;
  registerMediaAction: (
    mediaId: string,
    element: HTMLButtonElement | null,
  ) => void;
  representativePostsHeadingRef: RefObject<HTMLHeadingElement>;
};

const connectionCopy: Record<
  InstagramB4Response["connection"]["state"],
  string
> = {
  NOT_CONNECTED: "Not connected",
  CONNECTING: "Connection in progress",
  CONNECTED: "Connected",
  PARTIAL_CAPABILITY: "Connected with limited access",
  UNKNOWN_CAPABILITY: "Connection access is still being verified",
  REAUTH_REQUIRED: "Reconnect required",
  AUTHORIZATION_DEGRADED: "Connection access has changed",
  SAME_ACCOUNT_RECONNECTING: "Reconnecting the same account",
  DIFFERENT_ACCOUNT_CONFLICT: "Different account needs review",
  TRANSIENT_PROVIDER_FAILURE: "Instagram is temporarily unavailable",
  DISCONNECTED: "Disconnected",
  DELETE_IN_PROGRESS: "Instagram data removal in progress",
};

const syncCopy: Record<InstagramB4Response["sync"]["state"], string> = {
  IDLE: "Analysis up to date",
  INITIALIZING: "Initial analysis is running",
  REFRESHING: "Refresh in progress",
  BACKOFF: "Refresh will retry later",
  BLOCKED: "Analysis needs attention",
};

const componentLabels: Record<string, string> = {
  corpus_summary: "Content reviewed",
  posting_cadence: "Publishing pattern",
  format_mix: "Format and media behavior",
  theme_patterns: "Themes and topics",
  caption_patterns: "Caption behavior",
  creative_structure_patterns: "Creative and visual observations",
  offering_presence_patterns: "Offering presence",
  creator_presence_patterns: "Creator presence",
  follower_audience: "Follower audience",
  engaged_audience: "Engaged audience",
  distribution_concentration: "Audience concentration",
  material_differences: "Audience differences",
  limitations: "Audience limitations",
  summary: "Audience summary",
};

const safeFactLabels: Record<string, string> = {
  follower_count: "Followers",
  following_count: "Following",
  media_count: "Published posts",
  account_type: "Account type",
};

function formatDate(value: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatUnit(
  value: number,
  unit: "COUNT" | "PERCENT" | "SECONDS" | "RATIO",
) {
  if (unit === "PERCENT") return `${value.toLocaleString()}%`;
  if (unit === "SECONDS") return `${value.toLocaleString()} sec`;
  return value.toLocaleString();
}

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sourceValue(value: InstagramSourceValue): string {
  if (value.state !== "AVAILABLE") {
    if (value.state === "NOT_INSPECTED") return "Not inspected";
    if (value.state === "INTENTIONALLY_ABSENT")
      return "Not enough repeated evidence yet";
    if (value.state === "EXPLICIT_NULL") return "Not supplied by Instagram";
    return "Unavailable";
  }
  if (["string", "number", "boolean"].includes(typeof value.value))
    return String(value.value);
  if (
    Array.isArray(value.value) &&
    value.value.every((item) => ["string", "number"].includes(typeof item))
  ) {
    return value.value.join(", ");
  }
  return "Available in the current analysis";
}

function object(
  data: InstagramB4Response,
  semanticId: InstagramIntelligenceObject["semanticId"],
) {
  return data.objects.find((item) => item.semanticId === semanticId)!;
}

function SectionState({
  intelligence,
}: {
  intelligence: InstagramIntelligenceObject;
}) {
  return (
    <div
      className="instagram-workspace__section-state"
      aria-label="Section status"
    >
      <Badge tone={intelligence.readiness === "READY" ? "success" : "neutral"}>
        {label(intelligence.readiness)}
      </Badge>
      <Badge tone={intelligence.freshness === "STALE" ? "pending" : "neutral"}>
        {label(intelligence.freshness)}
      </Badge>
    </div>
  );
}

function SourceComponents({
  intelligence,
  keys,
}: {
  intelligence: InstagramIntelligenceObject;
  keys: string[];
}) {
  return (
    <dl className="instagram-workspace__definition-list">
      {keys.map((key) => {
        const value = intelligence.components[key];
        return value ? (
          <div key={key}>
            <dt>{componentLabels[key]}</dt>
            <dd>{sourceValue(value)}</dd>
          </div>
        ) : null;
      })}
    </dl>
  );
}

export function InstagramWorkspace({
  data,
  isRefreshing,
  announcement,
  cooldownEndsAt,
  onRefresh,
  onOpenMediaDetail,
  registerMediaAction,
  representativePostsHeadingRef,
}: Props) {
  const announcementRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (announcement && !isRefreshing) {
      announcementRef.current?.focus({ preventScroll: true });
    }
  }, [announcement, isRefreshing]);
  const content = object(data, "instagram_content_behavior");
  const audience = object(data, "instagram_audience_profile");
  const performance = object(data, "instagram_organic_performance_profile");
  const hasCurrent = data.objects.some((item) => item.state !== "NO_CURRENT");
  const stale = data.objects.some((item) => item.freshness === "STALE");
  const cooldownActive = Boolean(
    cooldownEndsAt && new Date(cooldownEndsAt).getTime() > Date.now(),
  );
  const canRefresh = data.actions.manualRefresh.state === "ALLOWED";
  const recoveryRequired = [
    "NOT_CONNECTED",
    "REAUTH_REQUIRED",
    "AUTHORIZATION_DEGRADED",
    "DIFFERENT_ACCOUNT_CONFLICT",
    "DISCONNECTED",
    "PARTIAL_CAPABILITY",
    "UNKNOWN_CAPABILITY",
  ].includes(data.connection.state);
  const findings = data.objects.flatMap((item) => item.signals);
  const learnings = data.objects.flatMap((item) => item.learnings);

  return (
    <main className="instagram-workspace" data-testid="instagram-workspace">
      <header className="instagram-workspace__header">
        <div>
          <p className="aurora-card__eyebrow">
            Brand Centre · Instagram · Last 30 days
          </p>
          <h1>Instagram Intelligence</h1>
          <p className="instagram-workspace__lede">
            Understand your organic Instagram performance, content behavior and
            audience response.
          </p>
        </div>
        <div className="instagram-workspace__header-actions">
          {canRefresh ? (
            <Button
              type="button"
              onClick={() => void onRefresh()}
              disabled={isRefreshing || cooldownActive}
              aria-describedby="instagram-refresh-help"
            >
              {isRefreshing
                ? "Requesting refresh…"
                : cooldownActive
                  ? "Refresh cooling down"
                  : "Refresh Instagram"}
            </Button>
          ) : (
            <span className="instagram-workspace__read-only">
              Refresh is unavailable for your role.
            </span>
          )}
          {recoveryRequired && (
            <a
              className="instagram-workspace__settings-link"
              href={data.actions.settingsRecoveryPath}
            >
              Manage connection in Settings
            </a>
          )}
        </div>
        <p
          id="instagram-refresh-help"
          className="instagram-workspace__assistive-copy"
        >
          {cooldownActive
            ? `Next refresh available ${formatDate(cooldownEndsAt)}.`
            : "Refreshes are limited to once every 15 minutes."}
        </p>
        <p
          ref={announcementRef}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
          tabIndex={-1}
        >
          {announcement}
        </p>
      </header>

      <section
        className="instagram-workspace__context"
        aria-labelledby="instagram-context-title"
      >
        <div>
          <p className="instagram-workspace__section-number">1</p>
          <h2 id="instagram-context-title">Account and connection context</h2>
          <p>
            {data.connection.handle
              ? `@${data.connection.handle}`
              : "Instagram account"}
          </p>
        </div>
        <div className="instagram-workspace__badges">
          <Badge
            tone={data.connection.state === "CONNECTED" ? "success" : "pending"}
          >
            {connectionCopy[data.connection.state]}
          </Badge>
          <Badge tone={data.sync.state === "IDLE" ? "success" : "pending"}>
            {syncCopy[data.sync.state]}
          </Badge>
          <Badge tone={stale ? "pending" : "success"}>
            {stale ? "Some intelligence is stale" : "Current intelligence"}
          </Badge>
        </div>
        <dl className="instagram-workspace__context-facts">
          <div>
            <dt>Analysis window</dt>
            <dd>
              {formatDate(data.window.start)} – {formatDate(data.window.end)}
            </dd>
          </div>
          <div>
            <dt>Last successful update</dt>
            <dd>{formatDate(data.sync.lastSuccessAt)}</dd>
          </div>
          <div>
            <dt>Processing</dt>
            <dd>{syncCopy[data.sync.state]}</dd>
          </div>
        </dl>
        {data.accountFacts.filter((fact) => safeFactLabels[fact.semanticId])
          .length > 0 && (
          <dl className="instagram-workspace__context-facts">
            {data.accountFacts
              .filter((fact) => safeFactLabels[fact.semanticId])
              .map((fact) => (
                <div key={fact.semanticId}>
                  <dt>{safeFactLabels[fact.semanticId]}</dt>
                  <dd>{sourceValue(fact.value)}</dd>
                </div>
              ))}
          </dl>
        )}
      </section>

      {(data.sync.currentPreserved ||
        data.connection.state === "TRANSIENT_PROVIDER_FAILURE") &&
        hasCurrent && (
          <div className="instagram-workspace__alert" role="status">
            <strong>Current intelligence is preserved.</strong> The latest
            update was not completed, so the last successful understanding
            remains visible.
          </div>
        )}

      {!hasCurrent && (
        <div className="instagram-workspace__alert" role="status">
          <strong>
            {data.connection.state === "NOT_CONNECTED" ||
            data.connection.state === "DISCONNECTED"
              ? "No connected Instagram account."
              : "Analysis is not ready yet."}
          </strong>{" "}
          {recoveryRequired
            ? "Use Settings to connect or recover access."
            : "Creator Shop will show intelligence when the initial analysis completes."}
        </div>
      )}

      <section
        className="instagram-workspace__section"
        aria-labelledby="instagram-performance-title"
      >
        <p className="instagram-workspace__section-number">2</p>
        <div className="instagram-workspace__section-heading">
          <div>
            <h2 id="instagram-performance-title">Account performance</h2>
            <p>
              Organic Instagram results observed in the fixed 30-day window.
            </p>
          </div>
          <SectionState intelligence={performance} />
        </div>
        {data.accountPerformance.length ? (
          <dl className="instagram-workspace__metrics">
            {data.accountPerformance.map((result) => (
              <div key={`${result.semanticId}-${result.evidenceRefs[0]}`}>
                <dt>{label(result.semanticId)}</dt>
                <dd>
                  {formatUnit(result.value, result.unit)}
                  <small>
                    Based on {result.sampleSize} observed{" "}
                    {result.sampleSize === 1 ? "item" : "items"}
                  </small>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="instagram-workspace__empty">
            Performance metrics are unavailable; missing results are not treated
            as zero.
          </p>
        )}
      </section>

      <section
        className="instagram-workspace__section"
        aria-labelledby="instagram-working-title"
      >
        <p className="instagram-workspace__section-number">3</p>
        <div className="instagram-workspace__section-heading">
          <div>
            <h2 id="instagram-working-title">What is working</h2>
            <p>
              Repeated, sufficiently supported patterns—not single-post
              conclusions.
            </p>
          </div>
        </div>
        {findings.length ? (
          <ul className="instagram-workspace__findings">
            {findings.map((signal) => {
              const learning = learnings.find((item) =>
                item.supportingSignalIds.includes(signal.semanticId),
              );
              return (
                <li key={`${signal.semanticId}-${signal.evidenceRefs[0]}`}>
                  <p className="instagram-workspace__result-label">
                    Signal / pattern
                  </p>
                  <strong>{signal.statement}</strong>
                  <p>
                    Sample {signal.sampleSize} · {signal.metricCoveragePercent}%
                    metric coverage · {label(signal.confidence)} confidence
                  </p>
                  {learning && (
                    <>
                      <p className="instagram-workspace__result-label">
                        Learning
                      </p>
                      <p>{learning.statement}</p>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="instagram-workspace__empty">
            Not enough repeated evidence yet. No single post is presented as a
            pattern.
          </p>
        )}
      </section>

      <section
        className="instagram-workspace__section"
        aria-labelledby="instagram-content-title"
      >
        <p className="instagram-workspace__section-number">4</p>
        <div className="instagram-workspace__section-heading">
          <div>
            <h2 id="instagram-content-title">Content behavior</h2>
            <p>Observable format, publishing, caption and creative behavior.</p>
          </div>
          <SectionState intelligence={content} />
        </div>
        <SourceComponents
          intelligence={content}
          keys={[
            "corpus_summary",
            "posting_cadence",
            "format_mix",
            "theme_patterns",
            "caption_patterns",
            "creative_structure_patterns",
            "offering_presence_patterns",
            "creator_presence_patterns",
          ]}
        />
      </section>

      <section
        className="instagram-workspace__section"
        aria-labelledby="instagram-audience-title"
      >
        <p className="instagram-workspace__section-number">5</p>
        <div className="instagram-workspace__section-heading">
          <div>
            <h2 id="instagram-audience-title">Audience response</h2>
            <p>
              Instagram-native audience observations; unavailable demographics
              are not treated as zero.
            </p>
          </div>
          <SectionState intelligence={audience} />
        </div>
        <SourceComponents
          intelligence={audience}
          keys={[
            "follower_audience",
            "engaged_audience",
            "distribution_concentration",
            "material_differences",
            "summary",
            "limitations",
          ]}
        />
      </section>

      <section
        className="instagram-workspace__section"
        aria-labelledby="instagram-collaboration-title"
      >
        <p className="instagram-workspace__section-number">6</p>
        <div className="instagram-workspace__section-heading">
          <div>
            <h2 id="instagram-collaboration-title">
              Creator and collaboration signals
            </h2>
            <p>
              Instagram-content signals only—not confirmed Creator,
              Collaboration or Campaign records.
            </p>
          </div>
        </div>
        {data.representativeMedia.length ? (
          <ul className="instagram-workspace__signal-list">
            {data.representativeMedia.map((media) => (
              <li key={media.mediaId}>
                <strong>{label(media.likelyCollab.state)}</strong>
                {media.likelyCollab.confidence && (
                  <span>{label(media.likelyCollab.confidence)} confidence</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="instagram-workspace__empty">
            No representative creator or collaboration signals are available.
          </p>
        )}
      </section>

      <section
        className="instagram-workspace__section"
        aria-labelledby="instagram-posts-title"
      >
        <p className="instagram-workspace__section-number">7</p>
        <div className="instagram-workspace__section-heading">
          <div>
            <h2
              ref={representativePostsHeadingRef}
              id="instagram-posts-title"
              tabIndex={-1}
            >
              Representative posts
            </h2>
            <p>Bounded post summaries supporting the current understanding.</p>
          </div>
        </div>
        {data.representativeMedia.length ? (
          <ul className="instagram-workspace__posts">
            {data.representativeMedia.map((media) => (
              <li key={media.mediaId}>
                <div
                  className="instagram-workspace__post-fallback"
                  aria-hidden="true"
                >
                  {media.mediaType === "CAROUSEL_ALBUM"
                    ? "Carousel"
                    : label(media.mediaType)}
                </div>
                <div>
                  <strong>{label(media.mediaType)}</strong>
                  <p>
                    {media.publishedAt.state === "AVAILABLE" &&
                    typeof media.publishedAt.value === "string"
                      ? formatDate(media.publishedAt.value)
                      : sourceValue(media.publishedAt)}
                  </p>
                  <dl>
                    {media.metricHighlights.slice(0, 3).map((metric) => (
                      <div key={metric.metricId}>
                        <dt>{label(metric.metricId)}</dt>
                        <dd>
                          {"value" in metric
                            ? formatUnit(metric.value, metric.unit)
                            : "Unavailable"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <Button
                    ref={(element) =>
                      registerMediaAction(media.mediaId, element)
                    }
                    type="button"
                    variant="secondary"
                    size="sm"
                    aria-label={`View post details for ${label(media.mediaType)} published ${
                      media.publishedAt.state === "AVAILABLE" &&
                      typeof media.publishedAt.value === "string"
                        ? formatDate(media.publishedAt.value)
                        : "on an unavailable date"
                    }`}
                    onClick={() => onOpenMediaDetail(media.mediaId)}
                  >
                    View post details
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="instagram-workspace__empty">
            No safe representative-post summaries are available for this
            analysis.
          </p>
        )}
      </section>

      <section
        className="instagram-workspace__section"
        aria-labelledby="instagram-coverage-title"
      >
        <p className="instagram-workspace__section-number">8</p>
        <div className="instagram-workspace__section-heading">
          <div>
            <h2 id="instagram-coverage-title">Coverage and freshness</h2>
            <p>What was available, inspected and current for this analysis.</p>
          </div>
        </div>
        <dl className="instagram-workspace__coverage">
          {Object.entries(data.coverage).map(([key, value]) => (
            <div key={key}>
              <dt>
                {key === "deepMultimodal"
                  ? "Visual coverage"
                  : key === "lightSemantic"
                    ? "Caption and semantic coverage"
                    : label(key)}
              </dt>
              <dd>
                {value.state === "UNAVAILABLE"
                  ? "Unavailable"
                  : `${value.observedCount} of ${value.eligibleCount}`}
                <small>
                  {value.coveragePercent === null
                    ? "No supported percentage"
                    : `${value.coveragePercent}% coverage`}{" "}
                  · {label(value.state)}
                </small>
              </dd>
            </div>
          ))}
        </dl>
        <p className="instagram-workspace__limitation">
          Some media types, carousel frames, video, audio or audience dimensions
          may remain unavailable or uninspected. Not selected does not mean no
          signal, and stale does not mean false.
        </p>
      </section>
    </main>
  );
}
