import type { InstagramB4Response } from "../contracts/instagram-b4.schemas";
import { useInstagramB4 } from "../hooks/use-instagram-b4";

export function InstagramB4View() {
  const { data, error, isLoading } = useInstagramB4();
  if (isLoading)
    return (
      <main className="instagram-b4">
        <h1>Instagram Intelligence</h1>
        <p role="status">Loading Instagram Intelligence…</p>
      </main>
    );
  if (error || !data)
    return (
      <main className="instagram-b4">
        <h1>Instagram Intelligence</h1>
        <p role="alert">{error}</p>
      </main>
    );
  return <InstagramB4Content data={data} />;
}

export function InstagramB4Content({ data }: { data: InstagramB4Response }) {
  const current = data.objects.find(
    (item) => item.semanticId === "instagram_content_behavior",
  );
  const account = data.connection.providerAccountId;
  return (
    <main className="instagram-b4">
      <header className="instagram-b4__header">
        <p className="aurora-card__eyebrow">Brand Centre · 30-day view</p>
        <h1>Instagram Intelligence</h1>
        <p>
          {data.connection.handle
            ? `Connected as @${data.connection.handle}`
            : account
              ? "Connected Instagram account"
              : "Instagram account not connected"}
        </p>
      </header>
      {data.sync.currentPreserved && (
        <section className="instagram-b4__notice" role="status">
          <strong>Latest processing was unsuccessful.</strong> Your last
          successful current insight is preserved.
        </section>
      )}
      {!current || current.state === "NO_CURRENT" ? (
        <section className="aurora-card instagram-b4__card">
          <h2>No current insight</h2>
          <p>
            Connect or recover Instagram in Settings to make verified evidence
            available.
          </p>
          <a href={data.actions.settingsRecoveryPath}>
            Open Instagram settings
          </a>
        </section>
      ) : (
        <section
          className="aurora-card instagram-b4__card"
          aria-labelledby="content-observation-title"
        >
          <div className="instagram-b4__status">
            <span>Partial</span>
            <span>{current.freshness === "CURRENT" ? "Current" : "Stale"}</span>
          </div>
          <h2 id="content-observation-title">Content behavior</h2>
          <p>
            Database-backed Instagram evidence is available for this 30-day
            window. Inconclusive components remain explicitly unavailable.
          </p>
          <dl className="instagram-b4__facts">
            <div>
              <dt>Coverage</dt>
              <dd>
                {data.coverage.inventory.observedCount} of{" "}
                {data.coverage.inventory.eligibleCount} eligible posts observed
              </dd>
            </div>
            <div>
              <dt>Deep inspected</dt>
              <dd>{data.coverage.deepMultimodal.observedCount} media</dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>{current.evidenceRefs.length} verified references</dd>
            </div>
          </dl>
          <p className="instagram-b4__limitation">
            Patterns and learnings remain unavailable until evidence thresholds
            are met.
          </p>
        </section>
      )}
    </main>
  );
}
