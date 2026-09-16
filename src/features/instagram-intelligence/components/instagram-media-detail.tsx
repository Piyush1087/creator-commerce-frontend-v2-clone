import type { RefObject } from "react";
import { Badge, Button, SideDrawer } from "../../../design-system/aurora";
import type {
  InstagramMediaDetail,
  InstagramSourceValue,
} from "../contracts/instagram-b4.schemas";
import type { InstagramMediaDetailState } from "../hooks/use-instagram-media-detail";
import { safeInstagramPermalink } from "./instagram-media-detail-safety";

const stateCopy: Record<string, string> = {
  PRESENT: "Observed",
  POSSIBLE: "Possible",
  NOT_OBSERVED: "Not observed",
  UNKNOWN: "Unknown",
  LIKELY_COLLAB: "Likely collaboration signal",
  POSSIBLE_COLLAB: "Possible collaboration signal",
  NO_COLLAB_SIGNAL: "No collaboration signal observed",
  LIGHT_ONLY: "Caption and lightweight observation",
  DEEP_SELECTED: "Selected for visual inspection",
  COVER_ONLY: "Cover only",
  PARTIAL_DEEP: "Partial visual inspection",
  NOT_INSPECTED: "Visual inspection not available",
  IMAGE: "Image",
  CAROUSEL_ALBUM: "Carousel",
  REELS: "Reel",
  VIDEO: "Video",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const limitationCopy: Record<string, string> = {
  MEDIA_NOT_SELECTED_FOR_DEEP_ANALYSIS:
    "This post was not selected for deeper visual inspection.",
  CAROUSEL_CHILD_UNAVAILABLE: "Representative carousel coverage was partial.",
  VIDEO_NOT_ANALYZED: "Video content was not visually inspected.",
  AUDIO_NOT_ANALYZED: "Audio was not inspected.",
  TRANSCRIPT_NOT_ACQUIRED: "A transcript was not available.",
  COVER_ONLY: "Only the representative cover was inspected.",
  NOT_INSPECTED: "Visual inspection was not available.",
  INSUFFICIENT_EVIDENCE: "Available evidence was insufficient.",
};

function words(value: string): string {
  return (
    stateCopy[value] ??
    value
      .toLowerCase()
      .replace(/_/gu, " ")
      .replace(/^./u, (letter) => letter.toUpperCase())
  );
}

function date(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function availableString(value: InstagramSourceValue): string | null {
  return value.state === "AVAILABLE" && typeof value.value === "string"
    ? value.value
    : null;
}

function MetricValue({
  metric,
}: {
  metric: InstagramMediaDetail["metrics"][number];
}) {
  if (
    metric.availability === "OBSERVED" ||
    metric.availability === "OBSERVED_ZERO"
  ) {
    return (
      <>
        <strong>{metric.value.toLocaleString()}</strong>
        <span>{words(metric.unit)}</span>
        <small>{words(metric.availability)}</small>
        {metric.denominator.state === "AVAILABLE" && (
          <small>Basis: {String(metric.denominator.value)}</small>
        )}
      </>
    );
  }
  return (
    <>
      <strong>{words(metric.availability)}</strong>
      <small>Not treated as zero.</small>
    </>
  );
}

function SemanticValues({
  title,
  values,
}: {
  title: string;
  values: InstagramMediaDetail["themes"];
}) {
  return (
    <div className="instagram-detail__observation-group">
      <h4>{title}</h4>
      {values.length ? (
        <ul>
          {values.map((value, index) => (
            <li key={`${title}-${index}`}>
              <span>{value.label}</span>
              <small>{words(value.confidence)} confidence</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>Not available from this post.</p>
      )}
    </div>
  );
}

function ReadyDetail({ detail }: { detail: InstagramMediaDetail }) {
  const permalink = safeInstagramPermalink(detail.permalink);
  const caption = availableString(detail.caption);
  const publishedAt = availableString(detail.publishedAt);
  const limitations = Array.from(
    new Set([...detail.coverage.limitations, ...detail.inspection.reasonCodes]),
  );
  return (
    <div className="instagram-detail">
      <section aria-labelledby="instagram-detail-context">
        <h3 id="instagram-detail-context">1. Media context</h3>
        <dl className="instagram-detail__facts">
          <div>
            <dt>Media type</dt>
            <dd>{words(detail.mediaType)}</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>{publishedAt ? date(publishedAt) : "Unavailable"}</dd>
          </div>
          <div>
            <dt>Inspection</dt>
            <dd>{words(detail.inspection.depth)}</dd>
          </div>
        </dl>
        <div className="instagram-detail__caption">
          <h4>Caption</h4>
          <p>{caption ?? "Caption unavailable."}</p>
        </div>
        {detail.hashtags.length > 0 && (
          <div>
            <h4>Hashtags</h4>
            <ul className="instagram-detail__tokens">
              {detail.hashtags.map((item, index) => (
                <li key={`hashtag-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {detail.mentions.length > 0 && (
          <div>
            <h4>Mentions</h4>
            <ul className="instagram-detail__tokens">
              {detail.mentions.map((item, index) => (
                <li key={`mention-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {permalink ? (
          <a href={permalink} target="_blank" rel="noopener noreferrer">
            View on Instagram
          </a>
        ) : (
          <p className="instagram-detail__muted">Instagram link unavailable.</p>
        )}
      </section>

      <section aria-labelledby="instagram-detail-performance">
        <h3 id="instagram-detail-performance">2. Observed performance</h3>
        {detail.metrics.length ? (
          <ul className="instagram-detail__metrics">
            {detail.metrics.map((metric, index) => (
              <li key={`metric-${index}`}>
                <span>{words(metric.metricId)}</span>
                <MetricValue metric={metric} />
              </li>
            ))}
          </ul>
        ) : (
          <p>No supported performance metrics are available.</p>
        )}
      </section>

      <section aria-labelledby="instagram-detail-content">
        <h3 id="instagram-detail-content">3. Content observations</h3>
        <SemanticValues title="Themes" values={detail.themes} />
        <SemanticValues
          title="Caption patterns"
          values={detail.captionPatterns}
        />
        <SemanticValues
          title="Creative structures"
          values={detail.creativeStructures}
        />
        <SemanticValues
          title="Visual executions"
          values={detail.visualExecutions}
        />
      </section>

      <section aria-labelledby="instagram-detail-presence">
        <h3 id="instagram-detail-presence">4. Creator / Offering presence</h3>
        <dl className="instagram-detail__facts">
          <div>
            <dt>Creator presence</dt>
            <dd>{words(detail.creatorPresence.state)}</dd>
          </div>
          <div>
            <dt>Offering presence</dt>
            <dd>{words(detail.offeringPresence.state)}</dd>
          </div>
        </dl>
        <p className="instagram-detail__muted">
          Source-native observations only; these are not canonical Creator,
          Offering, Campaign, or ownership records.
        </p>
      </section>

      <section aria-labelledby="instagram-detail-collab">
        <h3 id="instagram-detail-collab">5. Likely-collab signal</h3>
        <Badge
          tone={detail.likelyCollab.state === "UNKNOWN" ? "pending" : "success"}
        >
          {words(detail.likelyCollab.state)}
        </Badge>
        {detail.likelyCollab.confidence && (
          <p>{words(detail.likelyCollab.confidence)} confidence</p>
        )}
        <p className="instagram-detail__disclaimer">
          Instagram-content signal only; not a confirmed Creator Shop
          Collaboration.
        </p>
      </section>

      <section aria-labelledby="instagram-detail-coverage">
        <h3 id="instagram-detail-coverage">
          6. Inspection, coverage and provenance
        </h3>
        <p>Observed from this Instagram post.</p>
        <p>
          Supported by {detail.coverage.sourceEvidenceCount} evidence{" "}
          {detail.coverage.sourceEvidenceCount === 1 ? "item" : "items"}.
        </p>
        <p>Captured on {date(detail.evidence.capturedAt)}.</p>
        <dl className="instagram-detail__facts">
          <div>
            <dt>Inspection depth</dt>
            <dd>{words(detail.inspection.depth)}</dd>
          </div>
          <div>
            <dt>Deep-inspection selection</dt>
            <dd>
              {detail.inspection.selectedForDeepAnalysis
                ? "Selected"
                : "Not selected"}
            </dd>
          </div>
          <div>
            <dt>Carousel children</dt>
            <dd>
              {detail.inspection.inspectedChildCount} inspected of{" "}
              {detail.inspection.availableChildCount} available
            </dd>
          </div>
          <div>
            <dt>Video frames inspected</dt>
            <dd>{detail.inspection.inspectedFrameCount}</dd>
          </div>
        </dl>
        {limitations.length > 0 && (
          <div>
            <h4>Coverage limitations</h4>
            <ul>
              {limitations.map((item, index) => (
                <li key={`limitation-${index}`}>
                  {limitationCopy[item] ??
                    "Some supporting information was unavailable."}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

const errorCopy: Partial<Record<InstagramMediaDetailState["kind"], string>> = {
  DETAIL_INVALID_RESPONSE: "Post detail could not be safely displayed.",
  DETAIL_NOT_FOUND: "This post detail is no longer available.",
  DETAIL_UNAUTHORIZED: "Your session could not authorize this post detail.",
  DETAIL_FORBIDDEN:
    "This post detail is not available in the current Brand workspace.",
  DETAIL_TRANSIENT_ERROR: "Post detail is temporarily unavailable.",
  DETAIL_STALE_OR_CHANGED_GENERATION:
    "This post detail is no longer available.",
  DETAIL_REMOVED_AFTER_REFRESH: "This post detail is no longer available.",
};

export function InstagramMediaDetailDrawer({
  state,
  onClose,
  onRetry,
  restoreFocusRef,
}: {
  state: InstagramMediaDetailState;
  onClose: () => void;
  onRetry: () => void;
  restoreFocusRef: RefObject<HTMLElement>;
}) {
  const loading =
    state.kind === "DETAIL_LOADING" || state.kind === "DETAIL_RETRYING";
  return (
    <SideDrawer
      isOpen
      onClose={onClose}
      title="Post details"
      subtitle="Instagram content observation"
      closeLabel="Close post details"
      restoreFocusRef={restoreFocusRef}
      className="instagram-detail-surface"
      contentClassName="instagram-detail-surface__content"
      width="min(42rem, 92vw)"
    >
      {loading ? (
        <p role="status">
          {state.kind === "DETAIL_RETRYING"
            ? "Retrying post detail…"
            : "Loading post detail…"}
        </p>
      ) : state.kind === "DETAIL_READY" ? (
        <ReadyDetail detail={state.detail} />
      ) : (
        <div className="instagram-detail__error" role="alert">
          <p>{errorCopy[state.kind]}</p>
          {state.kind !== "DETAIL_UNAUTHORIZED" &&
            state.kind !== "DETAIL_FORBIDDEN" && (
              <Button type="button" variant="secondary" onClick={onRetry}>
                Retry post detail
              </Button>
            )}
        </div>
      )}
    </SideDrawer>
  );
}
