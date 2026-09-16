import type {
  PublicMediaKit,
  VerifiedMediaKit,
} from "../creator-media-kit.contracts";
import { sendPublicMediaKitEvent } from "../creator-media-kit.client";

type Projection =
  | PublicMediaKit
  | VerifiedMediaKit
  | Omit<VerifiedMediaKit, "contractVersion">;

export function MediaKitProjection({
  value,
  publicId,
  onRevealEmail,
  onWorkWithCreator,
  publicOnly = false,
}: {
  value: Projection;
  publicId: string;
  onRevealEmail: () => void;
  onWorkWithCreator?: () => void;
  publicOnly?: boolean;
}) {
  const identity = value.identity;
  const verified = "sections" in value && !publicOnly ? value.sections : null;
  const visuals = "visuals" in value ? value.visuals : [];
  return (
    <article className="media-kit-sheet" aria-labelledby="media-kit-title">
      <header className="media-kit-hero">
        {identity.avatarUrl ? (
          <img className="media-kit-avatar" src={identity.avatarUrl} alt="" />
        ) : (
          <div className="media-kit-avatar media-kit-avatar--empty" aria-hidden>
            {identity.name?.slice(0, 1).toUpperCase() ?? "C"}
          </div>
        )}
        <div>
          <p className="media-kit-eyebrow">Creator Media Kit</p>
          <h1 id="media-kit-title">{identity.name ?? "Creator"}</h1>
          {identity.instagramHandle ? (
            <p>@{identity.instagramHandle.replace(/^@/u, "")}</p>
          ) : null}
          {identity.headline ? (
            <p className="media-kit-lede">{identity.headline}</p>
          ) : null}
          {identity.bio ? <p>{identity.bio}</p> : null}
        </div>
      </header>

      {visuals.length ? (
        <section aria-labelledby="media-kit-visuals">
          <h2 id="media-kit-visuals">Selected work</h2>
          <div className="media-kit-visual-grid">
            {visuals.map((visual) => (
              <a
                key={visual.visualId}
                href={visual.sourceDestination}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  void sendPublicMediaKitEvent(
                    publicId,
                    "PUBLIC_THUMBNAIL_SOURCE_OPENED",
                  )
                }
              >
                {visual.staticAssetUrl ? (
                  <img src={visual.staticAssetUrl} alt={visual.altText} />
                ) : (
                  <span className="media-kit-no-image">
                    No public image available
                    <small>Open source</small>
                  </span>
                )}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {verified?.audience ? (
        <section>
          <h2>Audience</h2>
          <p className="media-kit-state">{verified.audience.state}</p>
          {verified.audience.facts.length ? (
            <ul className="media-kit-facts">
              {verified.audience.facts.map((fact, index) => (
                <li key={index}>
                  {[fact.dimension, fact.bucket, fact.percentage]
                    .filter((item) => item !== null && item !== undefined)
                    .join(" · ")}
                </li>
              ))}
            </ul>
          ) : (
            <p>Audience facts are not currently available.</p>
          )}
        </section>
      ) : null}

      {verified?.content ? (
        <section>
          <h2>Content &amp; Performance</h2>
          <p className="media-kit-state">{verified.content.state}</p>
          <div className="media-kit-pills">
            {verified.content.themes.map((theme, index) => (
              <span key={index}>{String(theme.value ?? "Theme")}</span>
            ))}
          </div>
          {verified.content.performance.length === 0 ? (
            <p>Performance comparison is not currently available.</p>
          ) : (
            <ul className="media-kit-facts">
              {verified.content.performance.map((claim, index) => (
                <li key={index}>
                  {[claim.cohort, claim.metric, claim.direction]
                    .filter(Boolean)
                    .join(" · ")}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {verified?.portfolio ? (
        <section>
          <h2>Portfolio</h2>
          {verified.portfolio.items.length ? (
            <ol className="media-kit-portfolio">
              {verified.portfolio.items.map((item) => (
                <li key={item.id}>
                  <strong>{String(item.title ?? "Work reference")}</strong>
                  {typeof item.sourceDestination === "string" ? (
                    <a
                      href={item.sourceDestination}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open source
                    </a>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p>No featured Portfolio items are currently available.</p>
          )}
        </section>
      ) : null}

      {verified?.rateCard ? (
        <section>
          <h2>Work With Me / Rate Card</h2>
          {verified.rateCard.lines.length ? (
            <ul className="media-kit-rates">
              {verified.rateCard.lines.map((line, index) => (
                <li key={index}>
                  <span>{String(line.key ?? "Rate")}</span>
                  <strong>
                    Starting from {String(verified.rateCard?.currency ?? "")}{" "}
                    {String(line.amountMinor ?? "")}
                  </strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>Rate Card is not currently available.</p>
          )}
          <small>
            Indicative starting points only. Final pricing depends on the brief
            and mutually accepted scope.
          </small>
        </section>
      ) : null}

      {verified ? (
        <section>
          <h2>Availability</h2>
          <p>
            Based in {String(verified.availability.basedIn ?? "Unavailable")} ·{" "}
            {String(verified.availability.availability ?? "Unavailable")}
          </p>
          <small>Informational only; contact actions remain available.</small>
        </section>
      ) : null}

      <section
        className="media-kit-actions"
        aria-labelledby="media-kit-contact"
      >
        <h2 id="media-kit-contact">Connect</h2>
        <div>
          <button
            type="button"
            onClick={() => {
              void sendPublicMediaKitEvent(publicId, "WORK_WITH_CREATOR_CLICK");
              onWorkWithCreator?.();
            }}
          >
            <strong>Work with Creator</strong>
            <span>Start a collaboration</span>
          </button>
          <button type="button" onClick={onRevealEmail}>
            <strong>Reveal Email ID</strong>
            <span>Agencies and email enquiries</span>
          </button>
        </div>
      </section>
    </article>
  );
}
