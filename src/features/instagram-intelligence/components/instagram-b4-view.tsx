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
  const current = data.contentBehavior;
  const account = data.connection.account;
  return (
    <main className="instagram-b4">
      <header className="instagram-b4__header">
        <p className="aurora-card__eyebrow">Brand Centre · 30-day view</p>
        <h1>Instagram Intelligence</h1>
        <p>
          {account?.handle
            ? `Connected as @${account.handle}`
            : account
              ? "Connected Instagram account"
              : "Instagram account not connected"}
        </p>
      </header>
      {current?.currentPreserved && (
        <section className="instagram-b4__notice" role="status">
          <strong>Latest processing was unsuccessful.</strong> Your last
          successful current insight is preserved.
        </section>
      )}
      {!current ? (
        <section className="aurora-card instagram-b4__card">
          <h2>No current insight</h2>
          <p>
            Connect or recover Instagram in Settings to make verified evidence
            available.
          </p>
          <a href={data.settingsRecoveryPath}>Open Instagram settings</a>
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
          <h2 id="content-observation-title">Content observation</h2>
          <p className="instagram-b4__format">
            <strong>Observed format:</strong> IMAGE
          </p>
          <p>{current.observedImage.description}</p>
          <dl className="instagram-b4__facts">
            <div>
              <dt>Coverage</dt>
              <dd>
                {current.coverage.observedCount} of{" "}
                {current.coverage.eligibleCount} eligible post observed
              </dd>
            </div>
            <div>
              <dt>Deep inspected</dt>
              <dd>{current.coverage.deepInspectedCount} image</dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>{current.evidence.count} verified reference</dd>
            </div>
          </dl>
          <p className="instagram-b4__limitation">{current.limitation}</p>
        </section>
      )}
    </main>
  );
}
