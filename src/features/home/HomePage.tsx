import { env } from "../../shared/config/env";

export function HomePage() {
  return (
    <main className="coming-soon-shell">
      <section className="coming-soon-card">
        <p className="eyebrow">TheCreatorShop</p>
        <h1>TheCreatorShop coming soon</h1>
        <p className="lede">
          A clean dashboard foundation is ready. Product modules, auth, and
          design system pieces can be added from here.
        </p>
        <dl className="status-grid" aria-label="Application wiring">
          <div>
            <dt>Stage</dt>
            <dd>{env.stage}</dd>
          </div>
          <div>
            <dt>API</dt>
            <dd>{env.apiUrl}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
